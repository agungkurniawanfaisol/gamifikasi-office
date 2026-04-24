<?php

namespace App\Services\Monitoring;

use App\Enums\ExamStatus;
use App\Models\DailyActivityAnswer;
use App\Models\DailyActivityLog;
use App\Models\ExamAnswer;
use App\Models\ExamSession;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator as PaginationLengthAwarePaginator;
use Illuminate\Support\Collection;

class StudentLearningHistoryService
{
    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     */
    public function attemptList(int $studentId, array $filters): LengthAwarePaginator
    {
        $examAttempts = $this->loadExamAttempts($studentId, $filters);
        $dailyAttempts = $this->loadDailyAttempts($studentId, $filters);

        $rows = $examAttempts
            ->when($filters['source'] !== 'exam', fn (Collection $items) => $items->merge($dailyAttempts))
            ->when($filters['source'] === 'daily', fn () => $dailyAttempts)
            ->sortByDesc('attempt_time')
            ->values();

        return $this->paginateCollection($rows, $filters['page'], $filters['per_page']);
    }

    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     * @return Collection<int, array<string, mixed>>
     */
    public function detailRows(int $studentId, array $filters): Collection
    {
        $selectedSource = $filters['attempt_source'];
        $selectedId = $filters['attempt_id'];

        $examRows = ($filters['source'] === 'daily' || $selectedSource === 'daily')
            ? collect()
            : $this->loadExamDetails($studentId, $filters, $selectedSource, $selectedId);

        $dailyRows = ($filters['source'] === 'exam' || $selectedSource === 'exam')
            ? collect()
            : $this->loadDailyDetails($studentId, $filters, $selectedSource, $selectedId);

        return $examRows
            ->merge($dailyRows)
            ->sortByDesc('answered_at')
            ->values();
    }

    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     * @return Collection<int, array<string, mixed>>
     */
    public function exportRows(int $studentId, array $filters): Collection
    {
        $examRows = $filters['source'] === 'daily'
            ? collect()
            : $this->loadExamDetails($studentId, $filters, null, null);

        $dailyRows = $filters['source'] === 'exam'
            ? collect()
            : $this->loadDailyDetails($studentId, $filters, null, null);

        return $examRows
            ->merge($dailyRows)
            ->sortByDesc('answered_at')
            ->values();
    }

    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     * @return array<string, int|float>
     */
    public function summaryCards(int $studentId, array $filters): array
    {
        $examAttempts = $this->loadExamAttempts($studentId, $filters);
        $dailyAttempts = $this->loadDailyAttempts($studentId, $filters);

        $attempts = $examAttempts
            ->when($filters['source'] !== 'exam', fn (Collection $items) => $items->merge($dailyAttempts))
            ->when($filters['source'] === 'daily', fn () => $dailyAttempts)
            ->values();

        $totalAttempts = $attempts->count();
        $totalAnswered = $attempts->sum('answered_count');
        $totalCorrect = $attempts->sum('correct_count');
        $totalWrong = max(0, $totalAnswered - $totalCorrect);
        $averageAccuracy = $totalAnswered > 0
            ? round(($totalCorrect / $totalAnswered) * 100, 1)
            : 0.0;

        return [
            'total_attempts' => $totalAttempts,
            'total_answered' => $totalAnswered,
            'total_correct' => $totalCorrect,
            'total_wrong' => $totalWrong,
            'average_accuracy' => $averageAccuracy,
        ];
    }

    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     * @return array<string, array<string, int|float|string>>
     */
    public function targetSummary(int $studentId, array $filters): array
    {
        $today = CarbonImmutable::today()->toDateString();

        $todayLog = DailyActivityLog::query()
            ->select(['id', 'answered_count', 'correct_count', 'streak_after_day'])
            ->where('user_id', $studentId)
            ->whereDate('activity_date', $today)
            ->first();

        $minDaily = 2;
        $maxDaily = 5;
        $answeredToday = (int) ($todayLog?->answered_count ?? 0);
        $dailyStatus = $answeredToday >= $minDaily
            ? 'completed'
            : ($answeredToday > 0 ? 'on_track' : 'behind');

        $latestStreak = (int) DailyActivityLog::query()
            ->where('user_id', $studentId)
            ->latest('activity_date')
            ->value('streak_after_day');
        $streakTarget = 7;
        $streakStatus = $latestStreak >= $streakTarget
            ? 'completed'
            : ($latestStreak > 0 ? 'on_track' : 'behind');

        $summary = $this->summaryCards($studentId, $filters);
        $accuracyTarget = 80.0;
        $accuracyCurrent = (float) $summary['average_accuracy'];
        $accuracyStatus = $accuracyCurrent >= $accuracyTarget
            ? 'completed'
            : ($accuracyCurrent >= 60.0 ? 'on_track' : 'behind');
        $risk = $this->riskIndicator($studentId);
        $recommendation = $this->buildRiskRecommendation($studentId, $risk['status']);

        return [
            'daily' => [
                'min_required' => $minDaily,
                'max_allowed' => $maxDaily,
                'answered_today' => $answeredToday,
                'remaining_to_minimum' => max(0, $minDaily - $answeredToday),
                'status' => $dailyStatus,
            ],
            'streak' => [
                'target_days' => $streakTarget,
                'current_days' => $latestStreak,
                'progress_percent' => min(100, (int) round(($latestStreak / $streakTarget) * 100)),
                'status' => $streakStatus,
            ],
            'accuracy' => [
                'target_percent' => $accuracyTarget,
                'current_percent' => $accuracyCurrent,
                'status' => $accuracyStatus,
            ],
            'risk' => $risk,
            'recommendation' => $recommendation,
        ];
    }

    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function loadExamAttempts(int $studentId, array $filters): Collection
    {
        if ($filters['source'] === 'daily') {
            return collect();
        }

        $sessions = ExamSession::query()
            ->select(['id', 'completed_at'])
            ->where('user_id', $studentId)
            ->whereIn('status', [ExamStatus::Completed, ExamStatus::TimedOut])
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [
                CarbonImmutable::parse($filters['from'])->startOfDay(),
                CarbonImmutable::parse($filters['to'])->endOfDay(),
            ])
            ->when(
                $filters['search'],
                function (Builder $query, ?string $search): void {
                    $term = trim((string) $search);
                    if ($term === '') {
                        return;
                    }

                    $query->whereHas('answers.question', function (Builder $questionQuery) use ($term): void {
                        $questionQuery->where('question_text', 'like', "%{$term}%");
                    });
                },
            )
            ->withCount([
                'answers as answered_count',
                'answers as correct_count' => fn (Builder $query) => $query->where('is_correct', true),
            ])
            ->get();

        return $sessions->toBase()->map(function (ExamSession $session): array {
            $answeredCount = (int) $session->answered_count;
            $correctCount = (int) $session->correct_count;

            return [
                'source' => 'exam',
                'attempt_id' => $session->id,
                'attempt_label' => 'Exam Session #'.$session->id,
                'attempt_date' => $session->completed_at?->toDateString(),
                'attempt_time' => $session->completed_at?->toDateTimeString(),
                'answered_count' => $answeredCount,
                'correct_count' => $correctCount,
                'accuracy' => $answeredCount > 0
                    ? round(($correctCount / $answeredCount) * 100, 1)
                    : 0.0,
            ];
        })->values();
    }

    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function loadDailyAttempts(int $studentId, array $filters): Collection
    {
        if ($filters['source'] === 'exam') {
            return collect();
        }

        $logs = DailyActivityLog::query()
            ->select(['id', 'activity_date', 'completed_at', 'answered_count', 'correct_count'])
            ->where('user_id', $studentId)
            ->whereBetween('activity_date', [$filters['from'], $filters['to']])
            ->where('answered_count', '>', 0)
            ->when(
                $filters['search'],
                function (Builder $query, ?string $search): void {
                    $term = trim((string) $search);
                    if ($term === '') {
                        return;
                    }

                    $query->whereHas('answers.question', function (Builder $questionQuery) use ($term): void {
                        $questionQuery->where('question_text', 'like', "%{$term}%");
                    });
                },
            )
            ->get();

        return $logs->toBase()->map(function (DailyActivityLog $log): array {
            $answeredCount = (int) $log->answered_count;
            $correctCount = (int) $log->correct_count;

            return [
                'source' => 'daily',
                'attempt_id' => $log->id,
                'attempt_label' => 'Daily Activity '.$log->activity_date?->format('Y-m-d'),
                'attempt_date' => $log->activity_date?->toDateString(),
                'attempt_time' => $log->completed_at?->toDateTimeString(),
                'answered_count' => $answeredCount,
                'correct_count' => $correctCount,
                'accuracy' => $answeredCount > 0
                    ? round(($correctCount / $answeredCount) * 100, 1)
                    : 0.0,
            ];
        })->values();
    }

    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function loadExamDetails(
        int $studentId,
        array $filters,
        ?string $selectedSource,
        ?int $selectedId,
    ): Collection {
        $answers = ExamAnswer::query()
            ->whereHas('examSession', function (Builder $query) use ($studentId, $filters, $selectedSource, $selectedId): void {
                $query->where('user_id', $studentId)
                    ->whereIn('status', [ExamStatus::Completed, ExamStatus::TimedOut])
                    ->whereNotNull('completed_at')
                    ->whereBetween('completed_at', [
                        CarbonImmutable::parse($filters['from'])->startOfDay(),
                        CarbonImmutable::parse($filters['to'])->endOfDay(),
                    ])
                    ->when(
                        $selectedSource === 'exam' && $selectedId !== null,
                        fn (Builder $selectedQuery) => $selectedQuery->where('id', $selectedId),
                    );
            })
            ->when(
                $filters['search'],
                function (Builder $query, ?string $search): void {
                    $term = trim((string) $search);
                    if ($term === '') {
                        return;
                    }

                    $query->whereHas('question', function (Builder $questionQuery) use ($term): void {
                        $questionQuery->where('question_text', 'like', "%{$term}%");
                    });
                },
            )
            ->with([
                'question:id,question_text',
                'question.options:id,question_id,option_text,is_correct',
                'selectedOption:id,option_text',
            ])
            ->orderByDesc('answered_at')
            ->get();

        return $answers->toBase()->map(function (ExamAnswer $answer): array {
            $correctOption = $answer->question
                ? $answer->question->options->firstWhere('is_correct', true)
                : null;

            return [
                'source' => 'exam',
                'attempt_id' => $answer->exam_session_id,
                'attempt_label' => 'Exam Session #'.$answer->exam_session_id,
                'question' => $answer->question?->question_text,
                'selected_option' => $answer->selectedOption?->option_text,
                'correct_option' => $correctOption?->option_text,
                'is_correct' => (bool) $answer->is_correct,
                'answered_at' => $answer->answered_at?->toDateTimeString(),
            ];
        })->values();
    }

    /**
     * @param array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * } $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function loadDailyDetails(
        int $studentId,
        array $filters,
        ?string $selectedSource,
        ?int $selectedId,
    ): Collection {
        $answers = DailyActivityAnswer::query()
            ->whereHas('log', function (Builder $query) use ($studentId, $filters, $selectedSource, $selectedId): void {
                $query->where('user_id', $studentId)
                    ->whereBetween('activity_date', [$filters['from'], $filters['to']])
                    ->when(
                        $selectedSource === 'daily' && $selectedId !== null,
                        fn (Builder $selectedQuery) => $selectedQuery->where('id', $selectedId),
                    );
            })
            ->when(
                $filters['search'],
                function (Builder $query, ?string $search): void {
                    $term = trim((string) $search);
                    if ($term === '') {
                        return;
                    }

                    $query->whereHas('question', function (Builder $questionQuery) use ($term): void {
                        $questionQuery->where('question_text', 'like', "%{$term}%");
                    });
                },
            )
            ->with([
                'log:id,activity_date',
                'question:id,question_text',
                'question.options:id,question_id,option_text,is_correct',
                'selectedOption:id,option_text',
            ])
            ->orderByDesc('answered_at')
            ->get();

        return $answers->toBase()->map(function (DailyActivityAnswer $answer): array {
            $correctOption = $answer->question
                ? $answer->question->options->firstWhere('is_correct', true)
                : null;

            return [
                'source' => 'daily',
                'attempt_id' => $answer->daily_activity_log_id,
                'attempt_label' => 'Daily Activity '.$answer->log?->activity_date?->format('Y-m-d'),
                'question' => $answer->question?->question_text,
                'selected_option' => $answer->selectedOption?->option_text,
                'correct_option' => $correctOption?->option_text,
                'is_correct' => (bool) $answer->is_correct,
                'answered_at' => $answer->answered_at?->toDateTimeString(),
            ];
        })->values();
    }

    /**
     * @param Collection<int, array<string, mixed>> $rows
     */
    private function paginateCollection(Collection $rows, int $page, int $perPage): LengthAwarePaginator
    {
        $total = $rows->count();
        $items = $rows->forPage($page, $perPage)->values();

        return new PaginationLengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            [
                'path' => url()->current(),
                'query' => request()->query(),
            ],
        );
    }

    /**
     * @return array{threshold_percent:float,lookback_days:int,days_below_threshold:int,status:string,message:string}
     */
    private function riskIndicator(int $studentId): array
    {
        $lookbackDays = 3;
        $threshold = 50.0;
        $end = CarbonImmutable::today();
        $start = $end->subDays($lookbackDays - 1);

        $dailyRows = DailyActivityLog::query()
            ->select(['activity_date', 'answered_count', 'correct_count'])
            ->where('user_id', $studentId)
            ->whereBetween('activity_date', [$start->toDateString(), $end->toDateString()])
            ->get();

        $examRows = ExamSession::query()
            ->select(['completed_at'])
            ->where('user_id', $studentId)
            ->whereIn('status', [ExamStatus::Completed, ExamStatus::TimedOut])
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$start->startOfDay(), $end->endOfDay()])
            ->withCount([
                'answers as answered_count',
                'answers as correct_count' => fn (Builder $query) => $query->where('is_correct', true),
            ])
            ->get();

        $perDay = collect();
        foreach ($dailyRows as $row) {
            $date = $row->activity_date?->toDateString();
            if ($date === null) {
                continue;
            }

            $current = $perDay->get($date, ['answered' => 0, 'correct' => 0]);
            $current['answered'] += (int) $row->answered_count;
            $current['correct'] += (int) $row->correct_count;
            $perDay->put($date, $current);
        }

        foreach ($examRows as $row) {
            $date = $row->completed_at?->toDateString();
            if ($date === null) {
                continue;
            }

            $current = $perDay->get($date, ['answered' => 0, 'correct' => 0]);
            $current['answered'] += (int) $row->answered_count;
            $current['correct'] += (int) $row->correct_count;
            $perDay->put($date, $current);
        }

        $daysBelowThreshold = 0;
        for ($offset = 0; $offset < $lookbackDays; $offset++) {
            $date = $end->subDays($offset)->toDateString();
            $row = $perDay->get($date, ['answered' => 0, 'correct' => 0]);
            if ((int) $row['answered'] === 0) {
                continue;
            }

            $accuracy = ((int) $row['correct'] / max(1, (int) $row['answered'])) * 100;
            if ($accuracy < $threshold) {
                $daysBelowThreshold++;
            }
        }

        $status = 'safe';
        $message = 'Akurasi masih aman, pertahankan konsistensi belajar.';

        if ($daysBelowThreshold >= 3) {
            $status = 'high_risk';
            $message = 'Risiko tinggi: akurasi di bawah 50% selama 3 hari terakhir.';
        } elseif ($daysBelowThreshold >= 2) {
            $status = 'medium_risk';
            $message = 'Perlu perhatian: akurasi di bawah 50% selama 2 hari terakhir.';
        } elseif ($daysBelowThreshold >= 1) {
            $status = 'low_risk';
            $message = 'Waspada: ada penurunan akurasi di bawah 50% dalam 3 hari terakhir.';
        }

        return [
            'threshold_percent' => $threshold,
            'lookback_days' => $lookbackDays,
            'days_below_threshold' => $daysBelowThreshold,
            'status' => $status,
            'message' => $message,
        ];
    }

    /**
     * @return array{
     *     priority:string,
     *     headline:string,
     *     actions:array<int,string>,
     *     focus_source:string,
     *     weak_skills:array<int,string>
     * }
     */
    private function buildRiskRecommendation(int $studentId, string $riskStatus): array
    {
        $end = CarbonImmutable::today();
        $start = $end->subDays(6)->startOfDay();

        $examAnswers = ExamAnswer::query()
            ->whereHas('examSession', function (Builder $query) use ($studentId, $start, $end): void {
                $query->where('user_id', $studentId)
                    ->whereIn('status', [ExamStatus::Completed, ExamStatus::TimedOut])
                    ->whereBetween('completed_at', [$start, $end->endOfDay()]);
            })
            ->with(['question:id,skill_category_id', 'question.skillCategory:id,name'])
            ->get();

        $dailyAnswers = DailyActivityAnswer::query()
            ->whereHas('log', function (Builder $query) use ($studentId, $start, $end): void {
                $query->where('user_id', $studentId)
                    ->whereBetween('activity_date', [$start->toDateString(), $end->toDateString()]);
            })
            ->with(['question:id,skill_category_id', 'question.skillCategory:id,name'])
            ->get();

        $examAccuracy = $this->accuracyPercent($examAnswers);
        $dailyAccuracy = $this->accuracyPercent($dailyAnswers);
        $examAnsweredCount = $examAnswers->count();
        $dailyAnsweredCount = $dailyAnswers->count();

        $focusSource = 'balanced';
        if ($examAnsweredCount === 0 && $dailyAnsweredCount > 0) {
            $focusSource = 'daily';
        } elseif ($dailyAnsweredCount === 0 && $examAnsweredCount > 0) {
            $focusSource = 'exam';
        } elseif ($examAccuracy < $dailyAccuracy - 5) {
            $focusSource = 'exam';
        } elseif ($dailyAccuracy < $examAccuracy - 5) {
            $focusSource = 'daily';
        }

        $weakSkills = collect()
            ->merge($this->skillWrongCounts($examAnswers))
            ->merge($this->skillWrongCounts($dailyAnswers))
            ->groupBy('skill')
            ->map(fn (Collection $rows) => $rows->sum('wrong_count'))
            ->sortDesc()
            ->keys()
            ->take(2)
            ->values()
            ->all();

        $priority = 'low';
        $headline = 'Progress stabil, lanjutkan ritme belajar saat ini.';
        if ($riskStatus === 'high_risk') {
            $priority = 'high';
            $headline = 'Prioritas tinggi: perlu pemulihan akurasi dalam 3 hari ke depan.';
        } elseif ($riskStatus === 'medium_risk') {
            $priority = 'medium';
            $headline = 'Prioritas menengah: perkuat konsistensi agar akurasi kembali aman.';
        } elseif ($riskStatus === 'low_risk') {
            $priority = 'medium';
            $headline = 'Perlu perhatian: ada sinyal penurunan performa.';
        }

        $actions = collect();
        if ($focusSource === 'exam') {
            $actions->push('Fokus latihan ulang di modul exam, utamakan pembahasan jawaban salah.');
        } elseif ($focusSource === 'daily') {
            $actions->push('Fokus daily activity lebih konsisten sampai akurasi harian membaik.');
        } else {
            $actions->push('Pertahankan porsi belajar seimbang antara exam dan daily activity.');
        }

        if (count($weakSkills) > 0) {
            $actions->push('Ulang topik prioritas: '.implode(', ', $weakSkills).'.');
        } else {
            $actions->push('Belum ada topik dominan yang lemah, lanjutkan evaluasi per soal.');
        }

        if ($riskStatus === 'high_risk') {
            $actions->push('Kerjakan minimal 2 sesi latihan terfokus per hari selama 3 hari berturut.');
        } elseif ($riskStatus === 'medium_risk' || $riskStatus === 'low_risk') {
            $actions->push('Jaga target harian minimal 2 soal dengan review kunci jawaban setiap selesai.');
        } else {
            $actions->push('Naikkan target akurasi pribadi di atas 85% untuk mempercepat progres.');
        }

        return [
            'priority' => $priority,
            'headline' => $headline,
            'actions' => $actions->values()->all(),
            'focus_source' => $focusSource,
            'weak_skills' => $weakSkills,
        ];
    }

    /**
     * @param Collection<int, ExamAnswer|DailyActivityAnswer> $answers
     */
    private function accuracyPercent(Collection $answers): float
    {
        $answered = $answers->count();
        if ($answered === 0) {
            return 0.0;
        }

        $correct = $answers->where('is_correct', true)->count();

        return round(($correct / $answered) * 100, 1);
    }

    /**
     * @param Collection<int, ExamAnswer|DailyActivityAnswer> $answers
     * @return Collection<int, array{skill:string,wrong_count:int}>
     */
    private function skillWrongCounts(Collection $answers): Collection
    {
        return $answers
            ->filter(fn ($answer): bool => ! (bool) $answer->is_correct)
            ->map(function ($answer): array {
                $skillName = $answer->question?->skillCategory?->name ?? 'Tanpa Kategori';

                return [
                    'skill' => $skillName,
                    'wrong_count' => 1,
                ];
            })
            ->values();
    }
}
