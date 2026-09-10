<?php

namespace App\Services;

use App\Models\Dog;
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
    ];

    public function handle(EmergencyRequest $request): array
    {
        $neededCode = $request->bloodTypeNeeded->code;
        $compatibleCodes = self::COMPATIBLE_DONORS[$neededCode] ?? [];
        $today = Carbon::today();

        $dogs = Dog::withoutGlobalScopes()
            ->join('blood_types', 'blood_types.blood_type_id', '=', 'dogs.blood_type_id')
            ->whereIn('blood_types.code', $compatibleCodes)
            ->where('dogs.eligibility_status', 'verified')
            ->where('dogs.availability_status', 'available')
            ->where(function ($query) use ($today) {
                $query->whereNull('dogs.next_eligible_date')
                    ->orWhereDate('dogs.next_eligible_date', '<=', $today);
            })
            ->select('dogs.*', 'blood_types.code as blood_type_code')
            ->get()
            ->sortByDesc(fn ($dog) => [
                $dog->blood_type_code === $neededCode ? 2 : 1,
                $dog->last_donation_date ? Carbon::parse($dog->last_donation_date)->diffInDays($today) : 9999,
            ])
            ->values();

        $matches = [];
        foreach ($dogs as $rank => $dog) {
            $match = RequestMatch::create([
                'request_id' => $request->request_id,
                'dog_id' => $dog->dog_id,
                'compatibility_score' => $dog->blood_type_code === $neededCode ? 100 : 85,
                'rank_order' => $rank + 1,
                'status' => $rank === 0 ? 'notified' : 'queued',
                'notified_at' => $rank === 0 ? now() : null,
                'response_deadline' => $rank === 0 ? now()->addMinutes(15) : null,
            ]);

            $matches[] = [
                'match_id' => $match->match_id,
                'rank_order' => $match->rank_order,
                'status' => $match->status,
                'compatibility_score' => $match->compatibility_score,
                'blood_type' => $dog->blood_type_code,
                'donor_name' => $dog->name,
                'availability_status' => $dog->availability_status,
            ];
        }

        if ($dogs->isNotEmpty()) {
            $request->update(['status' => 'donor_notified']);
        }

        return $matches;
    }
}
