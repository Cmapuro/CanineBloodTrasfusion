<?php

namespace App\Models;

use App\Models\Scopes\ClinicScope;
use Illuminate\Database\Eloquent\Model;

class EmergencyRequest extends Model
{
    protected $primaryKey = 'request_id';
    public $timestamps = false;

    protected $fillable = [
        'requesting_clinic_id', 'requested_by', 'patient_name', 'patient_breed',
        'patient_weight_kg', 'blood_type_needed_id', 'units_needed',
        'urgency_level', 'status', 'notes', 'fulfilled_at',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new ClinicScope());
    }

    public function bloodTypeNeeded()
    {
        return $this->belongsTo(BloodType::class, 'blood_type_needed_id', 'blood_type_id');
    }

    public function matches()
    {
        return $this->hasMany(RequestMatch::class, 'request_id', 'request_id')->orderBy('rank_order');
    }
}
