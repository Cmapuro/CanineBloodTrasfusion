<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerificationCode extends Model
{
    protected $primaryKey = 'code_id';
    public $timestamps = false;
    protected $fillable = [
        'request_id', 'match_id', 'dog_id', 'code', 'qr_payload', 'status',
        'issued_at', 'expires_at', 'scanned_by', 'scanned_at',
    ];
    protected $casts = ['expires_at' => 'datetime', 'issued_at' => 'datetime', 'scanned_at' => 'datetime'];
}
