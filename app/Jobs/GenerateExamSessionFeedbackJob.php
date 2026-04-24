<?php

namespace App\Jobs;

use App\Enums\ExamSessionFeedbackAiStatus;
use App\Models\ExamSession;
use App\Models\ExamSessionFeedback;
use App\Services\ExamSessions\ExamCompletionMessageService;
use App\Services\Gemini\GeminiFeedbackService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class GenerateExamSessionFeedbackJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public function __construct(
        public readonly int $examSessionId,
    ) {}

    public function handle(
        GeminiFeedbackService $geminiFeedbackService,
        ExamCompletionMessageService $fallbackService,
    ): void {
        $session = ExamSession::query()
            ->with(['user:id,name', 'level:id,name', 'feedback'])
            ->find($this->examSessionId);

        if (! $session instanceof ExamSession) {
            return;
        }

        $feedback = $session->feedback;
        if (! $feedback instanceof ExamSessionFeedback) {
            return;
        }

        if ($feedback->ai_status === ExamSessionFeedbackAiStatus::Ready) {
            return;
        }

        try {
            $result = $geminiFeedbackService->generateForSession($session);
            $feedback->forceFill([
                'completion_message' => $result['text'],
                'ai_status' => ExamSessionFeedbackAiStatus::Ready,
                'ai_generated_at' => now(),
                'ai_error_message' => null,
                'ai_model' => (string) ($result['model'] ?? config('services.gemini.model', 'gemini-2.5-flash')),
            ])->save();
        } catch (Throwable $exception) {
            $feedback->forceFill([
                'completion_message' => $fallbackService->messageForSession($session),
                'ai_status' => ExamSessionFeedbackAiStatus::Failed,
                'ai_error_message' => mb_substr($exception->getMessage(), 0, 500),
                'ai_generated_at' => now(),
                'ai_model' => (string) config('services.gemini.model', 'gemini-2.5-flash'),
            ])->save();
        }
    }
}
