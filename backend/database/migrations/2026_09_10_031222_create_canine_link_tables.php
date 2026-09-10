<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('provincial_offices', function (Blueprint $table) {
            $table->increments('office_id');
            $table->string('name', 150);
            $table->string('region', 150)->nullable();
            $table->string('contact_email', 150)->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('clinics', function (Blueprint $table) {
            $table->increments('clinic_id');
            $table->unsignedInteger('provincial_office_id');
            $table->string('name', 150);
            $table->text('address')->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('license_number', 100)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('added_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('provincial_office_id')->references('office_id')->on('provincial_offices');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('provincial_office_id')->references('office_id')->on('provincial_offices');
            $table->foreign('clinic_id')->references('clinic_id')->on('clinics');
        });

        Schema::table('clinics', function (Blueprint $table) {
            $table->foreign('added_by')->references('user_id')->on('users')->nullOnDelete();
        });

        Schema::create('blood_types', function (Blueprint $table) {
            $table->increments('blood_type_id');
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
        });

        Schema::create('dogs', function (Blueprint $table) {
            $table->increments('dog_id');
            $table->unsignedInteger('owner_user_id');
            $table->unsignedInteger('registered_clinic_id');
            $table->string('name', 100);
            $table->string('breed', 100)->nullable();
            $table->enum('sex', ['male', 'female'])->nullable();
            $table->date('date_of_birth')->nullable();
            $table->decimal('weight_kg', 5, 2)->nullable();
            $table->text('photo_url')->nullable();
            $table->unsignedInteger('blood_type_id')->nullable();
            $table->enum('eligibility_status', ['pending_review', 'verified', 'rejected', 'suspended'])->default('pending_review');
            $table->enum('availability_status', ['available', 'unavailable', 'on_cooldown', 'in_process'])->default('unavailable');
            $table->date('last_donation_date')->nullable();
            $table->date('next_eligible_date')->nullable();
            $table->timestamps();
            $table->foreign('owner_user_id')->references('user_id')->on('users');
            $table->foreign('registered_clinic_id')->references('clinic_id')->on('clinics');
            $table->foreign('blood_type_id')->references('blood_type_id')->on('blood_types')->nullOnDelete();
            $table->index(['registered_clinic_id', 'eligibility_status', 'availability_status', 'blood_type_id'], 'dogs_clinic_status_blood_idx');
        });

        Schema::create('dog_vaccinations', function (Blueprint $table) {
            $table->increments('vaccination_id');
            $table->unsignedInteger('dog_id');
            $table->string('vaccine_name', 150);
            $table->date('date_administered');
            $table->date('expiration_date')->nullable();
            $table->text('certificate_url')->nullable();
            $table->unsignedInteger('recorded_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('dog_id')->references('dog_id')->on('dogs')->cascadeOnDelete();
            $table->foreign('recorded_by')->references('user_id')->on('users')->nullOnDelete();
        });

        Schema::create('dog_medical_history', function (Blueprint $table) {
            $table->increments('history_id');
            $table->unsignedInteger('dog_id');
            $table->date('entry_date');
            $table->text('description');
            $table->unsignedInteger('recorded_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('dog_id')->references('dog_id')->on('dogs')->cascadeOnDelete();
            $table->foreign('recorded_by')->references('user_id')->on('users')->nullOnDelete();
        });

        Schema::create('donor_verifications', function (Blueprint $table) {
            $table->increments('verification_id');
            $table->unsignedInteger('dog_id');
            $table->unsignedInteger('reviewed_by');
            $table->enum('decision', ['approved', 'rejected', 'needs_more_info']);
            $table->text('notes')->nullable();
            $table->timestamp('reviewed_at')->useCurrent();
            $table->foreign('dog_id')->references('dog_id')->on('dogs')->cascadeOnDelete();
            $table->foreign('reviewed_by')->references('user_id')->on('users');
        });

        Schema::create('emergency_requests', function (Blueprint $table) {
            $table->increments('request_id');
            $table->unsignedInteger('requesting_clinic_id');
            $table->unsignedInteger('requested_by');
            $table->string('patient_name', 100)->nullable();
            $table->string('patient_breed', 100)->nullable();
            $table->decimal('patient_weight_kg', 5, 2)->nullable();
            $table->unsignedInteger('blood_type_needed_id');
            $table->unsignedInteger('units_needed')->default(1);
            $table->enum('urgency_level', ['critical', 'urgent', 'routine'])->default('urgent');
            $table->enum('status', ['searching', 'donor_notified', 'donor_accepted', 'verification_pending', 'fulfilled', 'cancelled', 'expired'])->default('searching');
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('fulfilled_at')->nullable();
            $table->foreign('requesting_clinic_id')->references('clinic_id')->on('clinics');
            $table->foreign('requested_by')->references('user_id')->on('users');
            $table->foreign('blood_type_needed_id')->references('blood_type_id')->on('blood_types');
            $table->index(['requesting_clinic_id', 'status']);
        });

        Schema::create('request_matches', function (Blueprint $table) {
            $table->increments('match_id');
            $table->unsignedInteger('request_id');
            $table->unsignedInteger('dog_id');
            $table->decimal('compatibility_score', 5, 2)->nullable();
            $table->decimal('distance_km', 6, 2)->nullable();
            $table->unsignedInteger('rank_order');
            $table->enum('status', ['queued', 'notified', 'accepted', 'declined', 'timed_out', 'expired', 'completed'])->default('queued');
            $table->timestamp('notified_at')->nullable();
            $table->timestamp('response_deadline')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('request_id')->references('request_id')->on('emergency_requests')->cascadeOnDelete();
            $table->foreign('dog_id')->references('dog_id')->on('dogs');
            $table->unique(['request_id', 'dog_id']);
        });

        Schema::create('donation_history', function (Blueprint $table) {
            $table->increments('donation_id');
            $table->unsignedInteger('dog_id');
            $table->unsignedInteger('clinic_id');
            $table->unsignedInteger('emergency_request_id')->nullable();
            $table->date('donation_date');
            $table->decimal('volume_ml', 6, 2)->nullable();
            $table->enum('product_type', ['whole_blood', 'packed_rbc', 'plasma'])->default('whole_blood');
            $table->text('notes')->nullable();
            $table->unsignedInteger('recorded_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('dog_id')->references('dog_id')->on('dogs');
            $table->foreign('clinic_id')->references('clinic_id')->on('clinics');
            $table->foreign('emergency_request_id')->references('request_id')->on('emergency_requests')->nullOnDelete();
            $table->foreign('recorded_by')->references('user_id')->on('users')->nullOnDelete();
        });

        Schema::create('verification_codes', function (Blueprint $table) {
            $table->increments('code_id');
            $table->unsignedInteger('request_id');
            $table->unsignedInteger('match_id');
            $table->unsignedInteger('dog_id');
            $table->string('code', 20)->unique();
            $table->text('qr_payload');
            $table->enum('status', ['issued', 'scanned', 'verified', 'expired', 'void'])->default('issued');
            $table->timestamp('issued_at')->useCurrent();
            $table->timestamp('expires_at');
            $table->unsignedInteger('scanned_by')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->foreign('request_id')->references('request_id')->on('emergency_requests')->cascadeOnDelete();
            $table->foreign('match_id')->references('match_id')->on('request_matches');
            $table->foreign('dog_id')->references('dog_id')->on('dogs');
            $table->foreign('scanned_by')->references('user_id')->on('users')->nullOnDelete();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->increments('notification_id');
            $table->unsignedInteger('user_id');
            $table->enum('type', ['emergency_request', 'match_found', 'relay_forwarded', 'donation_reminder', 'verification_result', 'system']);
            $table->string('title', 150);
            $table->text('message');
            $table->unsignedInteger('related_request_id')->nullable();
            $table->unsignedInteger('related_dog_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('user_id')->references('user_id')->on('users');
            $table->foreign('related_request_id')->references('request_id')->on('emergency_requests')->nullOnDelete();
            $table->foreign('related_dog_id')->references('dog_id')->on('dogs')->nullOnDelete();
        });

        Schema::create('access_requests', function (Blueprint $table) {
            $table->increments('access_request_id');
            $table->unsignedInteger('requesting_clinic_id');
            $table->unsignedInteger('owning_clinic_id');
            $table->unsignedInteger('dog_id')->nullable();
            $table->text('reason')->nullable();
            $table->unsignedInteger('requested_by');
            $table->enum('status', ['pending', 'approved', 'denied', 'revoked'])->default('pending');
            $table->unsignedInteger('responded_by')->nullable();
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreign('requesting_clinic_id')->references('clinic_id')->on('clinics');
            $table->foreign('owning_clinic_id')->references('clinic_id')->on('clinics');
            $table->foreign('dog_id')->references('dog_id')->on('dogs')->nullOnDelete();
            $table->foreign('requested_by')->references('user_id')->on('users');
            $table->foreign('responded_by')->references('user_id')->on('users')->nullOnDelete();
        });

        Schema::create('access_grants', function (Blueprint $table) {
            $table->increments('grant_id');
            $table->unsignedInteger('access_request_id');
            $table->unsignedInteger('requesting_clinic_id');
            $table->unsignedInteger('owning_clinic_id');
            $table->unsignedInteger('dog_id')->nullable();
            $table->timestamp('granted_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->foreign('access_request_id')->references('access_request_id')->on('access_requests');
            $table->foreign('requesting_clinic_id')->references('clinic_id')->on('clinics');
            $table->foreign('owning_clinic_id')->references('clinic_id')->on('clinics');
            $table->foreign('dog_id')->references('dog_id')->on('dogs')->nullOnDelete();
        });

        Schema::create('audit_log', function (Blueprint $table) {
            $table->increments('log_id');
            $table->unsignedInteger('user_id')->nullable();
            $table->unsignedInteger('clinic_id')->nullable();
            $table->string('action', 50);
            $table->string('resource_type', 30)->nullable();
            $table->unsignedInteger('resource_id')->nullable();
            $table->json('details')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('user_id')->references('user_id')->on('users')->nullOnDelete();
            $table->foreign('clinic_id')->references('clinic_id')->on('clinics')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_log');
        Schema::dropIfExists('access_grants');
        Schema::dropIfExists('access_requests');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('verification_codes');
        Schema::dropIfExists('donation_history');
        Schema::dropIfExists('request_matches');
        Schema::dropIfExists('emergency_requests');
        Schema::dropIfExists('donor_verifications');
        Schema::dropIfExists('dog_medical_history');
        Schema::dropIfExists('dog_vaccinations');
        Schema::dropIfExists('dogs');
        Schema::dropIfExists('blood_types');
        Schema::table('clinics', fn (Blueprint $table) => $table->dropForeign(['added_by']));
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['clinic_id']);
            $table->dropForeign(['provincial_office_id']);
        });
        Schema::dropIfExists('clinics');
        Schema::dropIfExists('provincial_offices');
    }
};
