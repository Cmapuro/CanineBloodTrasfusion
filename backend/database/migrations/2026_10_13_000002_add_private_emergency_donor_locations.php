<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dogs', function (Blueprint $table) {
            $table->timestamp('location_sharing_consent_at')->nullable();
        });

        Schema::table('request_matches', function (Blueprint $table) {
            $table->string('location_permission_status', 20)->default('not_requested');
            $table->timestamp('location_consent_at')->nullable();
            $table->timestamp('location_expires_at')->nullable();
        });

        Schema::create('donor_locations', function (Blueprint $table) {
            $table->increments('location_id');
            $table->unsignedInteger('dog_id')->unique();
            $table->text('latitude_encrypted');
            $table->text('longitude_encrypted');
            $table->timestamp('captured_at');
            $table->foreign('dog_id')->references('dog_id')->on('dogs')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('donor_locations');

        Schema::table('request_matches', function (Blueprint $table) {
            $table->dropColumn([
                'location_permission_status',
                'location_consent_at',
                'location_expires_at',
            ]);
        });

        Schema::table('dogs', function (Blueprint $table) {
            $table->dropColumn('location_sharing_consent_at');
        });
    }
};
