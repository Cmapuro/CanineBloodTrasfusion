<?php

namespace App\Services;

use App\Models\EmergencyRequest;
use App\Models\Notification;
use App\Models\RequestMatch;
use Illuminate\Support\Facades\DB;

class RelayDonorMatches
{
    public function notifyNext(EmergencyRequest $emergencyRequest): ?RequestMatch
    {
        return DB::transaction(function () use ($emergencyRequest) {
            $emergencyRequest = EmergencyRequest::query()
                ->whereKey($emergencyRequest->request_id)
                ->lockForUpdate()
                ->firstOrFail();

            if (in_array($emergencyRequest->status, ['fulfilled', 'cancelled', 'expired'], true)) {
                $this->expireActiveShares($emergencyRequest);

                return null;
            }

            $now = now();
            $overdue = RequestMatch::query()
                ->where('request_id', $emergencyRequest->request_id)
                ->where('status', 'notified')
                ->whereNotNull('response_deadline')
                ->where('response_deadline', '<=', $now)
                ->lockForUpdate()
                ->get();

            foreach ($overdue as $match) {
                $match->update([
                    'status' => 'timed_out',
                    'responded_at' => $now,
                    'location_permission_status' => 'expired',
                ]);
                $this->releaseDonorIfUnclaimed($match->dog_id);
            }

            $active = RequestMatch::query()
                ->where('request_id', $emergencyRequest->request_id)
                ->whereIn('status', ['notified', 'accepted'])
                ->exists();
            if ($active) {
                return null;
            }

            $next = null;
            do {
                $candidate = RequestMatch::query()
                    ->where('request_id', $emergencyRequest->request_id)
                    ->where('status', 'queued')
                    ->orderBy('rank_order')
                    ->lockForUpdate()
                    ->first();
                if (! $candidate) {
                    break;
                }

                $candidate->load('dog');
                $candidateDog = DB::table('dogs')
                    ->where('dog_id', $candidate->dog_id)
                    ->lockForUpdate()
                    ->first();
                if (! $candidateDog
                    || $candidateDog->eligibility_status !== 'verified'
                    || $candidateDog->availability_status !== 'available'
                    || ($candidateDog->next_eligible_date
                        && $candidateDog->next_eligible_date > $now->toDateString())) {
                    $candidate->update(['status' => 'expired', 'responded_at' => $now]);
                    continue;
                }

                $reserved = DB::table('dogs')
                    ->where('dog_id', $candidate->dog_id)
                    ->where('eligibility_status', 'verified')
                    ->where('availability_status', 'available')
                    ->update(['availability_status' => 'in_process', 'updated_at' => $now]);
                if ($reserved !== 1) {
                    $candidate->update(['status' => 'expired', 'responded_at' => $now]);
                    continue;
                }

                $next = $candidate;
            } while ($next === null);

            if (! $next) {
                if ($emergencyRequest->status !== 'donor_accepted') {
                    $emergencyRequest->update(['status' => 'expired']);
                }

                $this->expireActiveShares($emergencyRequest);

                return null;
            }

            $next->load('dog');
            $emergencyRequest->loadMissing(['bloodTypeNeeded', 'requestingClinic']);
            $deadline = $now->copy()->addMinutes((int) config('caninelink.response_window_minutes', 15));
            $next->update([
                'status' => 'notified',
                'notified_at' => $now,
                'response_deadline' => $deadline,
            ]);
            $emergencyRequest->update(['status' => 'donor_notified']);

            Notification::create([
                'user_id' => $next->dog->owner_user_id,
                'type' => 'emergency_request',
                'title' => 'Emergency Blood Donation Request',
                'message' => ($emergencyRequest->requestingClinic?->name ?? 'A veterinary clinic')
                    .' needs a '.$emergencyRequest->bloodTypeNeeded?->code.' canine blood donor. Respond by '
                    .$deadline->toDateTimeString().'. Your exact location will stay private unless you grant temporary sharing.',
                'related_request_id' => $emergencyRequest->request_id,
                'related_dog_id' => $next->dog_id,
                'created_at' => $now,
            ]);

            return $next;
        });
    }

    public function expireActiveShares(EmergencyRequest $emergencyRequest): void
    {
        RequestMatch::query()
            ->where('request_id', $emergencyRequest->request_id)
            ->where('location_permission_status', 'granted')
            ->update([
                'location_permission_status' => 'expired',
                'location_expires_at' => now(),
            ]);
    }

    public function releaseDonorIfUnclaimed(int $dogId): void
    {
        $isClaimed = RequestMatch::query()
            ->where('dog_id', $dogId)
            ->whereIn('status', ['notified', 'accepted'])
            ->whereHas('emergencyRequest', fn ($query) => $query->whereNotIn('status', ['fulfilled', 'cancelled', 'expired']))
            ->exists();

        if (! $isClaimed) {
            DB::table('dogs')
                ->where('dog_id', $dogId)
                ->where('availability_status', 'in_process')
                ->update(['availability_status' => 'available', 'updated_at' => now()]);
        }
    }
}
