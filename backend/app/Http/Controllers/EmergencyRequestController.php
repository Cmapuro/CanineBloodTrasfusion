<?php

namespace App\Http\Controllers;

use App\Models\BloodType;
use App\Models\EmergencyRequest;
use App\Models\Dog;
use App\Models\RequestMatch;
use App\Models\VerificationCode;
use App\Models\Notification;
use App\Services\MatchDonorsForRequest;
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

        $matches = RequestMatch::whereHas('dog', fn ($query) => $query->where('registered_clinic_id', $user->clinic_id))
            ->whereIn('status', ['queued', 'notified'])
            ->with(['emergencyRequest.bloodTypeNeeded', 'emergencyRequest.requestingClinic', 'dog'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (RequestMatch $match) => [
                'match_id' => $match->match_id,
                'request_id' => $match->request_id,
                'patient_name' => $match->emergencyRequest?->patient_name,
                'blood_type' => $match->emergencyRequest?->bloodTypeNeeded?->code,
                'urgency_level' => $match->emergencyRequest?->urgency_level,
                'clinic' => [
                    'name' => $match->emergencyRequest?->requestingClinic?->name,
                    'address' => $match->emergencyRequest?->requestingClinic?->address,
                    'phone' => $match->emergencyRequest?->requestingClinic?->contact_phone,
                ],
                'donor_name' => $match->dog?->name,
                'donor_blood_type' => $match->dog?->bloodType?->code,
                'status' => $match->status,
                'compatibility_score' => $match->compatibility_score,
            ]);

        return response()->json($matches);
    }

    public function approveMatch(Request $request, RequestMatch $match): JsonResponse
    {
        $user = $request->user();
        $match->load('dog');
        abort_unless(in_array($user->role, ['clinic_admin', 'clinic_staff'], true)
            && $user->clinic_id === $match->dog?->registered_clinic_id, 403);

        $match->update([
            'status' => 'notified',
            'notified_at' => now(),
            'response_deadline' => now()->addMinutes(15),
        ]);

        Notification::create([
            'user_id' => $match->dog->owner_user_id,
            'type' => 'match_found',
            'title' => 'Emergency donor request approved',
            'message' => "Your donor {$match->dog->name} was approved for an emergency request.",
            'related_request_id' => $match->request_id,
            'related_dog_id' => $match->dog_id,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Donor approved and notified.', 'match_id' => $match->match_id]);
    }

    public function donorMatches(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->role === 'dog_owner', 403);

        $matches = RequestMatch::whereHas('dog', fn ($query) => $query->where('owner_user_id', $user->user_id))
            ->where('status', 'notified')
            ->with(['emergencyRequest.bloodTypeNeeded', 'emergencyRequest.requestingClinic', 'dog'])
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
                'compatibility_score' => $match->compatibility_score,
            ]);

        return response()->json($matches);
    }

    public function respondAsDonor(Request $request, RequestMatch $match): JsonResponse
    {
        $user = $request->user();
        $decision = $request->validate(['decision' => ['required', 'in:accepted,declined']])['decision'];
        $match->load('dog');
        abort_unless($user->role === 'dog_owner' && $match->dog?->owner_user_id === $user->user_id, 403);

        if ($decision === 'declined') {
            $match->update(['status' => 'declined', 'responded_at' => now()]);
            return response()->json(['message' => 'Request declined.']);
        }

        $code = 'CNK-' . random_int(1000, 9999);
        $verification = VerificationCode::create([
            'request_id' => $match->request_id,
            'match_id' => $match->match_id,
            'dog_id' => $match->dog_id,
            'code' => $code,
            'qr_payload' => json_encode(['code' => $code, 'request_id' => $match->request_id, 'match_id' => $match->match_id]),
            'expires_at' => now()->addHours(12),
        ]);

        Notification::create([
            'user_id' => $user->user_id,
            'type' => 'verification_result',
            'title' => 'Verification QR generated',
            'message' => "Your QR code {$verification->code} is ready for clinic verification.",
            'related_request_id' => $match->request_id,
            'related_dog_id' => $match->dog_id,
            'created_at' => now(),
        ]);

        $match->update(['status' => 'accepted', 'responded_at' => now()]);
        $match->emergencyRequest()->update(['status' => 'donor_accepted']);

        return response()->json([
            'message' => 'Donation accepted. Show this QR code at the requesting clinic.',
            'verification_code' => $verification->code,
            'qr_payload' => $verification->qr_payload,
            'expires_at' => $verification->expires_at,
        ]);
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
