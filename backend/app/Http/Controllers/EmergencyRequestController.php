<?php

namespace App\Http\Controllers;

use App\Models\BloodType;
use App\Models\EmergencyRequest;
use App\Services\MatchDonorsForRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmergencyRequestController extends Controller
{
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
