<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ClinicDirectoryController extends Controller
{
    public function index(): JsonResponse
    {
        $clinics = DB::table('clinics')
            ->where('is_active', true)
            ->orderBy('name')
            ->orderBy('clinic_id')
            ->get([
                'clinic_id',
                'name',
                'address',
                'contact_phone',
                'email',
                'latitude',
                'longitude',
            ])
            ->unique(fn ($clinic) => implode('|', [
                mb_strtolower(trim((string) $clinic->name)),
                mb_strtolower(trim((string) $clinic->address)),
                trim((string) $clinic->contact_phone),
                mb_strtolower(trim((string) $clinic->email)),
                $clinic->latitude === null ? '' : number_format((float) $clinic->latitude, 7, '.', ''),
                $clinic->longitude === null ? '' : number_format((float) $clinic->longitude, 7, '.', ''),
            ]))
            ->values();

        return response()->json(['clinics' => $clinics]);
    }
}