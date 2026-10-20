<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatbotKnowledgeVersion extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'faq_id',
        'version',
        'previous_answer',
        'revised_answer',
        'change_reason',
        'changed_by',
    ];
}
