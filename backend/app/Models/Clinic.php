<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clinic extends Model
{
    protected $primaryKey = 'clinic_id';
    public $timestamps = false;
    protected $fillable = ['provincial_office_id', 'name', 'address', 'contact_phone', 'email', 'latitude', 'longitude', 'is_active'];
}
