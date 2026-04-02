<?php

namespace App\Actions\ExamSessions;

use App\Enums\ExamStatus;
use App\Models\ExamSession;
use Illuminate\Support\Facades\DB;

class StartExamSessionAction
{
    public function __construct(
        private readonly ResolveQuestionSourceAction $resolveQuestionSourceAction,
    ) {
    }

    public function execute(int $userId, int $levelId): ExamSession
    {
        $existing = ExamSession::query()
            ->where('user_id', $userId)
            ->where('level_id', $levelId)
            ->where('status', ExamStatus::InProgress)
            ->latest('id')
            ->first();

        if ($existing) {
            return $existing;
        }

        $resolved = $this->resolveQuestionSourceAction->execute($levelId);

        return DB::transaction(function () use ($userId, $levelId, $resolved): ExamSession {
            $session = ExamSession::query()->create([
                'user_id' => $userId,
                'level_id' => $levelId,
                'skill_category_id' => $resolved['skill_category_id'],
                'status' => ExamStatus::InProgress,
                'randomization_seed' => random_int(1, 2147483647),
                'total_score' => 0,
                'max_possible_score' => count($resolved['items']),
                'started_at' => now(),
                'duration_seconds' => $resolved['duration_seconds'],
            ]);

            $rows = [];
            foreach ($resolved['items'] as $item) {
                $rows[] = [
                    'exam_session_id' => $session->id,
                    'question_id' => $item['question_id'],
                    'order' => $item['order'],
                    'expected_duration_seconds' => $item['expected_duration_seconds'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('exam_session_questions')->insert($rows);

            return $session;
        });
    }
}

