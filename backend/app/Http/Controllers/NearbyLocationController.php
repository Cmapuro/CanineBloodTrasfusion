<?php

namespace App\Http\Controllers;

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

        if ($type !== 'clinic' && ($filters['eligibility'] ?? 'verified') === 'verified') {
            $dogs = DB::table('dogs as d')
                ->join('clinics as c', 'c.clinic_id', '=', 'd.registered_clinic_id')
                ->join('blood_types as bt', 'bt.blood_type_id', '=', 'd.blood_type_id')
                ->where('c.is_active', true)
                ->whereNotNull('c.latitude')
                ->whereNotNull('c.longitude')
                ->where('d.eligibility_status', 'verified')
                ->where('d.location_sharing_consent', true)
                ->where(function ($query) use ($filters) {
                    if (($filters['availability'] ?? 'available') === 'available') {
                        $query->where('d.availability_status', 'available')
                            ->where(function ($eligibleDate) {
                                $eligibleDate->whereNull('d.next_eligible_date')
                                    ->orWhereDate('d.next_eligible_date', '<=', now()->toDateString());
                            });
                    }
                })
                ->when(! empty($filters['blood_type']), fn ($query) => $query->where('bt.code', $filters['blood_type']))
                ->where(function ($query) use ($user) {
                    $query->where('d.registered_clinic_id', $user->clinic_id)
                        ->orWhereExists(function ($grant) use ($user) {
                            $grant->selectRaw('1')
                                ->from('access_grants as ag')
                                ->join('access_requests as ar', 'ar.access_request_id', '=', 'ag.access_request_id')
                                ->whereColumn('ag.owning_clinic_id', 'd.registered_clinic_id')
                                ->where('ag.requesting_clinic_id', $user->clinic_id)
                                ->whereColumn('ar.requesting_clinic_id', 'ag.requesting_clinic_id')
                                ->whereColumn('ar.owning_clinic_id', 'ag.owning_clinic_id')
                                ->where('ar.status', 'approved')
                                ->whereNull('ag.revoked_at')
                                ->where(function ($expires) {
                                    $expires->whereNull('ag.expires_at')
                                        ->orWhere('ag.expires_at', '>', now());
                                })
                                ->where(function ($dogGrant) {
                                    $dogGrant->whereNull('ag.dog_id')
                                        ->orWhereColumn('ag.dog_id', 'd.dog_id');
                                })
                                ->where(function ($requestDog) {
                                    $requestDog->whereNull('ar.dog_id')
                                        ->orWhereColumn('ar.dog_id', 'd.dog_id');
                                });
                        });
                })
                ->get([
                    'd.registered_clinic_id',
                    'd.availability_status',
                    'bt.code as blood_type',
                    'c.latitude',
                    'c.longitude',
                ]);

            $donorGroups = [];
            foreach ($dogs as $dog) {
                $clinicLatitude = (float) $dog->latitude;
                $clinicLongitude = (float) $dog->longitude;
                $distance = $this->distanceKm($latitude, $longitude, $clinicLatitude, $clinicLongitude);
                if ($distance > $radius) {
                    continue;
                }

                $key = implode('|', [
                    $dog->registered_clinic_id,
                    $dog->blood_type,
                    $dog->availability_status,
                ]);
                if (! isset($donorGroups[$key])) {
                    $donorGroups[$key] = [
                        'id' => 'donor-'.$key,
                        'type' => 'donor',
                        'name' => 'Approximate donor area',
                        'blood_type' => $dog->blood_type,
                        'availability_status' => $dog->availability_status,
                        'donor_count' => 0,
                        'latitude' => round($clinicLatitude, 2),
                        'longitude' => round($clinicLongitude, 2),
                        'distance_km' => round($distance, 1),
                        'approximate' => true,
                    ];
                }

                $donorGroups[$key]['donor_count']++;
            }

            array_push($locations, ...array_values($donorGroups));
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
            ->where('owner_user_id', $user->user_id)
            ->orderBy('name')
            ->get(['dog_id', 'name', 'eligibility_status', 'availability_status', 'location_sharing_consent'])
            ->map(fn ($dog) => [
                ...((array) $dog),
                'location_sharing_consent' => (bool) $dog->location_sharing_consent,
            ]);

        return response()->json(['dogs' => $dogs]);
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

            DB::table('dogs')->where('dog_id', $dogId)->update(['location_sharing_consent' => $consent]);
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
