<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BloodType extends Model
{
    protected $primaryKey = 'blood_type_id';
    public $timestamps = false;
    protected $fillable = ['code', 'description'];
}
