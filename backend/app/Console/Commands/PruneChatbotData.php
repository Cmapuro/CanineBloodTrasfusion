<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PruneChatbotData extends Command
{
    protected $signature = 'caninelink:chatbot-prune';

    protected $description = 'Delete chatbot feedback and unanswered-question aggregates older than 180 days.';

    public function handle(): int
    {
        $retentionDate = now()->subDays(180);
        $feedbackDeleted = DB::table('chatbot_feedback')->where('created_at', '<', $retentionDate)->delete();
        $metricsDeleted = DB::table('chatbot_question_metrics')->where('last_seen_at', '<', $retentionDate)->delete();

        $this->info("Deleted {$feedbackDeleted} feedback records and {$metricsDeleted} unanswered-question aggregates.");

        return self::SUCCESS;
    }
}
