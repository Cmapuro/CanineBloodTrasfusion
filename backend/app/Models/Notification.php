<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $primaryKey = 'notification_id';
    public $timestamps = false;
    protected $fillable = [
        'user_id', 'type', 'title', 'message', 'related_request_id',
        'related_dog_id', 'is_read', 'created_at',
    ];
    protected $casts = ['is_read' => 'boolean', 'created_at' => 'datetime'];
}
