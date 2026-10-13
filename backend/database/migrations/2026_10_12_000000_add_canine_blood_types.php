<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const CODES = [
        'DEA 1.1 Positive', 'DEA 1.1 Negative', 'DEA 1.2', 'DEA 3', 'DEA 4',
        'DEA 5', 'DEA 7', 'Dal', 'Kai 1', 'Kai 2',
    ];

    public function up(): void
    {
        foreach (self::CODES as $code) {
            DB::table('blood_types')->insertOrIgnore([
                'code' => $code,
                'description' => "Canine blood type {$code}",
            ]);
        }
    }

    public function down(): void
    {
        DB::table('blood_types')
            ->whereIn('code', self::CODES)
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('dogs')
                    ->whereColumn('dogs.blood_type_id', 'blood_types.blood_type_id');
            })
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('emergency_requests')
                    ->whereColumn('emergency_requests.blood_type_needed_id', 'blood_types.blood_type_id');
            })
            ->delete();
    }
};