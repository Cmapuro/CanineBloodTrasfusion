<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotKnowledgeSuggestion extends Model
{
    protected $fillable = [
        'proposed_question',
        'proposed_answer',
        'category',
        'visibility_scope',
        'review_status',
        'reviewer_id',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }
}
