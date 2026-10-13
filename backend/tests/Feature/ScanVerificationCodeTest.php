<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ScanVerificationCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_and_non_clinic_users_cannot_scan_codes(): void
    {
        $this->postJson('/api/verification-codes/scan', ['qr_payload' => 'CNK-ABCD'])
            ->assertUnauthorized();

        $clinicId = $this->makeClinic('Clinic A');
        $owner = $this->makeUser('dog_owner', $clinicId);

        $this->actingAs($owner)
            ->postJson('/api/verification-codes/scan', ['qr_payload' => 'CNK-ABCD'])
            ->assertForbidden();
    }

    public function test_valid_code_is_verified_for_its_requesting_clinic(): void
    {
        $fixture = $this->makeVerificationFixture();

        $this->actingAs($fixture['clinic_user'])
            ->postJson('/api/verification-codes/scan', [
                'qr_payload' => json_encode(['code' => $fixture['code']]),
            ])
            ->assertOk()
            ->assertJsonPath('data.code', $fixture['code'])
            ->assertJsonPath('data.status', 'verified')
            ->assertJsonPath('data.donor_name', 'Test Dog')
            ->assertJsonPath('data.clinic_name', 'Clinic A');

        $this->assertDatabaseHas('verification_codes', [
            'code' => $fixture['code'],
            'status' => 'verified',
            'scanned_by' => $fixture['clinic_user']->user_id,
        ]);
        $this->assertDatabaseHas('emergency_requests', [
            'request_id' => $fixture['request_id'],
            'status' => 'verification_pending',
        ]);
    }

    public function test_unknown_malformed_expired_and_replayed_codes_are_rejected(): void
    {
        $fixture = $this->makeVerificationFixture();
        $client = $this->actingAs($fixture['clinic_user']);

        $client->postJson('/api/verification-codes/scan', ['qr_payload' => 'not-a-code'])
            ->assertUnprocessable();
        $client->postJson('/api/verification-codes/scan', ['qr_payload' => 'CNK-NOTFOUND'])
            ->assertNotFound();

        $client->postJson('/api/verification-codes/scan', ['qr_payload' => $fixture['code']])
            ->assertOk();
        $client->postJson('/api/verification-codes/scan', ['qr_payload' => $fixture['code']])
            ->assertStatus(409)
            ->assertJsonPath('message', 'This verification code has already been processed.');

        $expired = $this->makeVerificationFixture('CNK-EXPIRED1', now()->subMinute());
        $this->actingAs($expired['clinic_user'])
            ->postJson('/api/verification-codes/scan', ['qr_payload' => $expired['code']])
            ->assertStatus(410);
        $this->assertDatabaseHas('verification_codes', ['code' => $expired['code'], 'status' => 'expired']);
    }

    public function test_code_from_another_clinics_request_is_not_disclosed(): void
    {
        $fixture = $this->makeVerificationFixture();
        $otherClinicId = $this->makeClinic('Clinic B');
        $otherClinicUser = $this->makeUser('clinic_admin', $otherClinicId);

        $this->actingAs($otherClinicUser)
            ->postJson('/api/verification-codes/scan', ['qr_payload' => $fixture['code']])
            ->assertNotFound();

        $this->assertDatabaseHas('verification_codes', ['code' => $fixture['code'], 'status' => 'issued']);
    }

    private function makeVerificationFixture(string $code = 'CNK-ABCD1234', mixed $expiresAt = null): array
    {
        $clinicId = $this->makeClinic('Clinic A');
        $clinicUser = $this->makeUser('clinic_admin', $clinicId);
        $owner = $this->makeUser('dog_owner', $clinicId);
        $bloodTypeId = DB::table('blood_types')->insertGetId([
            'code' => uniqid('DEA-'),
            'description' => 'Test canine blood type',
        ], 'blood_type_id');
        $dogId = DB::table('dogs')->insertGetId([
            'owner_user_id' => $owner->user_id,
            'registered_clinic_id' => $clinicId,
            'name' => 'Test Dog',
            'blood_type_id' => $bloodTypeId,
            'created_at' => now(),
            'updated_at' => now(),
        ], 'dog_id');
        $requestId = DB::table('emergency_requests')->insertGetId([
            'requesting_clinic_id' => $clinicId,
            'requested_by' => $clinicUser->user_id,
            'patient_name' => 'Patient One',
            'blood_type_needed_id' => $bloodTypeId,
            'units_needed' => 1,
            'urgency_level' => 'urgent',
            'status' => 'donor_accepted',
            'created_at' => now(),
        ], 'request_id');
        $matchId = DB::table('request_matches')->insertGetId([
            'request_id' => $requestId,
            'dog_id' => $dogId,
            'rank_order' => 1,
            'status' => 'accepted',
            'created_at' => now(),
        ], 'match_id');
        DB::table('verification_codes')->insert([
            'request_id' => $requestId,
            'match_id' => $matchId,
            'dog_id' => $dogId,
            'code' => $code,
            'qr_payload' => json_encode(['code' => $code, 'request_id' => $requestId, 'match_id' => $matchId]),
            'status' => 'issued',
            'issued_at' => now(),
            'expires_at' => $expiresAt ?? now()->addHour(),
        ]);

        return compact('clinicUser', 'code', 'requestId') + ['clinic_user' => $clinicUser, 'request_id' => $requestId];
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
            'created_at' => now(),
        ], 'clinic_id');
    }

    private function makeUser(string $role, int $clinicId): User
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
}