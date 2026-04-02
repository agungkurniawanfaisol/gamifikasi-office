<?php

namespace App\Actions\ExamSessions;

use App\Models\ExamSession;
use App\Models\ExamSessionFeedback;
use App\Services\ExamSessions\ExamCompletionMessageService;

class EnsureExamSessionFeedbackAction
{
    public function __construct(
        private readonly ExamCompletionMessageService $completionMessageService,
    ) {}

    public function execute(ExamSession $session): ExamSessionFeedback
    {
        $existing = ExamSessionFeedback::query()
            ->where('exam_session_id', $session->id)
            ->first();

        if ($existing !== null) {
            return $existing;
        }

        return ExamSessionFeedback::query()->create([
            'exam_session_id' => $session->id,
            'user_id' => $session->user_id,
            'completion_message' => $this->completionMessageService->messageForSession($session),
        ]);
    }
}
