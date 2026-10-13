<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ClinicDonorReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_clinic_staff_can_review_only_dogs_assigned_to_their_clinic(): void
    {
        $clinicId = $this->makeClinic('Clinic One');
        $otherClinicId = $this->makeClinic('Clinic Two');
        $vet = $this->makeUser('clinic_admin', $clinicId);
        $owner = $this->makeUser('dog_owner', $clinicId);
        $dogId = $this->makeDog($owner, $clinicId);
        $otherOwner = $this->makeUser('dog_owner', $otherClinicId);
        $otherDogId = $this->makeDog($otherOwner, $otherClinicId);

        $this->actingAs($vet)->getJson('/api/clinic/donor-dogs')
            ->assertOk()
            ->assertJsonCount(1, 'dogs')
            ->assertJsonPath('dogs.0.dog_id', $dogId)
            ->assertJsonPath('dogs.0.owner_name', $owner->full_name);

        $this->patchJson("/api/clinic/donor-dogs/{$otherDogId}/verification", [
            'decision' => 'approved',
            'blood_type' => 'DEA 4',
        ])->assertNotFound();
    }

    public function test_only_clinic_staff_can_access_review_queue(): void
    {
        $clinicId = $this->makeClinic('Clinic One');
        $owner = $this->makeUser('dog_owner', $clinicId);

        $this->getJson('/api/clinic/donor-dogs')->assertUnauthorized();
        $this->actingAs($owner)->getJson('/api/clinic/donor-dogs')->assertForbidden();
    }

    public function test_approval_requires_confirmed_canine_type_and_records_veterinarian_review(): void
    {
        $clinicId = $this->makeClinic('Clinic One');
        $vet = $this->makeUser('clinic_admin', $clinicId);
        $owner = $this->makeUser('dog_owner', $clinicId);
        $dogId = $this->makeDog($owner, $clinicId);

        $this->actingAs($vet)->patchJson("/api/clinic/donor-dogs/{$dogId}/verification", [
            'decision' => 'approved',
            'notes' => 'Examined and cleared',
        ])->assertUnprocessable();

        $this->patchJson("/api/clinic/donor-dogs/{$dogId}/verification", [
            'decision' => 'approved',
            'blood_type' => 'DEA 1.1 Positive',
            'notes' => 'Canine blood type confirmed by crossmatch.',
        ])->assertOk()
            ->assertJsonPath('eligibility_status', 'verified')
            ->assertJsonPath('availability_status', 'available')
            ->assertJsonPath('blood_type', 'DEA 1.1 Positive');

        $this->assertDatabaseHas('donor_verifications', [
            'dog_id' => $dogId,
            'reviewed_by' => $vet->user_id,
            'decision' => 'approved',
            'notes' => 'Canine blood type confirmed by crossmatch.',
        ]);
        $this->assertDatabaseHas('audit_log', [
            'user_id' => $vet->user_id,
            'clinic_id' => $clinicId,
            'action' => 'donor_profile_approved',
            'resource_type' => 'dog',
            'resource_id' => $dogId,
        ]);
    }

    public function test_rejection_and_more_information_keep_dog_unavailable(): void
    {
        $clinicId = $this->makeClinic('Clinic One');
        $vet = $this->makeUser('clinic_staff', $clinicId);
        $owner = $this->makeUser('dog_owner', $clinicId);
        $dogId = $this->makeDog($owner, $clinicId);

        $this->actingAs($vet)->patchJson("/api/clinic/donor-dogs/{$dogId}/verification", [
            'decision' => 'needs_more_info',
            'notes' => 'Upload a current blood typing result.',
        ])->assertOk()->assertJsonPath('eligibility_status', 'pending_review');

        $this->patchJson("/api/clinic/donor-dogs/{$dogId}/verification", [
            'decision' => 'rejected',
            'notes' => 'Veterinary exclusion criteria met.',
        ])->assertOk()->assertJsonPath('eligibility_status', 'rejected');

        $this->assertDatabaseHas('dogs', [
            'dog_id' => $dogId,
            'eligibility_status' => 'rejected',
            'availability_status' => 'unavailable',
        ]);
        $this->assertDatabaseCount('donor_verifications', 2);
    }

    public function test_owner_can_choose_active_clinic_for_a_dog_profile(): void
    {
        $firstClinicId = $this->makeClinic('First Clinic');
        $selectedClinicId = $this->makeClinic('Selected Clinic');
        $owner = $this->makeUser('dog_owner', $firstClinicId);

        $this->actingAs($owner)->getJson('/api/donor/clinics')
            ->assertOk()
            ->assertJsonFragment(['clinic_id' => $selectedClinicId, 'name' => 'Selected Clinic']);

        $this->postJson('/api/donor/dogs', [
            'name' => 'Luna',
            'breed' => 'Aspin',
            'sex' => 'female',
            'age_years' => 4,
            'clinic_id' => $selectedClinicId,
        ])->assertCreated()->assertJsonPath('dog.clinic_id', $selectedClinicId)->assertJsonPath('dog.clinic_name', 'Selected Clinic');
    }

    private function makeClinic(string $name): int
    {
        $officeId = DB::table('provincial_offices')->insertGetId([
            'name' => $name.' Office',
            'created_at' => now(),
        ], 'office_id');

        return DB::table('clinics')->insertGetId([
            'provincial_office_id' => $officeId,
            'name' => $name,
            'address' => 'Tagum City',
            'is_active' => true,
            'created_at' => now(),
        ], 'clinic_id');
    }

    private function makeUser(string $role, int $clinicId): User
    {
        return User::create([
            'role' => $role,
            'clinic_id' => $clinicId,
            'full_name' => 'Test '.ucfirst($role),
            'email' => uniqid('user-', true).'@example.test',
            'password_hash' => Hash::make('password'),
            'is_active' => true,
        ]);
    }

    private function makeDog(User $owner, int $clinicId): int
    {
        return DB::table('dogs')->insertGetId([
            'owner_user_id' => $owner->user_id,
            'registered_clinic_id' => $clinicId,
            'name' => 'Test Dog',
            'breed' => 'Aspin',
            'sex' => 'female',
            'date_of_birth' => now()->subYears(4)->toDateString(),
            'eligibility_status' => 'pending_review',
            'availability_status' => 'unavailable',
            'created_at' => now(),
            'updated_at' => now(),
        ], 'dog_id');
    }
}