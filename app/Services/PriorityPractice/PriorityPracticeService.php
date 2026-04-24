<?php

namespace App\Services\PriorityPractice;

use App\Enums\ExamStatus;
use App\Models\DailyActivityAnswer;
use App\Models\ExamAnswer;
use App\Models\PriorityPracticeAnswer;
use App\Models\PriorityPracticeSession;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\SkillCategory;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PriorityPracticeService
{
    private const PACKAGE_SIZE = 5;

    private const SESSION_EXPIRY_HOURS = 48;

    public function expireStaleActiveSessions(int $studentId): void
    {
        PriorityPracticeSession::query()
            ->where('user_id', $studentId)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);
    }

    /**
     * Sesi terbaru untuk ditampilkan di halaman index (tanpa membuat paket baru).
     */
    public function findLatestSessionForIndex(int $studentId): ?PriorityPracticeSession
    {
        $this->expireStaleActiveSessions($studentId);

        return PriorityPracticeSession::query()
            ->where('user_id', $studentId)
            ->latest('id')
            ->with('skillCategory:id,name')
            ->first();
    }

    public function hasActiveFutureSession(int $studentId): bool
    {
        $this->expireStaleActiveSessions($studentId);

        return PriorityPracticeSession::query()
            ->where('user_id', $studentId)
            ->where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '>', now())
            ->exists();
    }

    /**
     * @return array{
     *   id:int,
     *   status:string,
     *   generatedAt:string,
     *   expiresAt:string,
     *   completedAt:?string,
     *   answeredCount:int,
     *   correctCount:int,
     *   totalQuestions:int,
     *   focusSkill:string
     * }
     */
    public function createNewPackage(int $studentId): array
    {
        $this->expireStaleActiveSessions($studentId);

        if ($this->hasActiveFutureSession($studentId)) {
            throw new RuntimeException('Masih ada paket latihan prioritas yang aktif. Selesaikan atau tunggu kedaluwarsa sebelum membuat paket baru.');
        }

        $skillCategory = $this->resolveWeakSkillCategory($studentId);
        $questions = $this->pickQuestions($skillCategory->id);

        if ($questions->count() < self::PACKAGE_SIZE) {
            throw new RuntimeException('Soal aktif untuk latihan prioritas belum mencukupi (minimal 5).');
        }

        $created = PriorityPracticeSession::query()->create([
            'user_id' => $studentId,
            'skill_category_id' => $skillCategory->id,
            'status' => 'active',
            'question_ids' => $questions->pluck('id')->values()->all(),
            'total_questions' => self::PACKAGE_SIZE,
            'answered_count' => 0,
            'correct_count' => 0,
            'generated_at' => now(),
            'expires_at' => now()->addHours(self::SESSION_EXPIRY_HOURS),
            'completed_at' => null,
        ]);

        $created->load('skillCategory:id,name');

        return $this->serializeSession($created);
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function loadQuestions(int $studentId, int $sessionId): Collection
    {
        $session = $this->guardSession($studentId, $sessionId);
        $questionIds = collect($session->question_ids ?? [])->map(fn ($id) => (int) $id)->values();

        $questions = Question::query()
            ->select(['id', 'question_text'])
            ->whereIn('id', $questionIds)
            ->with(['options:id,question_id,option_text,order,is_correct'])
            ->get()
            ->keyBy('id');

        return $questionIds
            ->map(function (int $questionId) use ($questions): ?array {
                $question = $questions->get($questionId);
                if ($question === null) {
                    return null;
                }

                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'options' => $question->options
                        ->sortBy('order')
                        ->values()
                        ->map(fn ($option) => [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                        ])
                        ->all(),
                ];
            })
            ->filter()
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function loadAnswers(int $studentId, int $sessionId): Collection
    {
        $session = $this->guardSession($studentId, $sessionId);

        return $session->answers()
            ->select(['id', 'question_id', 'selected_option_id', 'is_correct', 'answered_at'])
            ->get()
            ->map(fn (PriorityPracticeAnswer $answer) => [
                'id' => $answer->id,
                'question_id' => (int) $answer->question_id,
                'selected_option_id' => $answer->selected_option_id !== null ? (int) $answer->selected_option_id : null,
                'is_correct' => (bool) $answer->is_correct,
                'answered_at' => $answer->answered_at?->toDateTimeString(),
            ])
            ->values();
    }

    /**
     * @param array{priority_practice_session_id:int,question_id:int,selected_option_id:int} $payload
     */
    public function submitAnswer(int $studentId, array $payload): void
    {
        DB::transaction(function () use ($studentId, $payload): void {
            $session = PriorityPracticeSession::query()
                ->where('id', $payload['priority_practice_session_id'])
                ->where('user_id', $studentId)
                ->lockForUpdate()
                ->firstOrFail();

            if ($session->status !== 'active') {
                throw new RuntimeException('Sesi latihan prioritas tidak aktif.');
            }

            if ($session->expires_at !== null && $session->expires_at->isPast()) {
                $session->update(['status' => 'expired']);
                throw new RuntimeException('Sesi latihan prioritas sudah kedaluwarsa.');
            }

            $questionIds = collect($session->question_ids ?? [])->map(fn ($id) => (int) $id)->all();
            if (! in_array($payload['question_id'], $questionIds, true)) {
                throw new RuntimeException('Soal tidak termasuk dalam paket latihan prioritas ini.');
            }

            $alreadyAnswered = PriorityPracticeAnswer::query()
                ->where('priority_practice_session_id', $session->id)
                ->where('question_id', $payload['question_id'])
                ->exists();

            if ($alreadyAnswered) {
                throw new RuntimeException('Soal ini sudah pernah dijawab.');
            }

            $selectedOption = QuestionOption::query()
                ->where('id', $payload['selected_option_id'])
                ->where('question_id', $payload['question_id'])
                ->first();

            if ($selectedOption === null) {
                throw new RuntimeException('Pilihan jawaban tidak valid untuk soal ini.');
            }

            $isCorrect = (bool) $selectedOption->is_correct;

            PriorityPracticeAnswer::query()->create([
                'priority_practice_session_id' => $session->id,
                'question_id' => $payload['question_id'],
                'selected_option_id' => $selectedOption->id,
                'is_correct' => $isCorrect,
                'answered_at' => now(),
            ]);

            $answeredCount = PriorityPracticeAnswer::query()
                ->where('priority_practice_session_id', $session->id)
                ->count();
            $correctCount = PriorityPracticeAnswer::query()
                ->where('priority_practice_session_id', $session->id)
                ->where('is_correct', true)
                ->count();

            $session->update([
                'answered_count' => $answeredCount,
                'correct_count' => $correctCount,
                'status' => $answeredCount >= $session->total_questions ? 'completed' : 'active',
                'completed_at' => $answeredCount >= $session->total_questions ? now() : null,
            ]);
        });
    }

    private function guardSession(int $studentId, int $sessionId): PriorityPracticeSession
    {
        return PriorityPracticeSession::query()
            ->where('id', $sessionId)
            ->where('user_id', $studentId)
            ->with('answers:id,priority_practice_session_id,question_id,selected_option_id,is_correct,answered_at')
            ->firstOrFail();
    }

    private function resolveWeakSkillCategory(int $studentId): SkillCategory
    {
        $from = CarbonImmutable::today()->subDays(6)->startOfDay();
        $to = CarbonImmutable::today()->endOfDay();

        $wrongCounts = collect();

        ExamAnswer::query()
            ->whereHas('examSession', function ($query) use ($studentId, $from, $to): void {
                $query->where('user_id', $studentId)
                    ->whereIn('status', [ExamStatus::Completed, ExamStatus::TimedOut])
                    ->whereBetween('completed_at', [$from, $to]);
            })
            ->where('is_correct', false)
            ->with('question:id,skill_category_id')
            ->get()
            ->each(function (ExamAnswer $answer) use ($wrongCounts): void {
                $skillId = $answer->question?->skill_category_id;
                if ($skillId === null) {
                    return;
                }

                $wrongCounts->put($skillId, (int) $wrongCounts->get($skillId, 0) + 1);
            });

        DailyActivityAnswer::query()
            ->whereHas('log', function ($query) use ($studentId, $from, $to): void {
                $query->where('user_id', $studentId)
                    ->whereBetween('activity_date', [$from->toDateString(), $to->toDateString()]);
            })
            ->where('is_correct', false)
            ->with('question:id,skill_category_id')
            ->get()
            ->each(function (DailyActivityAnswer $answer) use ($wrongCounts): void {
                $skillId = $answer->question?->skill_category_id;
                if ($skillId === null) {
                    return;
                }

                $wrongCounts->put($skillId, (int) $wrongCounts->get($skillId, 0) + 1);
            });

        if ($wrongCounts->isNotEmpty()) {
            $skillId = (int) $wrongCounts->sortDesc()->keys()->first();

            $skill = SkillCategory::query()->find($skillId);
            if ($skill !== null) {
                return $skill;
            }
        }

        $fallback = SkillCategory::query()
            ->whereHas('questions', fn ($query) => $query->where('is_active', true))
            ->orderBy('id')
            ->first();

        if ($fallback === null) {
            throw new RuntimeException('Belum ada skill category dengan soal aktif untuk latihan prioritas.');
        }

        return $fallback;
    }

    /**
     * @return Collection<int, Question>
     */
    private function pickQuestions(int $skillCategoryId): Collection
    {
        return Question::query()
            ->select(['id'])
            ->where('skill_category_id', $skillCategoryId)
            ->where('is_active', true)
            ->whereHas('options', fn ($query) => $query->where('is_correct', true))
            ->withCount('options')
            ->having('options_count', '>=', 2)
            ->inRandomOrder()
            ->limit(self::PACKAGE_SIZE)
            ->get();
    }

    /**
     * @return array{
     *   id:int,
     *   status:string,
     *   generatedAt:string,
     *   expiresAt:string,
     *   completedAt:?string,
     *   answeredCount:int,
     *   correctCount:int,
     *   totalQuestions:int,
     *   focusSkill:string
     * }
     */
    public function serializeSession(PriorityPracticeSession $session): array
    {
        return [
            'id' => (int) $session->id,
            'status' => (string) $session->status,
            'generatedAt' => $session->generated_at?->toDateTimeString() ?? now()->toDateTimeString(),
            'expiresAt' => $session->expires_at?->toDateTimeString() ?? now()->addHours(self::SESSION_EXPIRY_HOURS)->toDateTimeString(),
            'completedAt' => $session->completed_at?->toDateTimeString(),
            'answeredCount' => (int) $session->answered_count,
            'correctCount' => (int) $session->correct_count,
            'totalQuestions' => (int) $session->total_questions,
            'focusSkill' => (string) ($session->skillCategory?->name ?? '-'),
        ];
    }
}
