<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ClinicDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_clinic_dashboard_counts_only_its_own_donors_requests_and_transfusions(): void
    {
        $clinicId = $this->makeClinic('Clinic One');
        $otherClinicId = $this->makeClinic('Clinic Two');
        $clinicUser = $this->makeUser('clinic_admin', $clinicId);
        $otherClinicUser = $this->makeUser('clinic_admin', $otherClinicId);
        $owner = $this->makeUser('dog_owner', null);
        $bloodTypeId = (int) DB::table('blood_types')->where('code', 'DEA 1.1 Positive')->value('blood_type_id');

        $availableDogId = $this->makeDog($owner, $clinicId, 'verified', 'available');
        $this->makeDog($owner, $clinicId, 'verified', 'on_cooldown');
        $this->makeDog($owner, $clinicId, 'pending_review', 'unavailable');
        $this->makeDog($owner, $clinicId, 'rejected', 'unavailable');
        $otherDogId = $this->makeDog($owner, $otherClinicId, 'verified', 'available');

        $requestId = $this->makeEmergencyRequest($clinicId, $clinicUser, $bloodTypeId, 'searching');
        $this->makeEmergencyRequest($clinicId, $clinicUser, $bloodTypeId, 'fulfilled');
        $this->makeEmergencyRequest($otherClinicId, $otherClinicUser, $bloodTypeId, 'searching');
        $this->makeDonation($clinicId, $availableDogId, $requestId);
        $this->makeDonation($otherClinicId, $otherDogId, null);

        $this->actingAs($clinicUser)
            ->getJson('/api/clinic/dashboard/summary')
            ->assertOk()
            ->assertExactJson([
                'active_donors' => 2,
                'pending_verification' => 1,
                'available_donors' => 1,
                'emergency_requests' => 1,
                'completed_transfusions' => 1,
            ]);
    }

    public function test_dashboard_summary_requires_clinic_staff_with_an_assigned_clinic(): void
    {
        $clinicId = $this->makeClinic('Clinic One');
        $owner = $this->makeUser('dog_owner', null);

        $this->getJson('/api/clinic/dashboard/summary')->assertUnauthorized();
        $this->actingAs($owner)->getJson('/api/clinic/dashboard/summary')->assertForbidden();

        $unassignedClinicUser = $this->makeUser('clinic_admin', null);
        $this->actingAs($unassignedClinicUser)->getJson('/api/clinic/dashboard/summary')->assertForbidden();
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
            'address' => 'Test Address',
            'is_active' => true,
            'created_at' => now(),
        ], 'clinic_id');
    }

    private function makeUser(string $role, ?int $clinicId): User
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

    private function makeDog(User $owner, int $clinicId, string $eligibility, string $availability): int
    {
        return DB::table('dogs')->insertGetId([
            'owner_user_id' => $owner->user_id,
            'registered_clinic_id' => $clinicId,
            'name' => uniqid('Dog '),
            'breed' => 'Aspin',
            'sex' => 'female',
            'date_of_birth' => now()->subYears(4)->toDateString(),
            'eligibility_status' => $eligibility,
            'availability_status' => $availability,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'dog_id');
    }

    private function makeEmergencyRequest(int $clinicId, User $requestedBy, int $bloodTypeId, string $status): int
    {
        return DB::table('emergency_requests')->insertGetId([
            'requesting_clinic_id' => $clinicId,
            'requested_by' => $requestedBy->user_id,
            'patient_name' => 'Test Patient',
            'blood_type_needed_id' => $bloodTypeId,
            'status' => $status,
            'created_at' => now(),
        ], 'request_id');
    }

    private function makeDonation(int $clinicId, int $dogId, ?int $requestId): void
    {
        DB::table('donation_history')->insert([
            'dog_id' => $dogId,
            'clinic_id' => $clinicId,
            'emergency_request_id' => $requestId,
            'donation_date' => now()->toDateString(),
            'product_type' => 'whole_blood',
            'created_at' => now(),
        ]);
    }
}