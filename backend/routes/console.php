<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;
use App\Models\EmergencyRequest;
use App\Services\RelayDonorMatches;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    EmergencyRequest::query()
        ->whereIn('status', ['searching', 'donor_notified'])
        ->orderBy('request_id')
        ->chunkById(100, function ($requests) {
            $relay = app(RelayDonorMatches::class);
            foreach ($requests as $request) {
                $relay->notifyNext($request);
            }
        }, 'request_id');

    DB::table('request_matches')
        ->where('location_permission_status', 'granted')
        ->where('location_expires_at', '<=', now())
        ->update(['location_permission_status' => 'expired']);

    DB::table('donor_locations')
        ->whereIn('dog_id', function ($dogs) {
            $dogs->select('dog_id')
                ->from('dogs')
                ->where('location_sharing_consent', false)
                ->whereNotExists(function ($activeShare) {
                    $activeShare->selectRaw('1')
                        ->from('request_matches')
                        ->whereColumn('request_matches.dog_id', 'dogs.dog_id')
                        ->where('request_matches.location_permission_status', 'granted')
                        ->where('request_matches.location_expires_at', '>', now());
                });
        })
        ->delete();
})->name('caninelink-emergency-donor-relay')->everyMinute()->withoutOverlapping();

Schedule::command('caninelink:chatbot-prune')->daily()->withoutOverlapping();
