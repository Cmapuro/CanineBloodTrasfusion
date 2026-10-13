<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScanVerificationCodeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'qr_payload' => ['required', 'string', 'max:4096'],
        ])['qr_payload'];

        $user = $request->user();
        abort_unless(
            in_array($user->role, ['clinic_admin', 'clinic_staff'], true) && $user->clinic_id,
            403,
            'Only clinic staff can verify donor QR codes.'
        );

        $decoded = json_decode($payload, true);
        $code = json_last_error() === JSON_ERROR_NONE
            ? (is_array($decoded) ? ($decoded['code'] ?? null) : null)
            : trim($payload);

        if (! is_string($code) || ! preg_match('/\ACNK-[A-Z0-9]{4,16}\z/i', $code)) {
            return response()->json(['message' => 'The QR code payload is invalid.'], 422);
        }

        $result = DB::transaction(function () use ($code, $user) {
            $verification = DB::table('verification_codes')
                ->where('code', strtoupper($code))
                ->lockForUpdate()
                ->first();

            if (! $verification) {
                return ['status' => 404, 'message' => 'Verification code not found.'];
            }

            $emergencyRequest = DB::table('emergency_requests')
                ->where('request_id', $verification->request_id)
                ->first();

            if (! $emergencyRequest || (int) $emergencyRequest->requesting_clinic_id !== (int) $user->clinic_id) {
                return ['status' => 404, 'message' => 'Verification code not found.'];
            }

            if (in_array($verification->status, ['scanned', 'verified'], true)) {
                return ['status' => 409, 'message' => 'This verification code has already been processed.'];
            }

            if (in_array($verification->status, ['expired', 'void'], true)) {
                return ['status' => 410, 'message' => 'This verification code is no longer active.'];
            }

            if ($verification->status !== 'issued') {
                return ['status' => 409, 'message' => 'This verification code cannot be processed.'];
            }

            if (now()->greaterThanOrEqualTo($verification->expires_at)) {
                DB::table('verification_codes')
                    ->where('code_id', $verification->code_id)
                    ->update(['status' => 'expired']);

                return ['status' => 410, 'message' => 'This verification code has expired.'];
            }

            $match = DB::table('request_matches')
                ->where('match_id', $verification->match_id)
                ->where('request_id', $verification->request_id)
                ->where('dog_id', $verification->dog_id)
                ->first();

            if (! $match || $match->status !== 'accepted') {
                return ['status' => 409, 'message' => 'The donor request is not awaiting clinic verification.'];
            }

            if (! in_array($emergencyRequest->status, ['donor_accepted', 'verification_pending'], true)) {
                return ['status' => 409, 'message' => 'The emergency request is no longer active.'];
            }

            $donor = DB::table('dogs')
                ->leftJoin('blood_types', 'blood_types.blood_type_id', '=', 'dogs.blood_type_id')
                ->where('dogs.dog_id', $verification->dog_id)
                ->select(['dogs.name', 'dogs.dog_id', 'blood_types.code as blood_type'])
                ->first();
            $clinic = DB::table('clinics')
                ->where('clinic_id', $emergencyRequest->requesting_clinic_id)
                ->value('name');

            if (! $donor) {
                return ['status' => 404, 'message' => 'Verification code not found.'];
            }

            $scannedAt = now();
            DB::table('verification_codes')
                ->where('code_id', $verification->code_id)
                ->update([
                    'status' => 'verified',
                    'scanned_by' => $user->user_id,
                    'scanned_at' => $scannedAt,
                ]);
            DB::table('emergency_requests')
                ->where('request_id', $emergencyRequest->request_id)
                ->update(['status' => 'verification_pending']);

            return [
                'status' => 200,
                'message' => 'Donor QR code verified successfully.',
                'data' => [
                    'code' => $verification->code,
                    'status' => 'verified',
                    'donor_name' => $donor->name,
                    'dog_id' => $donor->dog_id,
                    'blood_type' => $donor->blood_type,
                    'patient_name' => $emergencyRequest->patient_name,
                    'clinic_name' => $clinic,
                    'scanned_at' => $scannedAt->toISOString(),
                ],
            ];
        });

        $httpStatus = $result['status'];
        unset($result['status']);

        return response()->json($result, $httpStatus);
    }
}