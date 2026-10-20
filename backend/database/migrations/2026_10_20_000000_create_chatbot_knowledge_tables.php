<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chatbot_faqs', function (Blueprint $table) {
            $table->increments('id');
            $table->string('question');
            $table->text('approved_answer');
            $table->string('category', 80)->default('general');
            $table->enum('visibility_scope', ['public', 'donor', 'clinic', 'internal'])->default('public');
            $table->text('keywords')->nullable();
            $table->enum('status', ['draft', 'approved', 'disabled'])->default('draft');
            $table->unsignedInteger('version')->default(1);
            $table->unsignedInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->foreign('reviewed_by')->references('user_id')->on('users')->nullOnDelete();
            $table->index(['status', 'visibility_scope', 'expires_at'], 'chatbot_faq_visibility_idx');
            $table->index(['category', 'status'], 'chatbot_faq_category_idx');
        });

        Schema::create('chatbot_feedback', function (Blueprint $table) {
            $table->increments('id');
            $table->uuid('conversation_reference')->unique();
            $table->unsignedInteger('faq_id')->nullable();
            $table->enum('rating', ['helpful', 'not_helpful']);
            $table->string('visibility_scope', 20);
            $table->string('sanitized_feedback', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('faq_id')->references('id')->on('chatbot_faqs')->nullOnDelete();
            $table->index(['rating', 'created_at'], 'chatbot_feedback_rating_idx');
        });

        Schema::create('chatbot_knowledge_suggestions', function (Blueprint $table) {
            $table->increments('id');
            $table->string('proposed_question');
            $table->text('proposed_answer')->nullable();
            $table->string('category', 80)->default('general');
            $table->enum('visibility_scope', ['public', 'donor', 'clinic', 'internal'])->default('public');
            $table->enum('review_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedInteger('reviewer_id')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
            $table->foreign('reviewer_id')->references('user_id')->on('users')->nullOnDelete();
            $table->index(['review_status', 'created_at'], 'chatbot_suggestion_review_idx');
        });

        Schema::create('chatbot_knowledge_versions', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('faq_id')->nullable();
            $table->unsignedInteger('version');
            $table->text('previous_answer')->nullable();
            $table->text('revised_answer');
            $table->string('change_reason', 500)->nullable();
            $table->unsignedInteger('changed_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('faq_id')->references('id')->on('chatbot_faqs')->nullOnDelete();
            $table->foreign('changed_by')->references('user_id')->on('users')->nullOnDelete();
            $table->index(['faq_id', 'version'], 'chatbot_version_faq_idx');
        });

        Schema::create('chatbot_evaluation_results', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('knowledge_version')->nullable();
            $table->string('test_case_reference', 120);
            $table->enum('evaluation_status', ['passed', 'failed', 'needs_review']);
            $table->string('reviewer_notes', 1000)->nullable();
            $table->unsignedInteger('reviewed_by')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->foreign('knowledge_version')->references('id')->on('chatbot_knowledge_versions')->nullOnDelete();
            $table->foreign('reviewed_by')->references('user_id')->on('users')->nullOnDelete();
        });

        Schema::create('chatbot_question_metrics', function (Blueprint $table) {
            $table->increments('id');
            $table->string('question_fingerprint', 64);
            $table->string('visibility_scope', 20);
            $table->string('topic', 80)->default('general');
            $table->unsignedInteger('occurrences')->default(1);
            $table->timestamp('first_seen_at')->useCurrent();
            $table->timestamp('last_seen_at')->useCurrent();
            $table->unique(['question_fingerprint', 'visibility_scope'], 'chatbot_metric_fingerprint_scope_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_question_metrics');
        Schema::dropIfExists('chatbot_evaluation_results');
        Schema::dropIfExists('chatbot_knowledge_versions');
        Schema::dropIfExists('chatbot_knowledge_suggestions');
        Schema::dropIfExists('chatbot_feedback');
        Schema::dropIfExists('chatbot_faqs');
    }
};
