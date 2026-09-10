<?php

namespace App\Models;

use App\Models\Scopes\ClinicScope;
use Illuminate\Database\Eloquent\Model;

class Dog extends Model
{
    protected $primaryKey = 'dog_id';

    protected $fillable = [
        'owner_user_id', 'registered_clinic_id', 'name', 'breed', 'sex',
        'date_of_birth', 'weight_kg', 'photo_url', 'blood_type_id',
        'eligibility_status', 'availability_status', 'last_donation_date',
        'next_eligible_date',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new ClinicScope());
    }
}
