<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DonorProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_and_update_their_contact_profile_with_optional_address(): void
    {
        $owner = $this->makeUser('dog_owner', null);

        $this->actingAs($owner)
            ->getJson('/api/donor/profile')
            ->assertOk()
            ->assertJsonPath('full_name', 'Test Owner')
            ->assertJsonPath('address', null);

        $this->putJson('/api/donor/profile', [
            'full_name' => 'Updated Owner',
            'email' => 'updated-owner@example.test',
            'phone' => '+639123456789',
            'address' => '',
        ])->assertOk()->assertJsonPath('profile.address', null);

        $this->assertDatabaseHas('users', [
            'user_id' => $owner->user_id,
            'full_name' => 'Updated Owner',
            'email' => 'updated-owner@example.test',
            'address' => null,
        ]);
    }

    public function test_owner_can_change_password_after_confirming_current_password(): void
    {
        $owner = $this->makeUser('dog_owner', null);

        $this->actingAs($owner)->putJson('/api/donor/profile', [
            'full_name' => 'Test Owner',
            'email' => $owner->email,
            'current_password' => 'current-password',
            'new_password' => 'replacement-password-456',
            'new_password_confirmation' => 'replacement-password-456',
        ])->assertOk();

        $this->assertTrue(Hash::check('replacement-password-456', $owner->fresh()->password_hash));
    }

    public function test_owner_can_create_multiple_dog_profiles_and_new_profiles_need_veterinary_review(): void
    {
        $clinicId = $this->makeClinic();
        $owner = $this->makeUser('dog_owner', $clinicId);
        $bloodTypeId = $this->makeBloodType('DEA 1.1 Positive');
        $this->makeDog($owner, $clinicId, $bloodTypeId, 'Buddy', 'verified');

        $response = $this->actingAs($owner)->postJson('/api/donor/dogs', [
            'name' => 'Luna',
            'breed' => 'Labrador Retriever',
            'sex' => 'female',
            'age_years' => 3,
            'blood_type' => 'DEA 1.1 Positive',
        ])->assertCreated()
            ->assertJsonPath('dog.name', 'Luna')
            ->assertJsonPath('dog.blood_type', 'DEA 1.1 Positive')
            ->assertJsonPath('dog.eligibility_status', 'pending_review');

        $this->getJson('/api/donor/dogs')
            ->assertOk()
            ->assertJsonCount(2, 'dogs')
            ->assertJsonPath('dogs.0.eligibility_status', 'verified')
            ->assertJsonPath('dogs.1.eligibility_status', 'pending_review');

        $this->assertDatabaseHas('dogs', [
            'dog_id' => $response->json('dog.dog_id'),
            'owner_user_id' => $owner->user_id,
            'registered_clinic_id' => $clinicId,
            'availability_status' => 'unavailable',
        ]);
    }

    public function test_owner_can_save_an_untested_dog_but_human_abo_types_are_rejected(): void
    {
        $clinicId = $this->makeClinic();
        $owner = $this->makeUser('dog_owner', $clinicId);
        $this->makeBloodType('O+');

        $this->actingAs($owner)->postJson('/api/donor/dogs', [
            'name' => 'New Dog',
            'breed' => 'Aspin',
            'sex' => 'female',
            'age_years' => 2,
            'blood_type' => null,
        ])->assertCreated()
            ->assertJsonPath('dog.blood_type', null)
            ->assertJsonPath('dog.eligibility_status', 'pending_review');

        $this->postJson('/api/donor/dogs', [
            'name' => 'ABO Dog',
            'breed' => 'Aspin',
            'sex' => 'male',
            'age_years' => 2,
            'blood_type' => 'O+',
        ])->assertUnprocessable();
    }

    public function test_editing_dog_clinical_details_returns_it_to_veterinary_review(): void
    {
        $clinicId = $this->makeClinic();
        $owner = $this->makeUser('dog_owner', $clinicId);
        $this->makeBloodType('DEA 1.1 Positive');
        $dogId = $this->makeDog($owner, $clinicId, $this->bloodTypeId('DEA 1.1 Positive'), 'Buddy', 'verified');

        $this->actingAs($owner)->patchJson("/api/donor/dogs/{$dogId}", [
            'name' => 'Buddy',
            'breed' => 'Aspin',
            'sex' => 'male',
            'age_years' => 5,
            'blood_type' => 'DEA 1.1 Positive',
        ])->assertOk()->assertJsonPath('dog.eligibility_status', 'pending_review');

        $this->assertDatabaseHas('dogs', [
            'dog_id' => $dogId,
            'breed' => 'Aspin',
            'eligibility_status' => 'pending_review',
            'availability_status' => 'unavailable',
        ]);
    }

    public function test_owner_cannot_read_or_update_another_owners_dog_or_change_password_without_current_password(): void
    {
        $clinicId = $this->makeClinic();
        $owner = $this->makeUser('dog_owner', $clinicId);
        $otherOwner = $this->makeUser('dog_owner', $clinicId);
        $bloodTypeId = $this->makeBloodType('DEA 4');
        $otherDogId = $this->makeDog($otherOwner, $clinicId, $bloodTypeId, 'Other Dog', 'verified');

        $this->actingAs($owner)
            ->getJson('/api/donor/dogs')
            ->assertOk()
            ->assertJsonCount(0, 'dogs');

        $this->patchJson("/api/donor/dogs/{$otherDogId}", [
            'name' => 'Hijack',
            'breed' => 'Aspin',
            'sex' => 'male',
            'age_years' => 2,
            'blood_type' => 'DEA 4',
        ])->assertNotFound();

        $this->putJson('/api/donor/profile', [
            'full_name' => 'Test Owner',
            'email' => $owner->email,
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ])->assertUnprocessable();

        $this->putJson('/api/donor/profile', [
            'full_name' => 'Test Owner',
            'email' => $owner->email,
            'current_password' => 'wrong-password',
            'new_password' => 'new-password-123',
            'new_password_confirmation' => 'new-password-123',
        ])->assertUnprocessable()->assertJsonPath('message', 'The current password is incorrect.');
    }

    public function test_donor_profile_routes_require_dog_owner_authentication(): void
    {
        $clinicId = $this->makeClinic();
        $clinicUser = $this->makeUser('clinic_admin', $clinicId);

        $this->getJson('/api/donor/profile')->assertUnauthorized();
        $this->actingAs($clinicUser)->getJson('/api/donor/profile')->assertForbidden();
    }

    private function makeClinic(): int
    {
        $officeId = DB::table('provincial_offices')->insertGetId([
            'name' => 'Test Office',
            'created_at' => now(),
        ], 'office_id');

        return DB::table('clinics')->insertGetId([
            'provincial_office_id' => $officeId,
            'name' => 'Test Clinic',
            'address' => 'Tagum City',
            'is_active' => true,
            'created_at' => now(),
        ], 'clinic_id');
    }

    private function makeUser(string $role, ?int $clinicId): User
    {
        return User::create([
            'role' => $role,
            'clinic_id' => $clinicId,
            'full_name' => 'Test Owner',
            'email' => uniqid('owner-', true).'@example.test',
            'phone' => '+639000000000',
            'password_hash' => Hash::make('current-password'),
            'is_active' => true,
        ]);
    }

    private function makeBloodType(string $code): int
    {
        $existingId = DB::table('blood_types')->where('code', $code)->value('blood_type_id');
        if ($existingId) {
            return (int) $existingId;
        }

        return DB::table('blood_types')->insertGetId([
            'code' => $code,
            'description' => 'Test type',
        ], 'blood_type_id');
    }

    private function bloodTypeId(string $code): int
    {
        return (int) DB::table('blood_types')->where('code', $code)->value('blood_type_id');
    }

    private function makeDog(User $owner, int $clinicId, int $bloodTypeId, string $name, string $status): int
    {
        return DB::table('dogs')->insertGetId([
            'owner_user_id' => $owner->user_id,
            'registered_clinic_id' => $clinicId,
            'name' => $name,
            'breed' => 'Aspin',
            'sex' => 'male',
            'date_of_birth' => now()->subYears(4)->toDateString(),
            'blood_type_id' => $bloodTypeId,
            'eligibility_status' => $status,
            'availability_status' => $status === 'verified' ? 'available' : 'unavailable',
            'created_at' => now(),
            'updated_at' => now(),
        ], 'dog_id');
    }
}