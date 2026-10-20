<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatbotFaq extends Model
{
    protected $attributes = [
        'status' => 'draft',
        'version' => 1,
    ];

    protected $fillable = [
        'question',
        'approved_answer',
        'category',
        'visibility_scope',
        'keywords',
        'status',
        'version',
        'reviewed_by',
        'reviewed_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    public function versions(): HasMany
    {
        return $this->hasMany(ChatbotKnowledgeVersion::class, 'faq_id')->orderByDesc('version');
    }
}
