<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotEvaluationResult extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'knowledge_version',
        'test_case_reference',
        'evaluation_status',
        'reviewer_notes',
        'reviewed_by',
    ];
}
