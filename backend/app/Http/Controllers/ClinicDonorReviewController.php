<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ClinicDonorReviewController extends Controller
{
    private const CANINE_BLOOD_TYPES = [
        'DEA 1.1 Positive', 'DEA 1.1 Negative', 'DEA 1.2', 'DEA 3', 'DEA 4',
        'DEA 5', 'DEA 7', 'Dal', 'Kai 1', 'Kai 2',
    ];

    public function index(Request $request): JsonResponse
    {
        $clinicId = $request->user()->clinic_id;
        abort_unless($clinicId, 403, 'Your clinic account is not assigned to a clinic.');

        $dogs = DB::table('dogs')
            ->join('users as owners', 'owners.user_id', '=', 'dogs.owner_user_id')
            ->leftJoin('blood_types', 'blood_types.blood_type_id', '=', 'dogs.blood_type_id')
            ->leftJoin('donor_verifications as latest_review', function ($join) {
                $join->on('latest_review.dog_id', '=', 'dogs.dog_id')
                    ->whereRaw('latest_review.verification_id = (select max(dv.verification_id) from donor_verifications dv where dv.dog_id = dogs.dog_id)');
            })
            ->where('dogs.registered_clinic_id', $clinicId)
            ->orderByRaw("CASE dogs.eligibility_status WHEN 'pending_review' THEN 0 ELSE 1 END")
            ->orderBy('dogs.name')
            ->get([
                'dogs.dog_id', 'dogs.name', 'dogs.breed', 'dogs.sex', 'dogs.date_of_birth',
                'dogs.weight_kg', 'dogs.eligibility_status', 'dogs.availability_status',
                'blood_types.code as blood_type', 'owners.full_name as owner_name',
                'owners.email as owner_email', 'owners.phone as owner_phone',
                'latest_review.decision as latest_decision', 'latest_review.notes as review_notes',
                'latest_review.reviewed_at',
            ]);

        return response()->json(['dogs' => $dogs]);
    }

    public function review(Request $request, int $dogId): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->clinic_id, 403, 'Your clinic account is not assigned to a clinic.');

        $data = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected', 'needs_more_info'])],
            'notes' => ['nullable', 'string', 'max:2000'],
            'blood_type' => ['nullable', 'string', Rule::in(self::CANINE_BLOOD_TYPES)],
        ]);

        $result = DB::transaction(function () use ($data, $dogId, $user) {
            $dog = DB::table('dogs')
                ->where('dog_id', $dogId)
                ->where('registered_clinic_id', $user->clinic_id)
                ->lockForUpdate()
                ->first();

            abort_unless($dog, 404, 'Dog profile not found in your clinic.');

            $bloodType = $data['blood_type'] ?? null;
            if ($bloodType === null && $dog->blood_type_id) {
                $bloodType = DB::table('blood_types')->where('blood_type_id', $dog->blood_type_id)->value('code');
            }

            if ($data['decision'] === 'approved' && ! in_array($bloodType, self::CANINE_BLOOD_TYPES, true)) {
                return [
                    'status' => 422,
                    'body' => ['message' => 'Confirm a canine blood type before approving this donor profile.'],
                ];
            }

            $bloodTypeId = ! empty($data['blood_type'])
                ? DB::table('blood_types')->where('code', $data['blood_type'])->value('blood_type_id')
                : $dog->blood_type_id;

            $eligibility = match ($data['decision']) {
                'approved' => 'verified',
                'rejected' => 'rejected',
                default => 'pending_review',
            };
            $availability = $eligibility === 'verified'
                ? (($dog->next_eligible_date && $dog->next_eligible_date > now()->toDateString()) ? 'on_cooldown' : 'available')
                : 'unavailable';

            DB::table('dogs')->where('dog_id', $dogId)->update([
                'blood_type_id' => $bloodTypeId,
                'eligibility_status' => $eligibility,
                'availability_status' => $availability,
                'updated_at' => now(),
            ]);

            DB::table('donor_verifications')->insert([
                'dog_id' => $dogId,
                'reviewed_by' => $user->user_id,
                'decision' => $data['decision'],
                'notes' => $data['notes'] ?? null,
                'reviewed_at' => now(),
            ]);

            DB::table('audit_log')->insert([
                'user_id' => $user->user_id,
                'clinic_id' => $user->clinic_id,
                'action' => 'donor_profile_'.$data['decision'],
                'resource_type' => 'dog',
                'resource_id' => $dogId,
                'details' => json_encode([
                    'eligibility_status' => $eligibility,
                    'blood_type' => $bloodType,
                    'notes' => $data['notes'] ?? null,
                ]),
                'created_at' => now(),
            ]);

            return [
                'status' => 200,
                'body' => [
                    'message' => match ($data['decision']) {
                        'approved' => 'Dog donor profile verified.',
                        'rejected' => 'Dog donor profile rejected.',
                        default => 'Dog profile returned for more information.',
                    },
                    'dog_id' => $dogId,
                    'eligibility_status' => $eligibility,
                    'availability_status' => $availability,
                    'blood_type' => $bloodType,
                ],
            ];
        });

        return response()->json($result['body'], $result['status']);
    }
}