<?php

namespace App\Http\Controllers;

use App\Models\ChatbotFaq;
use App\Models\ChatbotFeedback;
use App\Models\ChatbotKnowledgeSuggestion;
use App\Models\ChatbotQuestionMetric;
use App\Services\ChatbotKnowledgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class ChatbotController extends Controller
{
    public function chat(Request $request, ChatbotKnowledgeService $knowledge): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'min:2', 'max:2000'],
        ]);

        $user = Auth::guard('sanctum')->user();
        $scope = match ($user?->role) {
            'dog_owner' => 'donor',
            'clinic_admin', 'clinic_staff' => 'clinic',
            'gov_admin' => 'internal',
            default => 'public',
        };

        $faqs = $knowledge->search($data['message'], $scope);

        if ($faqs->isEmpty()) {
            $normalized = mb_strtolower(trim(preg_replace('/\s+/u', ' ', $data['message']) ?? ''));
            $fingerprint = hash_hmac('sha256', $normalized, (string) config('app.key'));
            $topic = $knowledge->topic($data['message']);
            ChatbotQuestionMetric::upsert(
                [[
                    'question_fingerprint' => $fingerprint,
                    'visibility_scope' => $scope,
                    'topic' => $topic,
                    'occurrences' => 1,
                    'first_seen_at' => now(),
                    'last_seen_at' => now(),
                ]],
                ['question_fingerprint', 'visibility_scope'],
                ['occurrences' => DB::raw('occurrences + 1'), 'last_seen_at'],
            );

            ChatbotKnowledgeSuggestion::firstOrCreate(
                [
                    'proposed_question' => "Unanswered user question about {$topic}",
                    'visibility_scope' => $scope,
                    'review_status' => 'pending',
                ],
                ['category' => $topic],
            );
        }

        try {
            $answer = $knowledge->answer($data['message'], $faqs);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'The chatbot is temporarily unavailable. Please try again later or contact a veterinary clinic.',
            ], 503);
        }

        return response()->json([
            'answer' => $answer,
            'conversation_reference' => (string) Str::uuid(),
            'faq_id' => $faqs->first()?->id,
            'matched_knowledge' => $faqs->isNotEmpty(),
            'provider_used' => $faqs->isNotEmpty() && $knowledge->usesProviderFor($data['message']),
        ]);
    }

    public function feedback(Request $request): JsonResponse
    {
        $data = $request->validate([
            'conversation_reference' => ['required', 'uuid'],
            'faq_id' => ['nullable', 'integer', 'exists:chatbot_faqs,id'],
            'rating' => ['required', Rule::in(['helpful', 'not_helpful'])],
        ]);

        $user = Auth::guard('sanctum')->user();
        $scope = match ($user?->role) {
            'dog_owner' => 'donor',
            'clinic_admin', 'clinic_staff' => 'clinic',
            'gov_admin' => 'internal',
            default => 'public',
        };

        if (isset($data['faq_id'])) {
            $visibleScopes = match ($scope) {
                'donor' => ['public', 'donor'],
                'clinic' => ['public', 'clinic'],
                'internal' => ['public', 'donor', 'clinic', 'internal'],
                default => ['public'],
            };
            abort_unless(
                ChatbotFaq::whereKey($data['faq_id'])
                    ->whereIn('visibility_scope', $visibleScopes)
                    ->exists(),
                404,
            );
        }

        ChatbotFeedback::create([
            'conversation_reference' => $data['conversation_reference'],
            'faq_id' => $data['faq_id'] ?? null,
            'rating' => $data['rating'],
            'visibility_scope' => $scope,
        ] + ['created_at' => now()]);

        return response()->json(['message' => 'Feedback received.']);
    }
}
