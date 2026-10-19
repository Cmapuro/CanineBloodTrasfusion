<?php

namespace App\Http\Controllers;

use App\Models\Dog;
use App\Services\DonorLocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class NearbyLocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            in_array($user->role, ['clinic_admin', 'clinic_staff'], true) && $user->clinic_id,
            403,
            'Nearby donor locations are available to clinic staff only.'
        );

        $filters = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'radius' => ['required', Rule::in(['5', '10', '20', 5, 10, 20])],
            'type' => ['sometimes', Rule::in(['all', 'clinic', 'donor'])],
            'availability' => ['sometimes', Rule::in(['available', 'all'])],
            'blood_type' => ['sometimes', 'nullable', 'string', 'max:20'],
            'eligibility' => ['sometimes', Rule::in(['verified', 'hidden'])],
        ]);

        $latitude = (float) $filters['latitude'];
        $longitude = (float) $filters['longitude'];
        $radius = (int) $filters['radius'];
        $type = $filters['type'] ?? 'all';
        $locations = [];

        if ($type !== 'donor') {
            $clinics = DB::table('clinics')
                ->where('is_active', true)
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->get([
                    'clinic_id',
                    'name',
                    'address',
                    'contact_phone',
                    'latitude',
                    'longitude',
                ]);

            foreach ($clinics as $clinic) {
                $distance = $this->distanceKm($latitude, $longitude, (float) $clinic->latitude, (float) $clinic->longitude);
                if ($distance > $radius) {
                    continue;
                }

                $locations[] = [
                    'id' => 'clinic-'.$clinic->clinic_id,
                    'type' => 'clinic',
                    'name' => $clinic->name,
                    'address' => $clinic->address,
                    'contact_phone' => $clinic->contact_phone,
                    'latitude' => (float) $clinic->latitude,
                    'longitude' => (float) $clinic->longitude,
                    'distance_km' => round($distance, 1),
                ];
            }
        }

        usort($locations, fn (array $left, array $right) => $left['distance_km'] <=> $right['distance_km']);

        return response()->json([
            'locations' => $locations,
            'blood_types' => DB::table('blood_types')->orderBy('code')->pluck('code'),
            'center' => ['latitude' => $latitude, 'longitude' => $longitude],
            'radius_km' => $radius,
        ]);
    }

    public function donorSharingSettings(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'dog_owner', 403);

        $dogs = DB::table('dogs')
            ->leftJoin('donor_locations', 'donor_locations.dog_id', '=', 'dogs.dog_id')
            ->where('owner_user_id', $user->user_id)
            ->orderBy('name')
            ->get([
                'dogs.dog_id', 'dogs.name', 'dogs.eligibility_status', 'dogs.availability_status',
                'dogs.location_sharing_consent', 'dogs.location_sharing_consent_at',
                'donor_locations.captured_at as location_updated_at',
            ])
            ->map(fn ($dog) => [
                ...((array) $dog),
                'location_sharing_consent' => (bool) $dog->location_sharing_consent,
            ]);

        return response()->json(['dogs' => $dogs]);
    }

    public function updateDonorLocation(Request $request, int $dogId, DonorLocationService $locations): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'dog_owner', 403);
        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $dog = Dog::withoutGlobalScopes()
            ->where('dog_id', $dogId)
            ->where('owner_user_id', $user->user_id)
            ->firstOrFail();
        abort_unless($dog->location_sharing_consent, 403, 'Enable distance-estimate sharing before saving a location.');

        DB::transaction(function () use ($locations, $dog, $data, $user) {
            $locations->store($dog, (float) $data['latitude'], (float) $data['longitude']);
            DB::table('audit_log')->insert([
                'user_id' => $user->user_id,
                'clinic_id' => $dog->registered_clinic_id,
                'action' => 'donor_approximate_location_updated',
                'resource_type' => 'dog',
                'resource_id' => $dog->dog_id,
                'details' => json_encode(['coordinates_encrypted' => true], JSON_THROW_ON_ERROR),
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Your encrypted location can now be used to calculate approximate donor distance.',
            'location_updated_at' => now(),
        ]);
    }

    public function updateDonorSharingConsent(Request $request, int $dogId): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'dog_owner', 403);
        $data = $request->validate(['consent' => ['required', 'boolean']]);

        DB::transaction(function () use ($user, $dogId, $data) {
            $dog = DB::table('dogs')
                ->where('dog_id', $dogId)
                ->where('owner_user_id', $user->user_id)
                ->lockForUpdate()
                ->first(['dog_id', 'registered_clinic_id', 'location_sharing_consent']);

            abort_unless($dog, 404);
            $consent = (bool) $data['consent'];
            if ((bool) $dog->location_sharing_consent === $consent) {
                return;
            }

            DB::table('dogs')->where('dog_id', $dogId)->update([
                'location_sharing_consent' => $consent,
                'location_sharing_consent_at' => $consent ? now() : null,
            ]);
            if (! $consent) {
                DB::table('request_matches')
                    ->where('dog_id', $dogId)
                    ->where('location_permission_status', 'granted')
                    ->update([
                        'location_permission_status' => 'revoked',
                        'location_expires_at' => now(),
                    ]);
                DB::table('donor_locations')->where('dog_id', $dogId)->delete();
            }
            DB::table('audit_log')->insert([
                'user_id' => $user->user_id,
                'clinic_id' => $dog->registered_clinic_id,
                'action' => $consent ? 'donor_location_consent_granted' : 'donor_location_consent_revoked',
                'resource_type' => 'dog',
                'resource_id' => $dog->dog_id,
                'details' => json_encode(['approximate_location_sharing' => $consent], JSON_THROW_ON_ERROR),
                'created_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Donor location-sharing preference saved.']);
    }

    private function distanceKm(float $fromLatitude, float $fromLongitude, float $toLatitude, float $toLongitude): float
    {
        $earthRadius = 6371;
        $latitudeDelta = deg2rad($toLatitude - $fromLatitude);
        $longitudeDelta = deg2rad($toLongitude - $fromLongitude);
        $a = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($fromLatitude)) * cos(deg2rad($toLatitude)) * sin($longitudeDelta / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
