<?php

namespace App\Http\Controllers;

use App\Models\BloodType;
use App\Models\EmergencyRequest;
use App\Models\Dog;
use App\Models\RequestMatch;
use App\Models\VerificationCode;
use App\Models\Notification;
use App\Services\MatchDonorsForRequest;
use App\Services\DonorLocationService;
use App\Services\RelayDonorMatches;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmergencyRequestController extends Controller
{
    public function donorVerificationCodes(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'dog_owner', 403);

        VerificationCode::query()
            ->join('dogs', 'dogs.dog_id', '=', 'verification_codes.dog_id')
            ->where('dogs.owner_user_id', $user->user_id)
            ->whereIn('verification_codes.status', ['issued', 'scanned'])
            ->where('verification_codes.expires_at', '<', now())
            ->update(['verification_codes.status' => 'expired']);

        $codes = VerificationCode::query()
            ->join('dogs', 'dogs.dog_id', '=', 'verification_codes.dog_id')
            ->join('emergency_requests', 'emergency_requests.request_id', '=', 'verification_codes.request_id')
            ->join('clinics', 'clinics.clinic_id', '=', 'emergency_requests.requesting_clinic_id')
            ->where('dogs.owner_user_id', $user->user_id)
            ->whereIn('verification_codes.status', ['issued', 'scanned', 'verified', 'expired', 'void'])
            ->orderByDesc('verification_codes.issued_at')
            ->select([
                'verification_codes.code_id', 'verification_codes.code', 'verification_codes.qr_payload',
                'verification_codes.status', 'verification_codes.issued_at', 'verification_codes.expires_at',
                'dogs.name as donor_name', 'emergency_requests.patient_name',
                'clinics.name as clinic_name',
            ])
            ->get();

        return response()->json($codes);
    }

    public function archiveVerificationCode(Request $request, VerificationCode $verificationCode): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'dog_owner', 403);

        $belongsToOwner = Dog::withoutGlobalScopes()
            ->where('dog_id', $verificationCode->dog_id)
            ->where('owner_user_id', $user->user_id)
            ->exists();
        abort_unless($belongsToOwner, 403);

        $verificationCode->update(['status' => 'void']);

        return response()->json(['message' => 'Verification record archived.']);
    }

    public function clinicMatches(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['clinic_admin', 'clinic_staff'], true) && $user->clinic_id, 403);

        $locations = app(DonorLocationService::class);
        $matches = RequestMatch::whereHas('emergencyRequest', fn ($query) => $query->where('requesting_clinic_id', $user->clinic_id))
            ->whereIn('status', ['queued', 'notified', 'accepted', 'declined', 'timed_out', 'expired', 'completed'])
            ->with(['emergencyRequest.bloodTypeNeeded', 'emergencyRequest.requestingClinic', 'dog.bloodType'])
            ->orderByDesc('created_at')
            ->get();

        $data = $matches->map(function (RequestMatch $match) use ($locations) {
            $emergencyRequest = $match->emergencyRequest;
            $clinic = $emergencyRequest?->requestingClinic;
            $dog = $match->dog;
            $location = null;
            $isLocationAuthorized = $match->status === 'accepted'
                && in_array($emergencyRequest?->status, ['donor_accepted', 'verification_pending'], true)
                && $match->location_permission_status === 'granted'
                && $match->location_expires_at
                && now()->lt($match->location_expires_at);

            if ($isLocationAuthorized && $dog) {
                $location = $locations->coordinates($dog);
                if ($location && \Illuminate\Support\Carbon::parse($location['captured_at'])->lt(
                    now()->subMinutes((int) config('caninelink.location_max_age_minutes', 30))
                )) {
                    $location = null;
                }
            }

            $distanceLocation = $location;
            if (! $distanceLocation && $dog?->location_sharing_consent) {
                $distanceLocation = $locations->coordinates($dog);
                if ($distanceLocation && \Illuminate\Support\Carbon::parse($distanceLocation['captured_at'])->lt(
                    now()->subMinutes((int) config('caninelink.location_max_age_minutes', 30))
                )) {
                    $distanceLocation = null;
                }
            }

            $distance = null;
            if ($distanceLocation && $clinic?->latitude !== null && $clinic?->longitude !== null) {
                $distance = round($locations->distanceKm(
                    (float) $clinic->latitude,
                    (float) $clinic->longitude,
                    $distanceLocation['latitude'],
                    $distanceLocation['longitude']
                ), 1);
            }

            $result = [
                'match_id' => $match->match_id,
                'request_id' => $match->request_id,
                'patient_name' => $emergencyRequest?->patient_name,
                'blood_type' => $emergencyRequest?->bloodTypeNeeded?->code,
                'urgency_level' => $emergencyRequest?->urgency_level,
                'request_status' => $emergencyRequest?->status,
                'clinic' => [
                    'name' => $clinic?->name,
                    'latitude' => $clinic?->latitude === null ? null : (float) $clinic->latitude,
                    'longitude' => $clinic?->longitude === null ? null : (float) $clinic->longitude,
                ],
                'dog_id' => $dog?->dog_id,
                'donor_name' => $dog?->name,
                'donor_blood_type' => $dog?->bloodType?->code,
                'eligibility_status' => $dog?->eligibility_status,
                'availability_status' => $dog?->availability_status,
                'status' => $match->status,
                'compatibility_score' => $match->compatibility_score,
                'distance_km' => $distance === null ? null : (float) $distance,
                'travel_time_minutes' => null,
                'response_deadline' => $match->response_deadline,
                'location_permission_status' => $match->location_permission_status === 'granted'
                    && (! $match->location_expires_at || now()->gte($match->location_expires_at))
                    ? 'expired'
                    : $match->location_permission_status,
                'last_location_update' => $location['captured_at'] ?? null,
            ];

            if ($location) {
                $result['latitude'] = $location['latitude'];
                $result['longitude'] = $location['longitude'];
            }

            return $result;
        });

        return response()->json($data);
    }

    public function approveMatch(Request $request, RequestMatch $match): JsonResponse
    {
        $user = $request->user();
        $match->load('dog');
        $match->load('emergencyRequest');
        abort_unless(in_array($user->role, ['clinic_admin', 'clinic_staff'], true)
            && $user->clinic_id === $match->emergencyRequest?->requesting_clinic_id, 403);
        abort_unless($match->status === 'queued', 409, 'This donor is no longer queued for this request.');

        $active = RequestMatch::where('request_id', $match->request_id)
            ->whereIn('status', ['notified', 'accepted'])
            ->exists();
        abort_if($active, 409, 'Another donor is already responding to this request.');

        DB::transaction(function () use ($match) {
            $dog = DB::table('dogs')->where('dog_id', $match->dog_id)->lockForUpdate()->first();
            abort_unless($dog && $dog->availability_status === 'available' && $dog->eligibility_status === 'verified', 409, 'This donor is no longer available.');
            $match->update([
                'status' => 'notified',
                'notified_at' => now(),
                'response_deadline' => now()->addMinutes((int) config('caninelink.response_window_minutes', 15)),
            ]);
            DB::table('dogs')->where('dog_id', $match->dog_id)->update([
                'availability_status' => 'in_process',
                'updated_at' => now(),
            ]);
            $match->emergencyRequest()->update(['status' => 'donor_notified']);

            Notification::create([
                'user_id' => $match->dog->owner_user_id,
                'type' => 'emergency_request',
                'title' => 'Emergency Blood Donation Request',
                'message' => 'A veterinary clinic needs a canine blood donor. Review the request and choose whether to accept or decline.',
                'related_request_id' => $match->request_id,
                'related_dog_id' => $match->dog_id,
                'created_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Donor approved and notified.', 'match_id' => $match->match_id]);
    }

    public function donorMatches(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'dog_owner', 403);

        RequestMatch::whereHas('dog', fn ($query) => $query->where('owner_user_id', $user->user_id))
            ->where('status', 'notified')
            ->whereNotNull('response_deadline')
            ->where('response_deadline', '<=', now())
            ->with('emergencyRequest')
            ->get()
            ->each(fn (RequestMatch $match) => app(RelayDonorMatches::class)->notifyNext($match->emergencyRequest));

        $matches = RequestMatch::whereHas('dog', fn ($query) => $query->where('owner_user_id', $user->user_id))
            ->whereIn('status', ['notified', 'accepted', 'declined', 'timed_out', 'expired', 'completed'])
            ->with(['emergencyRequest.bloodTypeNeeded', 'emergencyRequest.requestingClinic', 'dog'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (RequestMatch $match) => [
                'match_id' => $match->match_id,
                'request_id' => $match->request_id,
                'patient_name' => $match->emergencyRequest?->patient_name,
                'patient_breed' => $match->emergencyRequest?->patient_breed,
                'patient_weight_kg' => $match->emergencyRequest?->patient_weight_kg,
                'blood_type' => $match->emergencyRequest?->bloodTypeNeeded?->code,
                'units_needed' => $match->emergencyRequest?->units_needed,
                'notes' => $match->emergencyRequest?->notes,
                'urgency_level' => $match->emergencyRequest?->urgency_level,
                'donor_name' => $match->dog?->name,
                'clinic' => [
                    'name' => $match->emergencyRequest?->requestingClinic?->name,
                    'address' => $match->emergencyRequest?->requestingClinic?->address,
                    'phone' => $match->emergencyRequest?->requestingClinic?->contact_phone,
                    'latitude' => $match->emergencyRequest?->requestingClinic?->latitude,
                    'longitude' => $match->emergencyRequest?->requestingClinic?->longitude,
                ],
                'response_deadline' => $match->response_deadline,
                'distance_km' => $match->created_at
                    && \Illuminate\Support\Carbon::parse($match->created_at)->gte(
                        now()->subMinutes((int) config('caninelink.location_max_age_minutes', 30))
                    )
                    ? ($match->distance_km === null ? null : (float) $match->distance_km)
                    : null,
                'travel_time_minutes' => null,
                'compatibility_score' => $match->compatibility_score,
                'status' => $match->status,
                'location_permission_status' => $match->location_permission_status,
                'location_expires_at' => $match->location_expires_at,
            ]);

        return response()->json($matches);
    }

    public function respondAsDonor(Request $request, RequestMatch $match): JsonResponse
    {
        $user = $request->user();
        $decision = $request->validate(['decision' => ['required', 'in:accepted,declined']])['decision'];
        $match->load('dog');
        abort_unless($user->role === 'dog_owner' && $match->dog?->owner_user_id === $user->user_id, 403);
        abort_unless($match->status === 'notified' && $match->response_deadline && now()->lt($match->response_deadline), 409, 'This donor request has expired.');

        if ($decision === 'declined') {
            DB::transaction(function () use ($match) {
                $match->update(['status' => 'declined', 'responded_at' => now()]);
                app(RelayDonorMatches::class)->releaseDonorIfUnclaimed($match->dog_id);
                Notification::create([
                    'user_id' => $match->emergencyRequest()->value('requested_by'),
                    'type' => 'relay_forwarded',
                    'title' => 'Donor declined the request',
                    'message' => "A donor declined request #{$match->request_id}. The relay is continuing.",
                    'related_request_id' => $match->request_id,
                    'related_dog_id' => $match->dog_id,
                    'created_at' => now(),
                ]);
                app(RelayDonorMatches::class)->notifyNext($match->emergencyRequest);
            });

            return response()->json(['message' => 'Request declined. The relay has moved to the next eligible donor.']);
        }

        $verification = DB::transaction(function () use ($match, $user) {
            $lockedMatch = RequestMatch::whereKey($match->match_id)->lockForUpdate()->firstOrFail();
            abort_unless($lockedMatch->status === 'notified'
                && $lockedMatch->response_deadline
                && now()->lt($lockedMatch->response_deadline), 409, 'This donor request has expired.');

            $dog = DB::table('dogs')->where('dog_id', $lockedMatch->dog_id)->lockForUpdate()->first();
            abort_unless($dog && $dog->availability_status === 'in_process' && $dog->eligibility_status === 'verified', 409, 'This donor is no longer available.');

            $code = 'CNK-' . Str::upper(Str::random(16));
            $verification = VerificationCode::create([
                'request_id' => $lockedMatch->request_id,
                'match_id' => $lockedMatch->match_id,
                'dog_id' => $lockedMatch->dog_id,
                'code' => $code,
                'qr_payload' => json_encode(['code' => $code, 'request_id' => $lockedMatch->request_id, 'match_id' => $lockedMatch->match_id]),
                'expires_at' => now()->addHours(12),
            ]);

            $lockedMatch->update(['status' => 'accepted', 'responded_at' => now()]);
            $lockedMatch->emergencyRequest()->update(['status' => 'donor_accepted']);
            Notification::create([
                'user_id' => $lockedMatch->emergencyRequest()->value('requested_by'),
                'type' => 'match_found',
                'title' => 'A donor accepted your request',
                'message' => 'A registered donor accepted the emergency request. The donor controls whether to share a temporary location.',
                'related_request_id' => $lockedMatch->request_id,
                'related_dog_id' => $lockedMatch->dog_id,
                'created_at' => now(),
            ]);

            Notification::create([
                'user_id' => $user->user_id,
                'type' => 'verification_result',
                'title' => 'Verification QR generated',
                'message' => "Your QR code {$verification->code} is ready for clinic verification.",
                'related_request_id' => $lockedMatch->request_id,
                'related_dog_id' => $lockedMatch->dog_id,
                'created_at' => now(),
            ]);

            return $verification;
        });

        return response()->json([
            'message' => 'Donation accepted. Show this QR code at the requesting clinic.',
            'verification_code' => $verification->code,
            'qr_payload' => $verification->qr_payload,
            'expires_at' => $verification->expires_at,
        ]);
    }

    public function updateLocationSharing(Request $request, RequestMatch $match, DonorLocationService $locations): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'dog_owner' && $match->dog()->where('owner_user_id', $user->user_id)->exists(), 404);
        abort_unless($match->status === 'accepted'
            && $match->emergencyRequest()->whereIn('status', ['donor_accepted', 'verification_pending'])->exists(), 409, 'Location sharing is only available for an active accepted request.');

        $data = $request->validate([
            'consent' => ['required', 'boolean'],
            'latitude' => ['required_if:consent,true', 'numeric', 'between:-90,90'],
            'longitude' => ['required_if:consent,true', 'numeric', 'between:-180,180'],
        ]);
        $dog = $match->dog;
        abort_unless($dog, 404);

        DB::transaction(function () use ($data, $match, $dog, $user, $locations) {
            $consent = (bool) $data['consent'];
            $match->update([
                'location_permission_status' => $consent
                    ? 'granted'
                    : ($match->location_permission_status === 'granted' ? 'revoked' : 'denied'),
                'location_consent_at' => $consent ? now() : $match->location_consent_at,
                'location_expires_at' => $consent
                    ? now()->addHours((int) config('caninelink.temporary_location_hours', 2))
                    : now(),
            ]);

            if ($consent) {
                $locations->store($dog, (float) $data['latitude'], (float) $data['longitude']);
            } else {
                $hasOtherActiveShare = RequestMatch::where('dog_id', $dog->dog_id)
                    ->where('location_permission_status', 'granted')
                    ->where('location_expires_at', '>', now())
                    ->exists();
                if (! $hasOtherActiveShare) {
                    $locations->forget($dog);
                }
            }

            DB::table('audit_log')->insert([
                'user_id' => $user->user_id,
                'clinic_id' => $dog->registered_clinic_id,
                'action' => $consent ? 'emergency_location_consent_granted' : 'emergency_location_consent_revoked',
                'resource_type' => 'request_match',
                'resource_id' => $match->match_id,
                'details' => json_encode(['request_id' => $match->request_id], JSON_THROW_ON_ERROR),
                'created_at' => now(),
            ]);
        });

        return response()->json([
            'message' => (bool) $data['consent']
                ? 'Your location is shared with the requesting clinic for this active emergency only.'
                : 'Location sharing for this emergency request has been revoked.',
            'location_permission_status' => $match->fresh()->location_permission_status,
            'location_expires_at' => $match->fresh()->location_expires_at,
        ]);
    }

    public function cancel(Request $request, EmergencyRequest $emergencyRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['clinic_admin', 'clinic_staff'], true)
            && $user->clinic_id === $emergencyRequest->requesting_clinic_id, 404);
        abort_unless(! in_array($emergencyRequest->status, ['fulfilled', 'cancelled', 'expired'], true), 409);

        DB::transaction(function () use ($emergencyRequest) {
            $emergencyRequest->update(['status' => 'cancelled']);
            $dogIds = RequestMatch::where('request_id', $emergencyRequest->request_id)
                ->whereIn('status', ['queued', 'notified', 'accepted'])
                ->pluck('dog_id');
            RequestMatch::where('request_id', $emergencyRequest->request_id)
                ->whereIn('status', ['queued', 'notified', 'accepted'])
                ->update([
                    'status' => 'expired',
                    'location_permission_status' => 'expired',
                    'location_expires_at' => now(),
                ]);
            DB::table('verification_codes')
                ->where('request_id', $emergencyRequest->request_id)
                ->whereIn('status', ['issued', 'scanned'])
                ->update(['status' => 'void']);
            $this->forgetUnsharedLocations($emergencyRequest->request_id);
            $relay = app(RelayDonorMatches::class);
            foreach ($dogIds as $dogId) {
                $relay->releaseDonorIfUnclaimed((int) $dogId);
            }
        });

        return response()->json(['message' => 'Emergency request cancelled and temporary location access ended.']);
    }

    public function complete(Request $request, EmergencyRequest $emergencyRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['clinic_admin', 'clinic_staff'], true)
            && $user->clinic_id === $emergencyRequest->requesting_clinic_id, 404);
        abort_unless(in_array($emergencyRequest->status, ['donor_accepted', 'verification_pending'], true), 409);

        $data = $request->validate([
            'volume_ml' => ['nullable', 'numeric', 'min:1', 'max:10000'],
            'product_type' => ['sometimes', 'in:whole_blood,packed_rbc,plasma'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
        $match = RequestMatch::where('request_id', $emergencyRequest->request_id)
            ->where('status', 'accepted')
            ->firstOrFail();

        DB::transaction(function () use ($user, $data, $emergencyRequest, $match) {
            DB::table('donation_history')->insert([
                'dog_id' => $match->dog_id,
                'clinic_id' => $emergencyRequest->requesting_clinic_id,
                'emergency_request_id' => $emergencyRequest->request_id,
                'donation_date' => now()->toDateString(),
                'volume_ml' => $data['volume_ml'] ?? null,
                'product_type' => $data['product_type'] ?? 'whole_blood',
                'notes' => $data['notes'] ?? null,
                'recorded_by' => $user->user_id,
                'created_at' => now(),
            ]);

            DB::table('dogs')->where('dog_id', $match->dog_id)->update([
                'availability_status' => 'on_cooldown',
                'last_donation_date' => now()->toDateString(),
                'updated_at' => now(),
            ]);
            $emergencyRequest->update(['status' => 'fulfilled', 'fulfilled_at' => now()]);
            RequestMatch::where('request_id', $emergencyRequest->request_id)
                ->whereIn('status', ['queued', 'notified', 'accepted'])
                ->update([
                    'status' => DB::raw("CASE WHEN status = 'accepted' THEN 'completed' ELSE 'expired' END"),
                    'location_permission_status' => 'expired',
                    'location_expires_at' => now(),
                ]);
            $this->forgetUnsharedLocations($emergencyRequest->request_id);
            Notification::create([
                'user_id' => $match->dog()->value('owner_user_id'),
                'type' => 'verification_result',
                'title' => 'Donation recorded',
                'message' => 'The clinic recorded this donation in your dog’s history.',
                'related_request_id' => $emergencyRequest->request_id,
                'related_dog_id' => $match->dog_id,
                'created_at' => now(),
            ]);
        });

        return response()->json(['message' => 'Donation recorded and emergency request completed.']);
    }

    private function forgetUnsharedLocations(int $requestId): void
    {
        DB::table('donor_locations')
            ->whereIn('dog_id', function ($dogs) use ($requestId) {
                $dogs->select('dogs.dog_id')
                    ->from('dogs')
                    ->join('request_matches', 'request_matches.dog_id', '=', 'dogs.dog_id')
                    ->where('request_matches.request_id', $requestId)
                    ->where('dogs.location_sharing_consent', false)
                    ->whereNotExists(function ($activeShare) {
                        $activeShare->selectRaw('1')
                            ->from('request_matches as active_matches')
                            ->whereColumn('active_matches.dog_id', 'dogs.dog_id')
                            ->where('active_matches.location_permission_status', 'granted')
                            ->where('active_matches.location_expires_at', '>', now());
                    });
            })
            ->delete();
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! in_array($user->role, ['clinic_admin', 'clinic_staff'], true) || $user->clinic_id === null) {
            abort(403, 'Only clinic staff can view emergency request history.');
        }

        $requests = EmergencyRequest::with(['bloodTypeNeeded', 'matches'])
            ->latest('created_at')
            ->get()
            ->map(fn (EmergencyRequest $emergencyRequest) => [
                'request_id' => $emergencyRequest->request_id,
                'patient_name' => $emergencyRequest->patient_name,
                'patient_breed' => $emergencyRequest->patient_breed,
                'patient_weight_kg' => $emergencyRequest->patient_weight_kg,
                'blood_type' => $emergencyRequest->bloodTypeNeeded?->code,
                'units_needed' => $emergencyRequest->units_needed,
                'urgency_level' => $emergencyRequest->urgency_level,
                'status' => $emergencyRequest->status,
                'created_at' => $emergencyRequest->created_at,
                'match_count' => $emergencyRequest->matches->count(),
                'top_match' => $emergencyRequest->matches->first()?->status === 'notified'
                    ? $emergencyRequest->matches->first()->dog_id
                    : null,
            ]);

        return response()->json($requests);
    }

    public function store(Request $request, MatchDonorsForRequest $matcher): JsonResponse
    {
        $user = $request->user();

        if (! in_array($user->role, ['clinic_admin', 'clinic_staff'], true) || $user->clinic_id === null) {
            abort(403, 'Only clinic staff can create emergency requests.');
        }

        $data = $request->validate([
            'patient_name' => ['required', 'string', 'max:100'],
            'patient_breed' => ['nullable', 'string', 'max:100'],
            'patient_weight_kg' => ['nullable', 'numeric', 'min:0.1', 'max:999.99'],
            'blood_type' => ['required', 'string', 'exists:blood_types,code'],
            'units_needed' => ['required', 'integer', 'min:1', 'max:50'],
            'urgency_level' => ['required', 'in:critical,urgent,routine'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $result = DB::transaction(function () use ($data, $user, $matcher) {
            $bloodType = BloodType::where('code', $data['blood_type'])->firstOrFail();
            $emergencyRequest = EmergencyRequest::create([
                'requesting_clinic_id' => $user->clinic_id,
                'requested_by' => $user->user_id,
                'patient_name' => $data['patient_name'],
                'patient_breed' => $data['patient_breed'] ?? null,
                'patient_weight_kg' => $data['patient_weight_kg'] ?? null,
                'blood_type_needed_id' => $bloodType->blood_type_id,
                'units_needed' => $data['units_needed'],
                'urgency_level' => $data['urgency_level'],
                'notes' => $data['notes'] ?? null,
            ]);

            $emergencyRequest->setRelation('bloodTypeNeeded', $bloodType);
            $matches = $matcher->handle($emergencyRequest);

            Notification::create([
                'user_id' => $user->user_id,
                'type' => 'emergency_request',
                'title' => 'Emergency request submitted',
                'message' => "AI donor matching started for {$emergencyRequest->patient_name}.",
                'related_request_id' => $emergencyRequest->request_id,
                'created_at' => now(),
            ]);

            return [
                'request_id' => $emergencyRequest->request_id,
                'status' => $emergencyRequest->fresh()->status,
                'message' => count($matches) > 0
                    ? 'AI matching found eligible donors and started the relay.'
                    : 'Request created. No compatible eligible donors are available yet.',
                'matches' => $matches,
            ];
        });

        return response()->json($result, 201);
    }
}
