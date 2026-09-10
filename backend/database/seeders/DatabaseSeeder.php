<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\BloodType;
use App\Models\Dog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach (['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as $code) {
            BloodType::updateOrCreate(['code' => $code], ['description' => "Canine blood type {$code}"]);
        }

        $officeId = DB::table('provincial_offices')->insertGetId([
            'name' => 'CanineLink Provincial Veterinary Office',
            'created_at' => now(),
        ], 'office_id');

        $clinicId = DB::table('clinics')->insertGetId([
            'provincial_office_id' => $officeId,
            'name' => 'CanineLink Veterinary Clinic',
            'email' => 'clinic@caninelink.test',
            'is_active' => true,
            'created_at' => now(),
        ], 'clinic_id');

        User::updateOrCreate(['email' => 'clinic@caninelink.test'], [
            'role' => 'clinic_admin',
            'clinic_id' => $clinicId,
            'full_name' => 'CanineLink Clinic Admin',
            'password_hash' => Hash::make('Clinic@12345'),
            'is_active' => true,
            'is_licensed_vet' => true,
        ]);

        User::updateOrCreate(['email' => 'admin@caninelink.test'], [
            'role' => 'gov_admin',
            'provincial_office_id' => $officeId,
            'full_name' => 'CanineLink Government Admin',
            'password_hash' => Hash::make('Admin@12345'),
            'is_active' => true,
        ]);

        $donor = User::updateOrCreate(['email' => 'donor@caninelink.test'], [
            'role' => 'dog_owner',
            'full_name' => 'CanineLink Donor',
            'password_hash' => Hash::make('Donor@12345'),
            'is_active' => true,
        ]);

        Dog::updateOrCreate(
            ['owner_user_id' => $donor->user_id, 'name' => 'Buddy'],
            [
                'registered_clinic_id' => $clinicId,
                'breed' => 'Golden Retriever',
                'sex' => 'male',
                'weight_kg' => 28.5,
                'blood_type_id' => BloodType::where('code', 'O+')->value('blood_type_id'),
                'eligibility_status' => 'verified',
                'availability_status' => 'available',
                'next_eligible_date' => now()->toDateString(),
            ]
        );
    }
}
