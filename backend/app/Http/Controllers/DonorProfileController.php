<?php

namespace App\Http\Controllers;

use App\Models\BloodType;
use App\Models\Dog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class DonorProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->ownerData($request->user()));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user->user_id, 'user_id')],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:2000'],
            'current_password' => ['required_with:new_password', 'string'],
            'new_password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (! empty($data['new_password']) && ! Hash::check($data['current_password'], $user->password_hash)) {
            return response()->json(['message' => 'The current password is incorrect.'], 422);
        }

        $updates = [
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'updated_at' => now(),
        ];
        if (! empty($data['new_password'])) {
            $updates['password_hash'] = Hash::make($data['new_password']);
        }

        DB::table('users')->where('user_id', $user->user_id)->update($updates);

        return response()->json([
            'message' => 'Owner profile updated successfully.',
            'profile' => $this->ownerData($user->fresh()),
        ]);
    }

    public function dogs(Request $request): JsonResponse
    {
        $dogs = DB::table('dogs')
            ->leftJoin('blood_types', 'blood_types.blood_type_id', '=', 'dogs.blood_type_id')
            ->join('clinics', 'clinics.clinic_id', '=', 'dogs.registered_clinic_id')
            ->where('dogs.owner_user_id', $request->user()->user_id)
            ->orderBy('dogs.created_at')
            ->select([
                'dogs.dog_id', 'dogs.name', 'dogs.breed', 'dogs.sex', 'dogs.date_of_birth',
                'dogs.weight_kg', 'dogs.eligibility_status', 'dogs.availability_status',
                'dogs.blood_type_id', 'blood_types.code as blood_type',
                'clinics.clinic_id', 'clinics.name as clinic_name',
            ])
            ->get()
            ->map(fn ($dog) => $this->dogData($dog));

        return response()->json(['dogs' => $dogs]);
    }

    public function donationHistory(Request $request): JsonResponse
    {
        $history = DB::table('donation_history as donations')
            ->join('dogs', 'dogs.dog_id', '=', 'donations.dog_id')
            ->join('clinics', 'clinics.clinic_id', '=', 'donations.clinic_id')
            ->leftJoin('blood_types', 'blood_types.blood_type_id', '=', 'dogs.blood_type_id')
            ->leftJoin('emergency_requests', 'emergency_requests.request_id', '=', 'donations.emergency_request_id')
            ->where('dogs.owner_user_id', $request->user()->user_id)
            ->orderByDesc('donations.donation_date')
            ->orderByDesc('donations.donation_id')
            ->get([
                'donations.donation_id',
                'donations.donation_date',
                'donations.volume_ml',
                'donations.product_type',
                'donations.notes',
                'dogs.dog_id',
                'dogs.name as dog_name',
                'blood_types.code as blood_type',
                'clinics.name as clinic_name',
                'emergency_requests.patient_name as recipient_name',
                'emergency_requests.patient_name',
            ]);

        return response()->json(['donations' => $history]);
    }

    public function clinics(): JsonResponse
    {
        $clinics = DB::table('clinics')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['clinic_id', 'name', 'address']);

        return response()->json(['clinics' => $clinics]);
    }

    public function storeDog(Request $request): JsonResponse
    {
        $data = $this->validateDog($request);
        $user = $request->user();
        $clinicId = $data['clinic_id']
            ?? $user->clinic_id
            ?? DB::table('clinics')->where('is_active', true)->orderBy('clinic_id')->value('clinic_id');

        if (! $clinicId) {
            return response()->json(['message' => 'No active clinic is available to review this dog profile.'], 422);
        }

        $clinicIsActive = DB::table('clinics')->where('clinic_id', $clinicId)->where('is_active', true)->exists();
        if (! $clinicIsActive) {
            return response()->json(['message' => 'Select an active veterinary clinic.'], 422);
        }

        $dog = DB::transaction(function () use ($data, $user, $clinicId) {
            $dog = Dog::withoutGlobalScopes()->create([
                'owner_user_id' => $user->user_id,
                'registered_clinic_id' => $clinicId,
                'name' => $data['name'],
                'breed' => $data['breed'] ?? null,
                'sex' => $data['sex'],
                'date_of_birth' => Carbon::today()->subYears((int) $data['age_years'])->toDateString(),
                'weight_kg' => $data['weight_kg'] ?? null,
                'blood_type_id' => ! empty($data['blood_type'])
                    ? BloodType::where('code', $data['blood_type'])->value('blood_type_id')
                    : null,
                'eligibility_status' => 'pending_review',
                'availability_status' => 'unavailable',
            ]);

            return DB::table('dogs')
                ->leftJoin('blood_types', 'blood_types.blood_type_id', '=', 'dogs.blood_type_id')
                ->join('clinics', 'clinics.clinic_id', '=', 'dogs.registered_clinic_id')
                ->where('dogs.dog_id', $dog->dog_id)
                ->select([
                    'dogs.dog_id', 'dogs.name', 'dogs.breed', 'dogs.sex', 'dogs.date_of_birth',
                    'dogs.weight_kg', 'dogs.eligibility_status', 'dogs.availability_status',
                    'dogs.blood_type_id', 'blood_types.code as blood_type',
                    'clinics.clinic_id', 'clinics.name as clinic_name',
                ])
                ->first();
        });

        return response()->json([
            'message' => 'Dog profile added and sent for veterinary review.',
            'dog' => $this->dogData($dog),
        ], 201);
    }

    public function updateDog(Request $request, int $dogId): JsonResponse
    {
        $data = $this->validateDog($request);
        $user = $request->user();

        $requestedClinicId = $data['clinic_id'] ?? null;
        if ($requestedClinicId && ! DB::table('clinics')->where('clinic_id', $requestedClinicId)->where('is_active', true)->exists()) {
            return response()->json(['message' => 'Select an active veterinary clinic.'], 422);
        }

        $dog = DB::transaction(function () use ($data, $dogId, $user, $requestedClinicId) {
            $dogModel = Dog::withoutGlobalScopes()
                ->where('owner_user_id', $user->user_id)
                ->where('dog_id', $dogId)
                ->lockForUpdate()
                ->firstOrFail();
            $bloodTypeId = ! empty($data['blood_type'])
                ? BloodType::where('code', $data['blood_type'])->value('blood_type_id')
                : null;

            $dogModel->fill([
                'name' => $data['name'],
                'breed' => $data['breed'] ?? null,
                'sex' => $data['sex'],
                'date_of_birth' => Carbon::today()->subYears((int) $data['age_years'])->toDateString(),
                'weight_kg' => $data['weight_kg'] ?? null,
                'blood_type_id' => $bloodTypeId,
                'registered_clinic_id' => $requestedClinicId ?? $dogModel->registered_clinic_id,
                'eligibility_status' => 'pending_review',
                'availability_status' => 'unavailable',
            ])->save();

            return DB::table('dogs')
                ->leftJoin('blood_types', 'blood_types.blood_type_id', '=', 'dogs.blood_type_id')
                ->join('clinics', 'clinics.clinic_id', '=', 'dogs.registered_clinic_id')
                ->where('dogs.dog_id', $dogId)
                ->select([
                    'dogs.dog_id', 'dogs.name', 'dogs.breed', 'dogs.sex', 'dogs.date_of_birth',
                    'dogs.weight_kg', 'dogs.eligibility_status', 'dogs.availability_status',
                    'dogs.blood_type_id', 'blood_types.code as blood_type',
                    'clinics.clinic_id', 'clinics.name as clinic_name',
                ])
                ->first();
        });

        return response()->json([
            'message' => 'Dog details updated and returned to veterinary review.',
            'dog' => $this->dogData($dog),
        ]);
    }

    private function validateDog(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'breed' => ['nullable', 'string', 'max:100'],
            'sex' => ['required', Rule::in(['male', 'female'])],
            'age_years' => ['required', 'integer', 'min:0', 'max:30'],
            'weight_kg' => ['nullable', 'numeric', 'min:0.1', 'max:999.99'],
            'clinic_id' => ['sometimes', 'integer', 'exists:clinics,clinic_id'],
            'blood_type' => [
                'nullable',
                'string',
                Rule::exists('blood_types', 'code')->whereIn('code', [
                    'DEA 1.1 Positive', 'DEA 1.1 Negative', 'DEA 1.2', 'DEA 3', 'DEA 4',
                    'DEA 5', 'DEA 7', 'Dal', 'Kai 1', 'Kai 2',
                ]),
            ],
        ]);
    }

    private function ownerData($user): array
    {
        return [
            'user_id' => $user->user_id,
            'full_name' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'address' => $user->address,
        ];
    }

    private function dogData($dog): array
    {
        return [
            'dog_id' => $dog->dog_id,
            'clinic_id' => $dog->registered_clinic_id ?? $dog->clinic_id ?? null,
            'clinic_name' => $dog->clinic_name ?? null,
            'name' => $dog->name,
            'breed' => $dog->breed,
            'sex' => $dog->sex,
            'age_years' => $dog->date_of_birth ? Carbon::parse($dog->date_of_birth)->age : null,
            'date_of_birth' => $dog->date_of_birth,
            'weight_kg' => $dog->weight_kg,
            'blood_type_id' => $dog->blood_type_id,
            'blood_type' => $dog->blood_type,
            'eligibility_status' => $dog->eligibility_status,
            'availability_status' => $dog->availability_status,
        ];
    }
}