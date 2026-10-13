<?php

namespace Tests\Feature;

use App\Models\EmergencyRequest;
use App\Models\User;
use App\Services\RelayDonorMatches;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\QueryException;
use Tests\TestCase;

class EmergencyLocationSharingTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_only_an_owner_granted_active_request_exposes_the_current_location_and_revocation_ends_access(): void
    {
        [$clinicId, $clinicUser, $owner, $dogId] = $this->makeScenario();
        $request = $this->createRequest($clinicUser);
        $matchId = $request->json('matches.0.match_id');

        $this->actingAs($owner)->getJson('/api/clinic/matches')->assertForbidden();
        $this->actingAs($owner)->postJson("/api/matches/{$matchId}/respond", ['decision' => 'accepted'])->assertOk();
        $this->putJson("/api/matches/{$matchId}/location-sharing", [
            'consent' => true,
            'latitude' => 7.451,
            'longitude' => 125.812,
        ])->assertOk()->assertJsonPath('location_permission_status', 'granted');

        $encryptedLocation = DB::table('donor_locations')->where('dog_id', $dogId)->first();
        $this->assertNotSame('7.451', $encryptedLocation->latitude_encrypted);
        $this->assertStringNotContainsString('125.812', $encryptedLocation->longitude_encrypted);

        $this->actingAs($clinicUser)->getJson('/api/clinic/matches')
            ->assertOk()
            ->assertJsonPath('0.latitude', 7.451)
            ->assertJsonPath('0.longitude', 125.812)
            ->assertJsonPath('0.location_permission_status', 'granted');

        $otherClinic = $this->makeClinic('Other clinic', 7.46, 125.82);
        $otherClinicUser = $this->makeUser('clinic_admin', $otherClinic);
        $this->actingAs($otherClinicUser)->getJson('/api/clinic/matches')->assertOk()->assertExactJson([]);

        $this->actingAs($owner)->putJson("/api/matches/{$matchId}/location-sharing", ['consent' => false])
            ->assertOk()
            ->assertJsonPath('location_permission_status', 'revoked');
        $this->assertDatabaseMissing('donor_locations', ['dog_id' => $dogId]);
        $this->actingAs($clinicUser)->getJson('/api/clinic/matches')
            ->assertOk()
            ->assertJsonMissingPath('0.latitude')
            ->assertJsonPath('0.location_permission_status', 'revoked');
    }

    public function test_another_owner_cannot_grant_location_and_invalid_coordinates_are_rejected(): void
    {
        [$clinicId, $clinicUser, $owner, $dogId] = $this->makeScenario();
        $request = $this->createRequest($clinicUser);
        $matchId = $request->json('matches.0.match_id');

        $otherOwner = $this->makeUser('dog_owner', $clinicId);
        $this->actingAs($otherOwner)->putJson("/api/matches/{$matchId}/location-sharing", [
            'consent' => true,
            'latitude' => 7.45,
            'longitude' => 125.81,
        ])->assertNotFound();

        $this->actingAs($owner)->postJson("/api/matches/{$matchId}/respond", ['decision' => 'accepted'])->assertOk();
        $this->putJson("/api/matches/{$matchId}/location-sharing", [
            'consent' => true,
            'latitude' => 91,
            'longitude' => 125.81,
        ])->assertUnprocessable();
        $this->assertDatabaseMissing('donor_locations', ['dog_id' => $dogId]);
    }

    public function test_opted_in_location_produces_only_an_approximate_distance_until_request_specific_permission(): void
    {
        [$clinicId, $clinicUser, $owner, $dogId] = $this->makeScenario();
        $this->actingAs($owner)->putJson("/api/donor/dogs/{$dogId}/location-sharing", ['consent' => true])->assertOk();
        $this->putJson("/api/donor/dogs/{$dogId}/location", [
            'latitude' => 7.451,
            'longitude' => 125.812,
        ])->assertOk();

        $request = $this->createRequest($clinicUser);
        $matchId = $request->json('matches.0.match_id');
        $this->actingAs($owner)->postJson("/api/matches/{$matchId}/respond", ['decision' => 'accepted'])->assertOk();

        $clinicMatch = $this->actingAs($clinicUser)->getJson('/api/clinic/matches')
            ->assertOk()
            ->json('0');
        $this->assertGreaterThan(0, $clinicMatch['distance_km']);
        $this->assertNull($clinicMatch['travel_time_minutes']);
        $this->assertArrayNotHasKey('latitude', $clinicMatch);
        $this->assertArrayNotHasKey('longitude', $clinicMatch);
    }

    public function test_expired_location_is_not_returned_and_clinic_cannot_access_location_without_authentication(): void
    {
        [$clinicId, $clinicUser, $owner, $dogId] = $this->makeScenario();
        $request = $this->createRequest($clinicUser);
        $matchId = $request->json('matches.0.match_id');
        $this->actingAs($owner)->postJson("/api/matches/{$matchId}/respond", ['decision' => 'accepted'])->assertOk();
        $this->putJson("/api/matches/{$matchId}/location-sharing", [
            'consent' => true,
            'latitude' => 7.451,
            'longitude' => 125.812,
        ])->assertOk();
        DB::table('donor_locations')->where('dog_id', $dogId)->update(['captured_at' => now()->subHour()]);

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/clinic/matches')->assertUnauthorized();

        $this->actingAs($clinicUser)->getJson('/api/clinic/matches')
            ->assertOk()
            ->assertJsonMissingPath('0.latitude')
            ->assertJsonPath('0.distance_km', null);
    }

    public function test_request_timeout_relays_to_the_next_eligible_donor(): void
    {
        Carbon::setTestNow(now());
        config(['caninelink.response_window_minutes' => 15]);
        $clinicId = $this->makeClinic('Requesting clinic', 7.44, 125.80);
        $clinicUser = $this->makeUser('clinic_admin', $clinicId);
        $bloodTypeId = $this->makeBloodType('O+');
        $firstOwner = $this->makeUser('dog_owner', $clinicId);
        $secondOwner = $this->makeUser('dog_owner', $clinicId);
        $this->makeDog($firstOwner, $clinicId, $bloodTypeId);
        $this->makeDog($secondOwner, $clinicId, $bloodTypeId);
        $created = $this->createRequest($clinicUser);

        $matches = DB::table('request_matches')->where('request_id', $created->json('request_id'))->orderBy('rank_order')->get();
        $this->assertSame('notified', $matches[0]->status);
        $this->assertSame('queued', $matches[1]->status);
        $this->assertDatabaseHas('notifications', ['user_id' => $firstOwner->user_id, 'type' => 'emergency_request']);

        Carbon::setTestNow(now()->addMinutes(16));
        $emergencyRequest = EmergencyRequest::withoutGlobalScopes()->findOrFail($created->json('request_id'));
        app(RelayDonorMatches::class)->notifyNext($emergencyRequest);

        $this->assertDatabaseHas('request_matches', ['match_id' => $matches[0]->match_id, 'status' => 'timed_out']);
        $this->assertDatabaseHas('request_matches', ['match_id' => $matches[1]->match_id, 'status' => 'notified']);
        $this->assertDatabaseHas('notifications', ['user_id' => $secondOwner->user_id, 'type' => 'emergency_request']);
    }

    public function test_owner_can_deny_location_and_declining_a_request_relays_without_sharing_coordinates(): void
    {
        $clinicId = $this->makeClinic('Requesting clinic', 7.44, 125.80);
        $clinicUser = $this->makeUser('clinic_admin', $clinicId);
        $bloodTypeId = $this->makeBloodType('O+');
        $owners = [
            $this->makeUser('dog_owner', $clinicId),
            $this->makeUser('dog_owner', $clinicId),
        ];
        $dogs = [
            $this->makeDog($owners[0], $clinicId, $bloodTypeId),
            $this->makeDog($owners[1], $clinicId, $bloodTypeId),
        ];
        $created = $this->createRequest($clinicUser);
        $firstMatch = DB::table('request_matches')->where('match_id', $created->json('matches.0.match_id'))->first();
        $firstOwnerIndex = array_search((int) $firstMatch->dog_id, $dogs, true);
        $firstOwner = $owners[$firstOwnerIndex];

        $this->actingAs($firstOwner)->postJson("/api/matches/{$firstMatch->match_id}/respond", ['decision' => 'declined'])->assertOk();
        $this->assertDatabaseHas('request_matches', ['match_id' => $firstMatch->match_id, 'status' => 'declined']);
        $nextMatch = DB::table('request_matches')
            ->where('request_id', $created->json('request_id'))
            ->where('status', 'notified')
            ->first();
        $this->assertNotNull($nextMatch);

        $nextDog = DB::table('dogs')->where('dog_id', $nextMatch->dog_id)->first();
        $nextOwner = User::findOrFail($nextDog->owner_user_id);
        $this->actingAs($nextOwner)->postJson("/api/matches/{$nextMatch->match_id}/respond", ['decision' => 'accepted'])->assertOk();
        $this->putJson("/api/matches/{$nextMatch->match_id}/location-sharing", ['consent' => false])
            ->assertOk()
            ->assertJsonPath('location_permission_status', 'denied');

        $this->actingAs($clinicUser)->getJson('/api/clinic/matches')
            ->assertOk()
            ->assertJsonMissingPath('1.latitude');
        $this->assertDatabaseMissing('donor_locations', ['dog_id' => $nextMatch->dog_id]);
        $this->assertSame('available', DB::table('dogs')->where('dog_id', $firstMatch->dog_id)->value('availability_status'));
        $this->assertSame('in_process', DB::table('dogs')->where('dog_id', $nextMatch->dog_id)->value('availability_status'));
    }

    public function test_notification_delivery_failure_rolls_back_matching_instead_of_returning_success(): void
    {
        [$clinicId, $clinicUser] = $this->makeScenario();
        DB::statement("CREATE TRIGGER fail_notifications BEFORE INSERT ON notifications BEGIN SELECT RAISE(ABORT, 'notification service unavailable'); END");

        $this->withoutExceptionHandling();
        try {
            $this->createRequest($clinicUser);
            $this->fail('The failed notification must not return a successful emergency request.');
        } catch (QueryException $exception) {
            $this->assertStringContainsString('notification service unavailable', $exception->getMessage());
        } finally {
            DB::statement('DROP TRIGGER fail_notifications');
        }

        $this->assertDatabaseCount('emergency_requests', 0);
        $this->assertDatabaseCount('request_matches', 0);
        $this->assertSame('available', DB::table('dogs')->value('availability_status'));
    }

    public function test_location_expiration_and_completion_close_access_and_record_donation_history(): void
    {
        Carbon::setTestNow(now());
        config(['caninelink.temporary_location_hours' => 1]);
        [$clinicId, $clinicUser, $owner, $dogId] = $this->makeScenario();
        $request = $this->createRequest($clinicUser);
        $requestId = $request->json('request_id');
        $matchId = $request->json('matches.0.match_id');
        $this->actingAs($owner)->postJson("/api/matches/{$matchId}/respond", ['decision' => 'accepted'])->assertOk();
        $this->putJson("/api/matches/{$matchId}/location-sharing", [
            'consent' => true,
            'latitude' => 7.451,
            'longitude' => 125.812,
        ])->assertOk();

        Carbon::setTestNow(now()->addHours(2));
        $this->actingAs($clinicUser)->getJson('/api/clinic/matches')
            ->assertOk()
            ->assertJsonMissingPath('0.latitude')
            ->assertJsonPath('0.location_permission_status', 'expired');
        $this->postJson("/api/emergency-requests/{$requestId}/complete", ['volume_ml' => 300])
            ->assertOk();

        $this->assertDatabaseHas('donation_history', [
            'dog_id' => $dogId,
            'emergency_request_id' => $requestId,
            'volume_ml' => 300,
        ]);
        $this->assertDatabaseHas('emergency_requests', ['request_id' => $requestId, 'status' => 'fulfilled']);
        $this->assertDatabaseHas('dogs', ['dog_id' => $dogId, 'availability_status' => 'on_cooldown']);
        $this->assertDatabaseHas('request_matches', [
            'match_id' => $matchId,
            'status' => 'completed',
            'location_permission_status' => 'expired',
        ]);
        $this->actingAs($owner)->getJson('/api/donor/donation-history')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.dog_id', $dogId)
            ->assertJsonPath('0.patient_name', 'Emergency patient');
    }

    public function test_cancelling_an_emergency_ends_temporary_location_access(): void
    {
        [$clinicId, $clinicUser, $owner, $dogId] = $this->makeScenario();
        $request = $this->createRequest($clinicUser);
        $requestId = $request->json('request_id');
        $matchId = $request->json('matches.0.match_id');
        $this->actingAs($owner)->postJson("/api/matches/{$matchId}/respond", ['decision' => 'accepted'])->assertOk();
        $this->putJson("/api/matches/{$matchId}/location-sharing", [
            'consent' => true,
            'latitude' => 7.451,
            'longitude' => 125.812,
        ])->assertOk();

        $this->actingAs($clinicUser)->postJson("/api/emergency-requests/{$requestId}/cancel")->assertOk();
        $this->getJson('/api/clinic/matches')
            ->assertOk()
            ->assertJsonMissingPath('0.latitude')
            ->assertJsonPath('0.request_status', 'cancelled');
        $this->assertDatabaseHas('request_matches', [
            'match_id' => $matchId,
            'location_permission_status' => 'expired',
        ]);
    }

    private function makeScenario(): array
    {
        $clinicId = $this->makeClinic('Requesting clinic', 7.44, 125.80);
        $clinicUser = $this->makeUser('clinic_admin', $clinicId);
        $owner = $this->makeUser('dog_owner', $clinicId);
        $dogId = $this->makeDog($owner, $clinicId, $this->makeBloodType('O+'));

        return [$clinicId, $clinicUser, $owner, $dogId];
    }

    private function createRequest(User $clinicUser)
    {
        return $this->actingAs($clinicUser)->postJson('/api/emergency-requests', [
            'patient_name' => 'Emergency patient',
            'patient_breed' => 'Mixed',
            'patient_weight_kg' => 20,
            'blood_type' => 'O+',
            'units_needed' => 1,
            'urgency_level' => 'urgent',
        ])->assertCreated();
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
        $existingId = DB::table('blood_types')->where('code', $code)->value('blood_type_id');
        return $existingId ?: DB::table('blood_types')->insertGetId([
            'code' => $code,
            'description' => 'Test blood type',
        ], 'blood_type_id');
    }

    private function makeDog(User $owner, int $clinicId, int $bloodTypeId): int
    {
        return DB::table('dogs')->insertGetId([
            'owner_user_id' => $owner->user_id,
            'registered_clinic_id' => $clinicId,
            'name' => 'Test Dog',
            'weight_kg' => 30,
            'blood_type_id' => $bloodTypeId,
            'eligibility_status' => 'verified',
            'availability_status' => 'available',
            'created_at' => now(),
            'updated_at' => now(),
        ], 'dog_id');
    }
}
