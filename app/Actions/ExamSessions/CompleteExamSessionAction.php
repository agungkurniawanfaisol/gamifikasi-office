<?php

namespace App\Actions\ExamSessions;

use App\Enums\ExamStatus;
use App\Models\ExamSession;
use App\Services\Audit\AuditTrailService;
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

        $scoreBefore = $session->total_score !== null ? (int) $session->total_score : 0;
        $session->fill([
            'status' => $timedOut ? ExamStatus::TimedOut : ExamStatus::Completed,
            'total_score' => $totalScore,
            'max_possible_score' => (int) $session->session_questions_count,
            'completed_at' => now(),
            'duration_seconds' => $durationSeconds,
        ])->save();

        $session = $session->refresh();

        app(AuditTrailService::class)->record(
            payload: [
                'event_type' => 'score_event',
                'event_key' => $timedOut ? 'exam.complete.timed_out' : 'exam.complete',
                'subject_type' => 'exam_session',
                'subject_id' => (int) $session->id,
                'subject_label' => 'Complete exam session',
                'exam_session_id' => (int) $session->id,
                'score_before' => $scoreBefore,
                'score_after' => (int) $session->total_score,
                'metadata' => [
                    'max_possible_score' => (int) $session->max_possible_score,
                    'duration_seconds' => (int) $session->duration_seconds,
                    'status' => $session->status->value,
                ],
            ],
            actor: $session->user,
        );

        return $session;
    }
}

