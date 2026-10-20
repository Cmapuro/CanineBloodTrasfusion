<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotQuestionMetric extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'question_fingerprint',
        'visibility_scope',
        'occurrences',
        'first_seen_at',
        'last_seen_at',
    ];
}
