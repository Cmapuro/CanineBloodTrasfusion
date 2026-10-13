<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ClinicDirectoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_directory_returns_active_clinics_with_coordinates_only_when_present(): void
    {
        $locatedClinicId = $this->makeClinic('Located Clinic', true, 7.451, 125.809);
        $this->makeClinic('Clinic Without Coordinates', true, null, null);
        $this->makeClinic('Inactive Clinic', false, 7.4, 125.8);

        $this->makeClinic('Located Clinic', true, 7.451, 125.809);

        $response = $this->getJson('/api/clinics')->assertOk()->assertJsonCount(2, 'clinics');
        $located = collect($response->json('clinics'))->firstWhere('clinic_id', $locatedClinicId);

        $this->assertEquals(7.451, (float) $located['latitude']);
        $this->assertEquals(125.809, (float) $located['longitude']);
        $this->assertArrayNotHasKey('provincial_office_id', $located);
        $this->assertArrayNotHasKey('license_number', $located);

        $withoutCoordinates = collect($response->json('clinics'))->firstWhere('name', 'Clinic Without Coordinates');
        $this->assertNull($withoutCoordinates['latitude']);
        $this->assertNull($withoutCoordinates['longitude']);
    }

    public function test_public_directory_returns_an_empty_list_when_no_active_clinics_exist(): void
    {
        $this->makeClinic('Inactive Clinic', false, null, null);

        $this->getJson('/api/clinics')->assertOk()->assertExactJson(['clinics' => []]);
    }

    private function makeClinic(string $name, bool $active, ?float $latitude, ?float $longitude): int
    {
        $officeId = DB::table('provincial_offices')->insertGetId([
            'name' => $name.' Office',
            'created_at' => now(),
        ], 'office_id');

        return DB::table('clinics')->insertGetId([
            'provincial_office_id' => $officeId,
            'name' => $name,
            'address' => 'Test Address',
            'contact_phone' => '+63 900 000 0000',
            'email' => strtolower(str_replace(' ', '-', $name)).'@example.test',
            'latitude' => $latitude,
            'longitude' => $longitude,
            'is_active' => $active,
            'created_at' => now(),
        ], 'clinic_id');
    }
}