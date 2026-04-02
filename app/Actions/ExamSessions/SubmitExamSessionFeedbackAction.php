<?php

namespace App\Actions\ExamSessions;

use App\Models\ExamSession;
use App\Models\ExamSessionFeedback;
use Illuminate\Validation\ValidationException;

class SubmitExamSessionFeedbackAction
{
    public function execute(ExamSession $session, int $userId, int $rating, string $testimonial): ExamSessionFeedback
    {
        if ((int) $session->user_id !== $userId) {
            throw ValidationException::withMessages([
                'exam_session_id' => 'Session is not accessible.',
            ]);
        }

        $feedback = ExamSessionFeedback::query()
            ->where('exam_session_id', $session->id)
            ->firstOrFail();

        if ($feedback->isSubmitted()) {
            throw ValidationException::withMessages([
                'testimonial' => 'Feedback sudah dikirim.',
            ]);
        }

        $feedback->fill([
            'rating' => $rating,
            'testimonial' => $testimonial,
            'submitted_at' => now(),
        ])->save();

        return $feedback->refresh();
    }
}
