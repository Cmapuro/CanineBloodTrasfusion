<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotFeedback extends Model
{
    public $timestamps = false;

    protected $fillable = ['conversation_reference', 'faq_id', 'rating', 'visibility_scope', 'sanitized_feedback'];
}
