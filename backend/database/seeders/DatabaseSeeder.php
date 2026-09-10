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

        $office = DB::table('provincial_offices')->where('name', 'CanineLink Provincial Veterinary Office')->first();
        $officeId = $office?->office_id ?? DB::table('provincial_offices')->insertGetId([
            'name' => 'CanineLink Provincial Veterinary Office',
            'created_at' => now(),
        ], 'office_id');

        DB::table('clinics')->where('email', 'clinic@caninelink.test')->update(['email' => 'dr.kang@caninelink.test']);
        DB::table('clinics')->where('email', 'clinic2@caninelink.test')->update(['email' => 'animaldoctors@caninelink.test']);
        User::where('email', 'clinic@caninelink.test')->update(['email' => 'dr.kang@caninelink.test']);
        User::where('email', 'clinic2@caninelink.test')->update(['email' => 'animaldoctors@caninelink.test']);

        $clinicId = $this->clinicId($officeId, 'Dr. Kang 24/7 Animal Emergency Clinic', 'dr.kang@caninelink.test');
        $clinicTwoId = $this->clinicId($officeId, 'Animal Doctors Veterinary Hospital Tagum', 'animaldoctors@caninelink.test');

        User::updateOrCreate(['email' => 'dr.kang@caninelink.test'], [
            'role' => 'clinic_admin',
            'clinic_id' => $clinicId,
            'full_name' => 'Dr. Kang Clinic Administrator',
            'password_hash' => Hash::make('DrKang@12345'),
            'is_active' => true,
            'is_licensed_vet' => true,
        ]);

        User::updateOrCreate(['email' => 'animaldoctors@caninelink.test'], [
            'role' => 'clinic_admin',
            'clinic_id' => $clinicTwoId,
            'full_name' => 'Animal Doctors Clinic Administrator',
            'password_hash' => Hash::make('AnimalDoctors@12345'),
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

        User::updateOrCreate(['email' => 'provincial@caninelink.test'], [
            'role' => 'gov_admin',
            'provincial_office_id' => $officeId,
            'full_name' => 'Provincial Veterinary Office Administrator',
            'password_hash' => Hash::make('Provincial@12345'),
            'is_active' => true,
        ]);

        $donor = User::updateOrCreate(['email' => 'donor@caninelink.test'], [
            'role' => 'dog_owner',
            'clinic_id' => $clinicTwoId,
            'full_name' => 'CanineLink Donor',
            'password_hash' => Hash::make('Donor@12345'),
            'is_active' => true,
        ]);

        Dog::updateOrCreate(
            ['owner_user_id' => $donor->user_id, 'name' => 'Buddy'],
            [
                'registered_clinic_id' => $clinicTwoId,
                'breed' => 'Golden Retriever',
                'sex' => 'male',
                'weight_kg' => 28.5,
                'blood_type_id' => BloodType::where('code', 'O+')->value('blood_type_id'),
                'eligibility_status' => 'verified',
                'availability_status' => 'available',
                'next_eligible_date' => now()->toDateString(),
            ]
        );

        foreach ([
            ['type' => 'verification_result', 'title' => 'Medical health record updated', 'message' => 'Buddy\'s veterinary verification and vaccination record are up to date.'],
            ['type' => 'system', 'title' => 'Transfusion history updated', 'message' => 'A completed donation record was added to your donor history.'],
        ] as $notification) {
            DB::table('notifications')->updateOrInsert(
                ['user_id' => $donor->user_id, 'title' => $notification['title']],
                [...$notification, 'is_read' => false, 'created_at' => now()]
            );
        }

        Dog::updateOrCreate(
            ['owner_user_id' => $donor->user_id, 'name' => 'Luna'],
            [
                'registered_clinic_id' => $clinicTwoId,
                'breed' => 'Labrador Retriever',
                'sex' => 'female',
                'weight_kg' => 24.2,
                'blood_type_id' => BloodType::where('code', 'A+')->value('blood_type_id'),
                'eligibility_status' => 'verified',
                'availability_status' => 'available',
                'next_eligible_date' => now()->toDateString(),
            ]
        );
    }

    private function clinicId(int $officeId, string $name, string $email): int
    {
        $clinic = DB::table('clinics')
            ->where(function ($query) use ($name, $email) {
                $query->where('name', $name)->orWhere('email', $email);
            })
            ->first();

        $data = [
            'provincial_office_id' => $officeId,
            'name' => $name,
            'address' => 'Tagum City, Davao del Norte',
            'contact_phone' => '+63 975 078 4420',
            'email' => $email,
            'latitude' => $name === 'Dr. Kang 24/7 Animal Emergency Clinic' ? 7.4475 : 7.4510,
            'longitude' => $name === 'Dr. Kang 24/7 Animal Emergency Clinic' ? 125.8078 : 125.8090,
            'is_active' => true,
            'created_at' => now(),
        ];

        DB::table('clinics')->where('email', $email)->update($data);

        if ($clinic) {
            DB::table('clinics')->where('clinic_id', $clinic->clinic_id)->update($data);
            return $clinic->clinic_id;
        }

        return DB::table('clinics')->insertGetId($data, 'clinic_id');
    }
}
