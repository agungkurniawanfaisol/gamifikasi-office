<?php

namespace App\Services\DailyActivity;

use App\Models\DailyActivityAnswer;
use App\Models\DailyActivityLog;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DailyActivityService
{
    public const MIN_DAILY_ANSWERED = 2;

    public const MAX_DAILY_QUESTIONS = 5;

    public function __construct(
        private readonly WeeklyRewardService $weeklyRewardService,
    ) {}

    public function getOrCreateTodayLog(int $userId): DailyActivityLog
    {
        $today = now()->toDateString();

        $log = DailyActivityLog::query()
            ->forUser($userId)
            ->forDate($today)
            ->with('answers')
            ->first();

        if ($log !== null) {
            return $log;
        }

        $questionIds = $this->pickQuestionIds();

        return DailyActivityLog::query()->create([
            'user_id' => $userId,
            'activity_date' => $today,
            'question_ids' => $questionIds,
        ]);
    }

    public function loadQuestions(DailyActivityLog $log): Collection
    {
        $questionIds = collect($log->question_ids)
            ->map(fn ($id) => (int) $id)
            ->values();

        $questions = Question::query()
            ->select(['id', 'question_text', 'type', 'narrative_text'])
            ->whereIn('id', $questionIds->all())
            ->with([
                'options' => function ($query): void {
                    $query->select(['id', 'question_id', 'option_text', 'order', 'is_correct'])->orderBy('order');
                },
            ])
            ->get()
            ->keyBy('id');

        return $questionIds
            ->map(fn (int $id) => $questions->get($id))
            ->filter()
            ->values();
    }

    public function submitAnswer(
        int $userId,
        int $questionId,
        int $selectedOptionId,
    ): DailyActivityLog {
        return DB::transaction(function () use ($userId, $questionId, $selectedOptionId): DailyActivityLog {
            $log = $this->getOrCreateTodayLog($userId);
            $log->load('answers');

            if ($log->is_completed) {
                throw ValidationException::withMessages([
                    'daily_activity' => 'Daily activity hari ini sudah diselesaikan.',
                ]);
            }

            $questionIds = collect($log->question_ids)->map(fn ($id) => (int) $id);
            if (! $questionIds->contains($questionId)) {
                throw ValidationException::withMessages([
                    'question_id' => 'Soal ini tidak termasuk daily activity hari ini.',
                ]);
            }

            $selectedOption = QuestionOption::query()
                ->where('id', $selectedOptionId)
                ->where('question_id', $questionId)
                ->first();

            if ($selectedOption === null) {
                throw ValidationException::withMessages([
                    'selected_option_id' => 'Pilihan jawaban tidak valid.',
                ]);
            }

            $existingAnswer = DailyActivityAnswer::query()
                ->where('daily_activity_log_id', $log->id)
                ->where('question_id', $questionId)
                ->first();

            if ($existingAnswer === null && (int) $log->answered_count >= self::MAX_DAILY_QUESTIONS) {
                throw ValidationException::withMessages([
                    'daily_activity' => 'Maksimal 5 soal per hari sudah tercapai.',
                ]);
            }

            DailyActivityAnswer::query()->updateOrCreate(
                [
                    'daily_activity_log_id' => $log->id,
                    'question_id' => $questionId,
                ],
                [
                    'selected_option_id' => $selectedOption->id,
                    'is_correct' => (bool) $selectedOption->is_correct,
                    'answered_at' => now(),
                ],
            );

            $answeredCount = DailyActivityAnswer::query()
                ->where('daily_activity_log_id', $log->id)
                ->count();
            $correctCount = DailyActivityAnswer::query()
                ->where('daily_activity_log_id', $log->id)
                ->where('is_correct', true)
                ->count();

            $log->forceFill([
                'answered_count' => $answeredCount,
                'correct_count' => $correctCount,
            ])->save();

            return $log->fresh(['answers']);
        });
    }

    /**
     * @return array{log: DailyActivityLog, rewardJustGranted: bool}
     */
    public function completeToday(int $userId): array
    {
        return DB::transaction(function () use ($userId): array {
            $log = $this->getOrCreateTodayLog($userId);

            if ($log->is_completed) {
                return [
                    'log' => $log,
                    'rewardJustGranted' => false,
                ];
            }

            $answeredCount = DailyActivityAnswer::query()
                ->where('daily_activity_log_id', $log->id)
                ->count();
            $correctCount = DailyActivityAnswer::query()
                ->where('daily_activity_log_id', $log->id)
                ->where('is_correct', true)
                ->count();

            if ($answeredCount < self::MIN_DAILY_ANSWERED) {
                $log->forceFill([
                    'answered_count' => $answeredCount,
                    'correct_count' => $correctCount,
                    'is_completed' => false,
                    'streak_after_day' => 0,
                    'completed_at' => now(),
                ])->save();

                return [
                    'log' => $log->fresh(),
                    'rewardJustGranted' => false,
                ];
            }

            $newStreak = $this->resolveTodayStreak($userId, Carbon::parse($log->activity_date));

            $rewardGranted = false;
            $rewardGrantedAt = null;

            if ($newStreak % 7 === 0) {
                $rewardGranted = $this->weeklyRewardService->grantWeeklyReward(
                    userId: $userId,
                    activityDate: Carbon::parse($log->activity_date),
                    streak: $newStreak,
                );
                $rewardGrantedAt = $rewardGranted ? now() : null;
            }

            $log->forceFill([
                'answered_count' => $answeredCount,
                'correct_count' => $correctCount,
                'is_completed' => true,
                'streak_after_day' => $newStreak,
                'completed_at' => now(),
                'reward_granted_at' => $rewardGrantedAt,
            ])->save();

            return [
                'log' => $log->fresh(),
                'rewardJustGranted' => $rewardGranted,
            ];
        });
    }

    /**
     * @return array{
     *   activityDate: string,
     *   answeredCount: int,
     *   correctCount: int,
     *   minRequired: int,
     *   maxAllowed: int,
     *   isCompleted: bool,
     *   streakAfterDay: int,
     *   progressPercent: int
     * }
     */
    public function summarizeLog(DailyActivityLog $log): array
    {
        $progressPercent = (int) round(
            min(100, ((int) $log->answered_count / self::MAX_DAILY_QUESTIONS) * 100),
        );

        return [
            'activityDate' => Carbon::parse($log->activity_date)->toDateString(),
            'answeredCount' => (int) $log->answered_count,
            'correctCount' => (int) $log->correct_count,
            'minRequired' => self::MIN_DAILY_ANSWERED,
            'maxAllowed' => self::MAX_DAILY_QUESTIONS,
            'isCompleted' => (bool) $log->is_completed,
            'streakAfterDay' => (int) $log->streak_after_day,
            'progressPercent' => $progressPercent,
        ];
    }

    private function resolveTodayStreak(int $userId, Carbon $activityDate): int
    {
        $yesterday = $activityDate->copy()->subDay()->toDateString();

        $previousLog = DailyActivityLog::query()
            ->forUser($userId)
            ->forDate($yesterday)
            ->first();

        if ($previousLog === null || ! $previousLog->is_completed) {
            return 1;
        }

        return ((int) $previousLog->streak_after_day) + 1;
    }

    /**
     * @return array<int,int>
     */
    private function pickQuestionIds(): array
    {
        $questions = Question::query()
            ->select(['id'])
            ->active()
            ->whereHas('options')
            ->inRandomOrder()
            ->limit(self::MAX_DAILY_QUESTIONS)
            ->get();

        if ($questions->count() < self::MIN_DAILY_ANSWERED) {
            throw ValidationException::withMessages([
                'daily_activity' => 'Soal aktif belum cukup untuk daily activity.',
            ]);
        }

        return $questions->pluck('id')->map(fn ($id) => (int) $id)->values()->all();
    }
}
