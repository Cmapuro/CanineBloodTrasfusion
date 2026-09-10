<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RequestMatch extends Model
{
    protected $primaryKey = 'match_id';
    public $timestamps = false;
    protected $fillable = [
        'request_id', 'dog_id', 'compatibility_score', 'distance_km',
        'rank_order', 'status', 'notified_at', 'response_deadline', 'responded_at',
    ];
}
