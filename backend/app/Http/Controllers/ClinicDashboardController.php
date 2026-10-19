<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ClinicDashboardController extends Controller
{
    private const ACTIVE_REQUEST_STATUSES = [
        'searching', 'donor_notified', 'donor_accepted', 'verification_pending',
    ];

    public function summary(Request $request): JsonResponse
    {
        $clinicId = $request->user()->clinic_id;
        abort_unless($clinicId, 403, 'Your clinic account is not assigned to a clinic.');

        $clinicDogs = DB::table('dogs')->where('registered_clinic_id', $clinicId);

        return response()->json([
            'active_donors' => (clone $clinicDogs)->where('eligibility_status', 'verified')->count(),
            'pending_verification' => (clone $clinicDogs)->where('eligibility_status', 'pending_review')->count(),
            'available_donors' => (clone $clinicDogs)
                ->where('eligibility_status', 'verified')
                ->where('availability_status', 'available')
                ->count(),
            'emergency_requests' => DB::table('emergency_requests')
                ->where('requesting_clinic_id', $clinicId)
                ->whereIn('status', self::ACTIVE_REQUEST_STATUSES)
                ->count(),
            'completed_transfusions' => DB::table('donation_history')
                ->where('clinic_id', $clinicId)
                ->count(),
        ]);
    }
}