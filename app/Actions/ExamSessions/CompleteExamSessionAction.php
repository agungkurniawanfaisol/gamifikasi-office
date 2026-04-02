<?php

namespace App\Actions\ExamSessions;

use App\Enums\ExamStatus;
use App\Models\ExamSession;
use Illuminate\Validation\ValidationException;

class CompleteExamSessionAction
{
    public function execute(int $sessionId, int $userId, bool $timedOut = false): ExamSession
    {
        $session = ExamSession::query()
            ->withCount('sessionQuestions')
            ->findOrFail($sessionId);

        if ((int) $session->user_id !== $userId || ! $session->isInProgress()) {
            throw ValidationException::withMessages([
                'exam_session_id' => 'Session is not accessible.',
            ]);
        }

        $totalScore = (int) $session->answers()->sum('score');
        $durationSeconds = max(0, (int) $session->started_at->diffInSeconds(now()));

        $session->fill([
            'status' => $timedOut ? ExamStatus::TimedOut : ExamStatus::Completed,
            'total_score' => $totalScore,
            'max_possible_score' => (int) $session->session_questions_count,
            'completed_at' => now(),
            'duration_seconds' => $durationSeconds,
        ])->save();

        return $session->refresh();
    }
}

