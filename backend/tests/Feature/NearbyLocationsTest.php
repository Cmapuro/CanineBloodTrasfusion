<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class NearbyLocationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_nearby_locations_requires_authenticated_clinic_staff(): void
    {
        $this->getJson('/api/nearby-locations?latitude=7.44&longitude=125.80&radius=10')
            ->assertUnauthorized();

        $owner = $this->makeUser('dog_owner', null);
        $this->actingAs($owner)
            ->getJson('/api/nearby-locations?latitude=7.44&longitude=125.80&radius=10')
            ->assertForbidden();
    }

    public function test_map_returns_clinics_and_only_consented_verified_available_donors(): void
    {
        $clinicId = $this->makeClinic('Clinic A', 7.4475, 125.8078);
        $clinicUser = $this->makeUser('clinic_admin', $clinicId);
        $owner = $this->makeUser('dog_owner', $clinicId);
        $bloodTypeId = $this->makeBloodType('O+');

        $this->makeDog($owner, $clinicId, $bloodTypeId, 'verified', 'available', true);
        $this->makeDog($owner, $clinicId, $bloodTypeId, 'verified', 'available', false);
        $this->makeDog($owner, $clinicId, $bloodTypeId, 'pending_review', 'available', true);
        $this->makeDog($owner, $clinicId, $bloodTypeId, 'verified', 'on_cooldown', true);

        $response = $this->actingAs($clinicUser)->getJson(
            '/api/nearby-locations?latitude=7.44&longitude=125.80&radius=10&type=all'
        )->assertOk();

        $this->assertCount(2, $response->json('locations'));
        $this->assertSame(['clinic', 'donor'], collect($response->json('locations'))->pluck('type')->sort()->values()->all());
        $donor = collect($response->json('locations'))->firstWhere('type', 'donor');
        $this->assertSame('O+', $donor['blood_type']);
        $this->assertSame(1, $donor['donor_count']);
        $this->assertSame(7.45, $donor['latitude']);
        $this->assertArrayNotHasKey('owner_user_id', $donor);
        $this->assertArrayNotHasKey('dog_id', $donor);
    }

    public function test_cross_clinic_donor_requires_a_live_access_grant(): void
    {
        $requestingClinicId = $this->makeClinic('Requesting Clinic', 7.4475, 125.8078);
        $owningClinicId = $this->makeClinic('Owning Clinic', 7.4510, 125.8090);
        $clinicUser = $this->makeUser('clinic_admin', $requestingClinicId);
        $owner = $this->makeUser('dog_owner', $owningClinicId);
        $dogId = $this->makeDog($owner, $owningClinicId, $this->makeBloodType('A+'), 'verified', 'available', true);
        $requestId = DB::table('access_requests')->insertGetId([
            'requesting_clinic_id' => $requestingClinicId,
            'owning_clinic_id' => $owningClinicId,
            'dog_id' => null,
            'reason' => 'Nearby coordination test',
            'requested_by' => $clinicUser->user_id,
            'status' => 'approved',
            'responded_by' => $clinicUser->user_id,
            'requested_at' => now(),
            'responded_at' => now(),
            'expires_at' => now()->addDay(),
        ], 'access_request_id');

        $url = '/api/nearby-locations?latitude=7.44&longitude=125.80&radius=10&type=donor';
        $this->actingAs($clinicUser)->getJson($url)->assertOk()->assertJsonCount(0, 'locations');

        DB::table('access_grants')->insert([
            'access_request_id' => $requestId,
            'requesting_clinic_id' => $requestingClinicId,
            'owning_clinic_id' => $owningClinicId,
            'dog_id' => $dogId,
            'granted_at' => now(),
            'expires_at' => now()->addHour(),
            'revoked_at' => null,
        ]);
        $this->getJson($url)->assertOk()->assertJsonCount(1, 'locations');

        DB::table('access_grants')->update(['expires_at' => now()->subMinute()]);
        $this->getJson($url)->assertOk()->assertJsonCount(0, 'locations');
    }

    public function test_dog_owner_can_manage_only_their_own_location_sharing_consent(): void
    {
        $clinicId = $this->makeClinic('Clinic A', 7.4475, 125.8078);
        $owner = $this->makeUser('dog_owner', $clinicId);
        $otherOwner = $this->makeUser('dog_owner', $clinicId);
        $bloodTypeId = $this->makeBloodType('O+');
        $ownDogId = $this->makeDog($owner, $clinicId, $bloodTypeId, 'verified', 'available', false);
        $otherDogId = $this->makeDog($otherOwner, $clinicId, $bloodTypeId, 'verified', 'available', false);

        $this->actingAs($owner)
            ->putJson("/api/donor/dogs/{$ownDogId}/location-sharing", ['consent' => true])
            ->assertOk();

        $this->assertSame('donor_location_consent_granted', DB::table('audit_log')->value('action'));
        $this->putJson("/api/donor/dogs/{$otherDogId}/location-sharing", ['consent' => true])
            ->assertNotFound();

        $this->getJson('/api/donor/location-sharing')
            ->assertOk()
            ->assertJsonPath('dogs.0.location_sharing_consent', true);
    }

    private function makeClinic(string $name, float $latitude, float $longitude): int
    {
        $officeId = DB::table('provincial_offices')->insertGetId([
            'name' => $name.' Office',
            'created_at' => now(),
        ], 'office_id');

        return DB::table('clinics')->insertGetId([
            'provincial_office_id' => $officeId,
            'name' => $name,
            'address' => 'Tagum City',
            'latitude' => $latitude,
            'longitude' => $longitude,
            'is_active' => true,
            'created_at' => now(),
        ], 'clinic_id');
    }

    private function makeUser(string $role, ?int $clinicId): User
    {
        return User::create([
            'role' => $role,
            'clinic_id' => $clinicId,
            'full_name' => 'Test '.$role,
            'email' => uniqid('user-', true).'@example.test',
            'password_hash' => Hash::make('password'),
            'is_active' => true,
        ]);
    }

    private function makeBloodType(string $code): int
    {
        return DB::table('blood_types')->insertGetId([
            'code' => $code,
            'description' => 'Test blood type',
        ], 'blood_type_id');
    }

    private function makeDog(
        User $owner,
        int $clinicId,
        int $bloodTypeId,
        string $eligibility,
        string $availability,
        bool $consent
    ): int {
        return DB::table('dogs')->insertGetId([
            'owner_user_id' => $owner->user_id,
            'registered_clinic_id' => $clinicId,
            'name' => 'Test Dog',
            'blood_type_id' => $bloodTypeId,
            'eligibility_status' => $eligibility,
            'availability_status' => $availability,
            'location_sharing_consent' => $consent,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'dog_id');
    }
}
