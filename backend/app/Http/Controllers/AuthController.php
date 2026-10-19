<?php

namespace App\Http\Controllers;

use App\Models\Dog;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function registerDonor(Request $request): JsonResponse
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'clinic_id' => ['required', 'integer', Rule::exists('clinics', 'clinic_id')->where('is_active', true)],
            'dog_name' => ['required', 'string', 'max:100'],
            'breed' => ['required', 'string', 'max:100'],
            'sex' => ['required', Rule::in(['male', 'female'])],
            'age_years' => ['required', 'integer', 'min:1', 'max:15'],
            'weight_kg' => ['nullable', 'numeric', 'min:0.1', 'max:999.99'],
            'blood_type' => [
                'nullable',
                'string',
                Rule::exists('blood_types', 'code')->whereIn('code', [
                    'DEA 1.1 Positive', 'DEA 1.1 Negative', 'DEA 1.2', 'DEA 3', 'DEA 4',
                    'DEA 5', 'DEA 7', 'Dal', 'Kai 1', 'Kai 2',
                ]),
            ],
        ]);

        [$user, $dog] = DB::transaction(function () use ($data) {
            $user = User::create([
                'role' => 'dog_owner',
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'password_hash' => Hash::make($data['password']),
            ]);

            $bloodTypeId = isset($data['blood_type'])
                ? DB::table('blood_types')->where('code', $data['blood_type'])->value('blood_type_id')
                : null;

            $dog = Dog::withoutGlobalScopes()->create([
                'owner_user_id' => $user->user_id,
                'registered_clinic_id' => $data['clinic_id'],
                'name' => $data['dog_name'],
                'breed' => $data['breed'],
                'sex' => $data['sex'],
                'date_of_birth' => Carbon::today()->subYears((int) $data['age_years'])->toDateString(),
                'weight_kg' => $data['weight_kg'] ?? null,
                'blood_type_id' => $bloodTypeId,
                'eligibility_status' => 'pending_review',
                'availability_status' => 'unavailable',
            ]);

            return [$user, $dog];
        });

        $clinic = DB::table('clinics')->where('clinic_id', $dog->registered_clinic_id)->first(['clinic_id', 'name']);

        return response()->json([
            'user' => $user->load('clinic'),
            'dog' => [
                'dog_id' => $dog->dog_id,
                'name' => $dog->name,
                'breed' => $dog->breed,
                'sex' => $dog->sex,
                'age_years' => (int) $data['age_years'],
                'weight_kg' => $dog->weight_kg,
                'blood_type' => $data['blood_type'] ?? null,
                'clinic_id' => $clinic->clinic_id,
                'clinic_name' => $clinic->name,
                'eligibility_status' => $dog->eligibility_status,
            ],
            'token' => $user->createToken('caninelink-web')->plainTextToken,
        ], 201);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', 'in:clinic_admin,clinic_staff,dog_owner'],
            'full_name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8'],
            'clinic_id' => ['nullable', 'integer', 'exists:clinics,clinic_id'],
        ]);

        $user = User::create([
            'role' => $data['role'],
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password_hash' => Hash::make($data['password']),
            'clinic_id' => $data['clinic_id'] ?? null,
        ]);

        return response()->json([
            'user' => $user->load('clinic'),
            'token' => $user->createToken('caninelink-web')->plainTextToken,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->where('is_active', true)->first();

        if ($user === null || ! Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['message' => 'The provided credentials are incorrect.'], 422);
        }

        return response()->json([
            'user' => $user->load('clinic'),
            'token' => $user->createToken('caninelink-web')->plainTextToken,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }
}
