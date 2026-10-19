<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DonorRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_donor_signup_creates_an_owner_and_dog_with_optional_weight(): void
    {
        $clinicId = $this->makeClinic('Review Clinic', true);
        if (! DB::table('blood_types')->where('code', 'DEA 1.1 Positive')->exists()) {
            DB::table('blood_types')->insert([
                'code' => 'DEA 1.1 Positive',
                'description' => 'Test blood type',
            ]);
        }

        $response = $this->postJson('/api/auth/register/donor', [
            'full_name' => 'Casey Owner',
            'email' => 'casey@example.test',
            'phone' => '+639123456789',
            'password' => 'secure-password-123',
            'clinic_id' => $clinicId,
            'dog_name' => 'Milo',
            'breed' => 'Mixed breed',
            'sex' => 'male',
            'age_years' => 4,
            'weight_kg' => null,
            'blood_type' => 'DEA 1.1 Positive',
        ])->assertCreated()
            ->assertJsonPath('user.role', 'dog_owner')
            ->assertJsonPath('dog.name', 'Milo')
            ->assertJsonPath('dog.clinic_id', $clinicId)
            ->assertJsonPath('dog.clinic_name', 'Review Clinic')
            ->assertJsonPath('dog.weight_kg', null)
            ->assertJsonPath('dog.eligibility_status', 'pending_review');

        $this->assertDatabaseHas('users', [
            'user_id' => $response->json('user.user_id'),
            'email' => 'casey@example.test',
            'role' => 'dog_owner',
        ]);
        $this->assertDatabaseHas('dogs', [
            'dog_id' => $response->json('dog.dog_id'),
            'owner_user_id' => $response->json('user.user_id'),
            'registered_clinic_id' => $clinicId,
            'name' => 'Milo',
            'weight_kg' => null,
        ]);

        $this->withToken($response->json('token'))
            ->getJson('/api/donor/dogs')
            ->assertOk()
            ->assertJsonPath('dogs.0.name', 'Milo');
    }

    public function test_donor_signup_rejects_inactive_clinic_without_creating_an_account(): void
    {
        $clinicId = $this->makeClinic('Inactive Clinic', false);

        $this->postJson('/api/auth/register/donor', [
            'full_name' => 'Casey Owner',
            'email' => 'casey@example.test',
            'phone' => '+639123456789',
            'password' => 'secure-password-123',
            'clinic_id' => $clinicId,
            'dog_name' => 'Milo',
            'breed' => 'Mixed breed',
            'sex' => 'male',
            'age_years' => 4,
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('users', ['email' => 'casey@example.test']);
    }

    private function makeClinic(string $name, bool $active): int
    {
        $officeId = DB::table('provincial_offices')->insertGetId([
            'name' => $name.' Office',
            'created_at' => now(),
        ], 'office_id');

        return DB::table('clinics')->insertGetId([
            'provincial_office_id' => $officeId,
            'name' => $name,
            'address' => 'Test Address',
            'is_active' => $active,
            'created_at' => now(),
        ], 'clinic_id');
    }
}