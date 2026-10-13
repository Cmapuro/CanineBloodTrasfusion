<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmergencyRequestController;
use App\Http\Controllers\ClinicController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NearbyLocationController;
use App\Http\Controllers\ScanVerificationCodeController;
use App\Http\Controllers\DonorProfileController;
use App\Http\Controllers\ClinicDonorReviewController;
use App\Http\Controllers\ClinicDirectoryController;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/clinics', [ClinicDirectoryController::class, 'index']);

Route::middleware('auth:sanctum')->get('/me', function (\Illuminate\Http\Request $request) {
    return response()->json($request->user()->load('clinic'));
});

Route::middleware(['auth:sanctum', 'role:dog_owner'])->prefix('donor')->group(function () {
    Route::get('/profile', [DonorProfileController::class, 'show']);
    Route::put('/profile', [DonorProfileController::class, 'updateProfile']);
    Route::get('/dogs', [DonorProfileController::class, 'dogs']);
    Route::post('/dogs', [DonorProfileController::class, 'storeDog']);
    Route::patch('/dogs/{dogId}', [DonorProfileController::class, 'updateDog']);
    Route::get('/clinics', [DonorProfileController::class, 'clinics']);
});

Route::middleware(['auth:sanctum', 'role:clinic_admin,clinic_staff'])->prefix('clinic')->group(function () {
    Route::get('/donor-dogs', [ClinicDonorReviewController::class, 'index']);
    Route::patch('/donor-dogs/{dogId}/verification', [ClinicDonorReviewController::class, 'review']);
});

Route::middleware('auth:sanctum')->post('/auth/logout', [AuthController::class, 'logout']);
Route::middleware('auth:sanctum')->post('/emergency-requests', [EmergencyRequestController::class, 'store']);
Route::middleware('auth:sanctum')->get('/emergency-requests', [EmergencyRequestController::class, 'index']);
Route::middleware('auth:sanctum')->get('/clinic/matches', [EmergencyRequestController::class, 'clinicMatches']);
Route::middleware('auth:sanctum')->post('/matches/{match}/approve', [EmergencyRequestController::class, 'approveMatch']);
Route::middleware('auth:sanctum')->get('/donor/matches', [EmergencyRequestController::class, 'donorMatches']);
Route::middleware('auth:sanctum')->post('/matches/{match}/respond', [EmergencyRequestController::class, 'respondAsDonor']);
Route::middleware('auth:sanctum')->get('/donor/verification-codes', [EmergencyRequestController::class, 'donorVerificationCodes']);
Route::middleware('auth:sanctum')->post('/donor/verification-codes/{verificationCode}/archive', [EmergencyRequestController::class, 'archiveVerificationCode']);
Route::middleware(['auth:sanctum', 'role:clinic_admin,clinic_staff', 'throttle:10,1'])
    ->post('/verification-codes/scan', ScanVerificationCodeController::class);
Route::middleware('auth:sanctum')->get('/notifications', [NotificationController::class, 'index']);
Route::middleware('auth:sanctum')->post('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
Route::middleware('auth:sanctum')->post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
Route::middleware('auth:sanctum')->get('/clinic/profile', [ClinicController::class, 'show']);
Route::middleware('auth:sanctum')->put('/clinic/location', [ClinicController::class, 'updateLocation']);
Route::middleware(['auth:sanctum', 'role:clinic_admin,clinic_staff'])
    ->get('/nearby-locations', [NearbyLocationController::class, 'index']);
Route::middleware(['auth:sanctum', 'role:dog_owner'])
    ->get('/donor/location-sharing', [NearbyLocationController::class, 'donorSharingSettings']);
Route::middleware(['auth:sanctum', 'role:dog_owner'])
    ->put('/donor/dogs/{dogId}/location-sharing', [NearbyLocationController::class, 'updateDonorSharingConsent']);
