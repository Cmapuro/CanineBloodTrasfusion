<?php

namespace App\Services;

use App\Models\Dog;
use App\Models\Clinic;
use App\Models\EmergencyRequest;
use App\Models\RequestMatch;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class MatchDonorsForRequest
{
    private const COMPATIBLE_DONORS = [
        'O+' => ['O+', 'O-'],
        'O-' => ['O-'],
        'A+' => ['A+', 'A-', 'O+', 'O-'],
        'A-' => ['A-', 'O-'],
        'B+' => ['B+', 'B-', 'O+', 'O-'],
        'B-' => ['B-', 'O-'],
        'AB+' => ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
        'AB-' => ['AB-', 'A-', 'B-', 'O-'],
        'DEA 1.1 Positive' => ['DEA 1.1 Positive'],
        'DEA 1.1 Negative' => ['DEA 1.1 Negative'],
        'DEA 1.2' => ['DEA 1.2'],
        'DEA 3' => ['DEA 3'],
        'DEA 4' => ['DEA 4'],
        'DEA 5' => ['DEA 5'],
        'DEA 7' => ['DEA 7'],
        'Dal' => ['Dal'],
        'Kai 1' => ['Kai 1'],
        'Kai 2' => ['Kai 2'],
    ];

    public function handle(EmergencyRequest $request): array
    {
        $neededCode = $request->bloodTypeNeeded->code;
        $compatibleCodes = self::COMPATIBLE_DONORS[$neededCode] ?? [];
        $today = Carbon::today();
        $minimumWeight = config('caninelink.minimum_donor_weight_kg');
        $clinic = Clinic::query()->find($request->requesting_clinic_id);
        $locations = app(DonorLocationService::class);

        $dogs = Dog::withoutGlobalScopes()
            ->join('blood_types', 'blood_types.blood_type_id', '=', 'dogs.blood_type_id')
            ->whereIn('blood_types.code', $compatibleCodes)
            ->where('dogs.eligibility_status', 'verified')
            ->where('dogs.availability_status', 'available')
            ->when($minimumWeight !== null, fn ($query) => $query->where('dogs.weight_kg', '>=', $minimumWeight))
            ->where(function ($query) use ($today) {
                $query->whereNull('dogs.next_eligible_date')
                    ->orWhereDate('dogs.next_eligible_date', '<=', $today);
            })
            ->where(function ($query) use ($request) {
                $query->where('dogs.registered_clinic_id', $request->requesting_clinic_id)
                    ->orWhereExists(function ($grant) use ($request) {
                        $grant->selectRaw('1')
                            ->from('access_grants as ag')
                            ->join('access_requests as ar', 'ar.access_request_id', '=', 'ag.access_request_id')
                            ->whereColumn('ag.owning_clinic_id', 'dogs.registered_clinic_id')
                            ->where('ag.requesting_clinic_id', $request->requesting_clinic_id)
                            ->whereColumn('ar.requesting_clinic_id', 'ag.requesting_clinic_id')
                            ->whereColumn('ar.owning_clinic_id', 'ag.owning_clinic_id')
                            ->where('ar.status', 'approved')
                            ->whereNull('ag.revoked_at')
                            ->where(function ($expires) {
                                $expires->whereNull('ag.expires_at')->orWhere('ag.expires_at', '>', now());
                            })
                            ->where(function ($dogGrant) {
                                $dogGrant->whereNull('ag.dog_id')->orWhereColumn('ag.dog_id', 'dogs.dog_id');
                            })
                            ->where(function ($requestDog) {
                                $requestDog->whereNull('ar.dog_id')->orWhereColumn('ar.dog_id', 'dogs.dog_id');
                            });
                    });
            })
            ->select('dogs.*', 'blood_types.code as blood_type_code')
            ->get()
            ->map(function ($dog) use ($locations, $clinic) {
                $coordinates = null;
                if ($dog->location_sharing_consent) {
                    $coordinates = $locations->coordinates($dog);
                    if ($coordinates && Carbon::parse($coordinates['captured_at'])->lt(
                        now()->subMinutes((int) config('caninelink.location_max_age_minutes', 30))
                    )) {
                        $coordinates = null;
                    }
                }

                $distance = null;
                if ($coordinates && $clinic?->latitude !== null && $clinic?->longitude !== null) {
                    $distance = $locations->distanceKm(
                        (float) $clinic->latitude,
                        (float) $clinic->longitude,
                        $coordinates['latitude'],
                        $coordinates['longitude']
                    );
                }

                $dog->estimated_distance_km = $distance === null ? null : round($distance, 1);

                return $dog;
            })
            ->sort(function ($left, $right) use ($neededCode, $today) {
                $leftKey = [
                    $left->blood_type_code === $neededCode ? 0 : 1,
                    $left->estimated_distance_km ?? PHP_FLOAT_MAX,
                    $left->last_donation_date ? -Carbon::parse($left->last_donation_date)->diffInDays($today) : -PHP_INT_MAX,
                ];
                $rightKey = [
                    $right->blood_type_code === $neededCode ? 0 : 1,
                    $right->estimated_distance_km ?? PHP_FLOAT_MAX,
                    $right->last_donation_date ? -Carbon::parse($right->last_donation_date)->diffInDays($today) : -PHP_INT_MAX,
                ];

                return $leftKey <=> $rightKey;
            })
            ->values();

        $matches = [];
        foreach ($dogs as $rank => $dog) {
            $match = RequestMatch::create([
                'request_id' => $request->request_id,
                'dog_id' => $dog->dog_id,
                'compatibility_score' => $dog->blood_type_code === $neededCode ? 100 : 85,
                'distance_km' => $dog->estimated_distance_km,
                'rank_order' => $rank + 1,
                'status' => 'queued',
                'notified_at' => null,
                'response_deadline' => null,
            ]);

            $matches[] = [
                'match_id' => $match->match_id,
                'rank_order' => $match->rank_order,
                'status' => $match->status,
                'compatibility_score' => $match->compatibility_score,
                'blood_type' => $dog->blood_type_code,
                'donor_name' => $dog->name,
                'availability_status' => $dog->availability_status,
                'distance_km' => $match->distance_km,
                'travel_time_minutes' => null,
            ];
        }

        if ($dogs->isNotEmpty()) {
            $notified = app(RelayDonorMatches::class)->notifyNext($request);
            if ($notified && isset($matches[$notified->rank_order - 1])) {
                $matches[$notified->rank_order - 1]['status'] = 'notified';
            }
        }

        return $matches;
    }
}
