<?php

namespace App\Http\Controllers;

use App\Models\ChatbotEvaluationResult;
use App\Models\ChatbotFaq;
use App\Models\ChatbotFeedback;
use App\Models\ChatbotKnowledgeSuggestion;
use App\Models\ChatbotKnowledgeVersion;
use App\Models\ChatbotQuestionMetric;
use App\Services\ChatbotKnowledgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ChatbotKnowledgeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'faqs' => ChatbotFaq::query()->orderBy('status')->orderBy('question')->get(),
            'suggestions' => ChatbotKnowledgeSuggestion::query()->latest()->limit(100)->get(),
            'feedback' => ChatbotFeedback::query()
                ->leftJoin('chatbot_faqs', 'chatbot_feedback.faq_id', '=', 'chatbot_faqs.id')
                ->select('chatbot_feedback.rating', 'chatbot_feedback.visibility_scope', 'chatbot_faqs.question', DB::raw('count(*) as total'))
                ->groupBy('chatbot_feedback.rating', 'chatbot_feedback.visibility_scope', 'chatbot_faqs.question')
                ->get(),
            'unanswered_questions' => ChatbotQuestionMetric::query()
                ->select('visibility_scope', 'topic', DB::raw('sum(occurrences) as occurrences'))
                ->groupBy('visibility_scope', 'topic')
                ->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedFaq($request);
        $data['status'] = 'draft';
        $faq = DB::transaction(function () use ($data, $request) {
            $faq = ChatbotFaq::create($data);
            $this->recordVersion($faq, null, 'Initial draft', $request->user()->user_id);
            $this->audit($request, 'created', $faq);

            return $faq;
        });

        return response()->json($faq, 201);
    }

    public function update(Request $request, ChatbotFaq $faq): JsonResponse
    {
        $data = $this->validatedFaq($request);
        $previousAnswer = $faq->approved_answer;

        DB::transaction(function () use ($faq, $data, $previousAnswer, $request) {
            $faq->fill($data);
            $faq->version++;
            $faq->status = 'draft';
            $faq->reviewed_by = null;
            $faq->reviewed_at = null;
            $faq->save();
            ChatbotKnowledgeVersion::create([
                'faq_id' => $faq->id,
                'version' => $faq->version,
                'previous_answer' => $previousAnswer,
                'revised_answer' => $faq->approved_answer,
                'change_reason' => $data['change_reason'] ?? null,
                'changed_by' => $request->user()->user_id,
                'created_at' => now(),
            ]);
            $this->audit($request, 'updated', $faq);
        });

        return response()->json($faq->fresh());
    }

    public function approve(Request $request, ChatbotFaq $faq): JsonResponse
    {
        $currentVersionId = $faq->versions()->where('version', $faq->version)->value('id');
        abort_unless(
            $currentVersionId !== null
                && ChatbotEvaluationResult::where('knowledge_version', $currentVersionId)
                    ->where('evaluation_status', 'passed')
                    ->exists(),
            422,
            'Run and pass a knowledge test for this version before publishing it.',
        );

        $faq->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->user_id,
            'reviewed_at' => now(),
        ]);
        $this->audit($request, 'approved', $faq);

        return response()->json($faq->fresh());
    }

    public function disable(Request $request, ChatbotFaq $faq): JsonResponse
    {
        $faq->update(['status' => 'disabled']);
        $this->audit($request, 'disabled', $faq);

        return response()->json($faq->fresh());
    }

    public function destroy(Request $request, ChatbotFaq $faq): JsonResponse
    {
        $this->audit($request, 'deleted', $faq);
        $faq->delete();

        return response()->json(['message' => 'FAQ deleted.']);
    }

    public function history(ChatbotFaq $faq): JsonResponse
    {
        return response()->json($faq->versions);
    }

    public function rollback(Request $request, ChatbotFaq $faq, ChatbotKnowledgeVersion $version): JsonResponse
    {
        abort_unless($version->faq_id === $faq->id, 404);

        DB::transaction(function () use ($faq, $version, $request) {
            $previousAnswer = $faq->approved_answer;
            $faq->update([
                'approved_answer' => $version->revised_answer,
                'version' => $faq->version + 1,
                'status' => 'draft',
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]);
            ChatbotKnowledgeVersion::create([
                'faq_id' => $faq->id,
                'version' => $faq->version,
                'previous_answer' => $previousAnswer,
                'revised_answer' => $version->revised_answer,
                'change_reason' => "Rollback to version {$version->version}",
                'changed_by' => $request->user()->user_id,
                'created_at' => now(),
            ]);
            $this->audit($request, 'rolled_back', $faq);
        });

        return response()->json($faq->fresh());
    }

    public function reviewSuggestion(Request $request, ChatbotKnowledgeSuggestion $suggestion): JsonResponse
    {
        $data = $request->validate(['decision' => ['required', Rule::in(['approve', 'reject'])]]);
        $status = $data['decision'] === 'approve' ? 'approved' : 'rejected';

        if ($status === 'approved') {
            $request->validate([
                'question' => ['required', 'string', 'max:255'],
                'answer' => ['required', 'string', 'max:10000'],
                'category' => ['required', 'string', 'max:80'],
                'visibility_scope' => ['required', Rule::in(['public', 'donor', 'clinic', 'internal'])],
            ]);
        }

        DB::transaction(function () use ($request, $suggestion, $status) {
            if ($status === 'approved') {
                $faq = ChatbotFaq::create([
                    'question' => $request->string('question')->toString(),
                    'approved_answer' => $request->string('answer')->toString(),
                    'category' => $request->string('category')->toString(),
                    'visibility_scope' => $request->string('visibility_scope')->toString(),
                    'status' => 'draft',
                ]);
                $this->recordVersion($faq, null, 'Created from an admin-reviewed suggestion', $request->user()->user_id);
                $this->audit($request, 'created_from_suggestion', $faq);
            }

            $suggestion->update([
                'review_status' => $status,
                'reviewer_id' => $request->user()->user_id,
                'reviewed_at' => now(),
            ]);
            $this->audit($request, "suggestion_{$status}", $suggestion);
        });

        return response()->json($suggestion->fresh());
    }

    public function evaluate(Request $request, ChatbotKnowledgeService $knowledge): JsonResponse
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:2000'],
            'scope' => ['required', Rule::in(['public', 'donor', 'clinic', 'internal'])],
            'faq_id' => ['required', 'integer', 'exists:chatbot_faqs,id'],
        ]);
        $faq = ChatbotFaq::findOrFail($data['faq_id']);
        abort_unless(
            in_array($faq->status, ['draft', 'approved'], true)
                && ($faq->visibility_scope === 'public' || $faq->visibility_scope === $data['scope']),
            422,
            'The selected FAQ cannot be evaluated with this visibility scope.',
        );
        $matches = $knowledge->search(
            $data['question'],
            $data['scope'],
            $faq->status === 'draft' ? $faq->id : null,
        );
        $status = $matches->first()?->id === $faq->id ? 'passed' : 'failed';
        $questionReference = hash_hmac('sha256', mb_strtolower(trim($data['question'])), (string) config('app.key'));
        $result = ChatbotEvaluationResult::create([
            'knowledge_version' => $faq->versions()->where('version', $faq->version)->value('id'),
            'test_case_reference' => $questionReference,
            'evaluation_status' => $status,
            'reviewer_notes' => $status === 'passed'
                ? 'The selected FAQ ranked first for the supplied test question. Clinical content still requires qualified review.'
                : 'The selected FAQ did not rank first for the supplied test question.',
            'reviewed_by' => $request->user()->user_id,
            'created_at' => now(),
        ]);

        return response()->json([
            'result' => $result,
            'matched_faqs' => $matches->map(fn (ChatbotFaq $faq) => [
                'id' => $faq->id,
                'question' => $faq->question,
                'answer' => $faq->approved_answer,
            ]),
        ]);
    }

    private function recordVersion(ChatbotFaq $faq, ?string $previousAnswer, string $reason, int $userId): void
    {
        ChatbotKnowledgeVersion::create([
            'faq_id' => $faq->id,
            'version' => $faq->version,
            'previous_answer' => $previousAnswer,
            'revised_answer' => $faq->approved_answer,
            'change_reason' => $reason,
            'changed_by' => $userId,
            'created_at' => now(),
        ]);
    }

    private function validatedFaq(Request $request): array
    {
        return $request->validate([
            'question' => ['required', 'string', 'max:255'],
            'approved_answer' => ['required', 'string', 'max:10000'],
            'category' => ['required', 'string', 'max:80'],
            'visibility_scope' => ['required', Rule::in(['public', 'donor', 'clinic', 'internal'])],
            'keywords' => ['nullable', 'string', 'max:1000'],
            'expires_at' => ['nullable', 'date'],
            'change_reason' => ['nullable', 'string', 'max:500'],
        ]);
    }

    private function audit(Request $request, string $action, ChatbotFaq|ChatbotKnowledgeSuggestion $resource): void
    {
        DB::table('audit_log')->insert([
            'user_id' => $request->user()->user_id,
            'clinic_id' => null,
            'action' => 'chatbot_'.$action,
            'resource_type' => $resource instanceof ChatbotFaq ? 'chatbot_faq' : 'chatbot_suggestion',
            'resource_id' => $resource->getKey(),
            'details' => json_encode(['status' => $resource->status ?? $resource->review_status]),
            'created_at' => now(),
        ]);
    }
}
