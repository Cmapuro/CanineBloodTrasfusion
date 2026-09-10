<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClinicController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['clinic_admin', 'clinic_staff'], true) && $user->clinic_id, 403);

        return response()->json($user->clinic);
    }

    public function updateLocation(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['clinic_admin', 'clinic_staff'], true) && $user->clinic_id, 403);

        $data = $request->validate([
            'address' => ['nullable', 'string', 'max:500'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'email' => ['required', 'email', 'max:150'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $clinic = $user->clinic;
        abort_unless($clinic, 404);
        $clinic->update($data);

        return response()->json([
            'message' => 'Permanent clinic location saved.',
            'clinic' => $clinic->fresh(),
        ]);
    }
}
