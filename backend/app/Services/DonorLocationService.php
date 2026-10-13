<?php

namespace App\Services;

use App\Models\Dog;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class DonorLocationService
{
    public function store(Dog $dog, float $latitude, float $longitude): void
    {
        DB::table('donor_locations')->updateOrInsert(
            ['dog_id' => $dog->dog_id],
            [
                'latitude_encrypted' => Crypt::encryptString((string) $latitude),
                'longitude_encrypted' => Crypt::encryptString((string) $longitude),
                'captured_at' => now(),
            ]
        );
    }

    public function forget(Dog $dog): void
    {
        DB::table('donor_locations')->where('dog_id', $dog->dog_id)->delete();
    }

    public function coordinates(Dog $dog): ?array
    {
        $location = DB::table('donor_locations')->where('dog_id', $dog->dog_id)->first();
        if (! $location) {
            return null;
        }

        return [
            'latitude' => (float) Crypt::decryptString($location->latitude_encrypted),
            'longitude' => (float) Crypt::decryptString($location->longitude_encrypted),
            'captured_at' => $location->captured_at,
        ];
    }

    public function distanceKm(float $fromLatitude, float $fromLongitude, float $toLatitude, float $toLongitude): float
    {
        $latitudeDelta = deg2rad($toLatitude - $fromLatitude);
        $longitudeDelta = deg2rad($toLongitude - $fromLongitude);
        $a = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($fromLatitude)) * cos(deg2rad($toLatitude)) * sin($longitudeDelta / 2) ** 2;

        return 6371 * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
