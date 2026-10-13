<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const HUMAN_ABO_CODES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

    public function up(): void
    {
        $legacyBloodTypeIds = DB::table('blood_types')
            ->whereIn('code', self::HUMAN_ABO_CODES)
            ->pluck('blood_type_id');

        DB::table('dogs')
            ->whereIn('blood_type_id', $legacyBloodTypeIds)
            ->update([
                'blood_type_id' => null,
                'eligibility_status' => 'pending_review',
                'availability_status' => 'unavailable',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // A human ABO result cannot safely be restored as a canine blood type.
    }
};