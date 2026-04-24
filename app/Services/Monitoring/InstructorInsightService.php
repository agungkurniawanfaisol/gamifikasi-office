<?php

namespace App\Services\Monitoring;

use App\Enums\ExamStatus;
use App\Enums\UserRole;
use App\Models\Question;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InstructorInsightService
{
    public const DEFAULT_MIN_ATTEMPTS = 3;

    private const CONFIDENCE_HIGH_MIN_ATTEMPTS = 20;

    private const CONFIDENCE_MEDIUM_MIN_ATTEMPTS = 8;

    /**
     * @param array{from:string,to:string,level_id:int|null,min_attempts:int} $filters
     * @return array{
     *     summary:array<string,mixed>,
     *     hardest_questions:array<int,array<string,mixed>>,
     *     weak_topics:array<int,array<string,mixed>>,
     *     remedial_recommendations:array<int,array<string,mixed>>,
     *     metrics:array<string,mixed>
     * }
     */
    public function buildInsights(array $filters, User $actor): array
    {
        $rows = $this->loadAnswerRows($filters, $actor);

        return [
            'summary' => $this->buildSummary($rows, $filters),
            'hardest_questions' => $this->buildHardestQuestions($rows, $filters['min_attempts']),
            'weak_topics' => $this->buildWeakTopics($rows, $filters, $actor),
            'remedial_recommendations' => $this->buildRemedialRecommendations($rows, $filters, $actor),
            'metrics' => $this->buildMetricsDefinition(),
        ];
    }

    /**
     * @param array{from:string,to:string,level_id:int|null,min_attempts:int} $filters
     * @return Collection<int,array<string,mixed>>
     */
    private function loadAnswerRows(array $filters, User $actor): Collection
    {
        $examRows = $this->loadExamRows($filters, $actor);
        $dailyRows = $this->loadDailyRows($filters, $actor);

        return $examRows->merge($dailyRows)->values();
    }

    /**
     * @param array{from:string,to:string,level_id:int|null,min_attempts:int} $filters
     * @return Collection<int,array<string,mixed>>
     */
    private function loadExamRows(array $filters, User $actor): Collection
    {
        $query = DB::table('exam_answers as ea')
            ->join('exam_sessions as es', 'es.id', '=', 'ea.exam_session_id')
            ->join('questions as q', 'q.id', '=', 'ea.question_id')
            ->join('skill_categories as sc', 'sc.id', '=', 'q.skill_category_id')
            ->whereIn('es.status', [ExamStatus::Completed->value, ExamStatus::TimedOut->value])
            ->whereNotNull('es.completed_at')
            ->whereBetween('es.completed_at', [
                CarbonImmutable::parse($filters['from'])->startOfDay(),
                CarbonImmutable::parse($filters['to'])->endOfDay(),
            ])
            ->when(
                $filters['level_id'] !== null,
                fn ($builder) => $builder->where('q.level_id', $filters['level_id']),
            )
            ->when(
                $actor->role === UserRole::Lecturer,
                fn ($builder) => $builder->where('q.created_by', $actor->id),
            )
            ->select([
                DB::raw("'exam' as source"),
                'q.id as question_id',
                'q.question_text',
                'q.level_id',
                'sc.id as skill_category_id',
                'sc.name as skill_category_name',
                'ea.is_correct',
                'ea.time_spent_seconds',
                'es.completed_at as answered_at',
            ]);

        return $query->get()->map(function (object $row): array {
            return [
                'source' => (string) $row->source,
                'question_id' => (int) $row->question_id,
                'question_text' => (string) $row->question_text,
                'level_id' => (int) $row->level_id,
                'skill_category_id' => (int) $row->skill_category_id,
                'skill_category_name' => (string) $row->skill_category_name,
                'is_correct' => (bool) $row->is_correct,
                'time_spent_seconds' => $row->time_spent_seconds !== null ? (int) $row->time_spent_seconds : null,
                'answered_at' => (string) $row->answered_at,
            ];
        })->values();
    }

    /**
     * @param array{from:string,to:string,level_id:int|null,min_attempts:int} $filters
     * @return Collection<int,array<string,mixed>>
     */
    private function loadDailyRows(array $filters, User $actor): Collection
    {
        $query = DB::table('daily_activity_answers as daa')
            ->join('daily_activity_logs as dal', 'dal.id', '=', 'daa.daily_activity_log_id')
            ->join('questions as q', 'q.id', '=', 'daa.question_id')
            ->join('skill_categories as sc', 'sc.id', '=', 'q.skill_category_id')
            ->whereBetween('dal.activity_date', [$filters['from'], $filters['to']])
            ->when(
                $filters['level_id'] !== null,
                fn ($builder) => $builder->where('q.level_id', $filters['level_id']),
            )
            ->when(
                $actor->role === UserRole::Lecturer,
                fn ($builder) => $builder->where('q.created_by', $actor->id),
            )
            ->select([
                DB::raw("'daily' as source"),
                'q.id as question_id',
                'q.question_text',
                'q.level_id',
                'sc.id as skill_category_id',
                'sc.name as skill_category_name',
                'daa.is_correct',
                DB::raw('NULL as time_spent_seconds'),
                'daa.answered_at',
            ]);

        return $query->get()->map(function (object $row): array {
            return [
                'source' => (string) $row->source,
                'question_id' => (int) $row->question_id,
                'question_text' => (string) $row->question_text,
                'level_id' => (int) $row->level_id,
                'skill_category_id' => (int) $row->skill_category_id,
                'skill_category_name' => (string) $row->skill_category_name,
                'is_correct' => (bool) $row->is_correct,
                'time_spent_seconds' => null,
                'answered_at' => $row->answered_at !== null ? (string) $row->answered_at : null,
            ];
        })->values();
    }

    /**
     * @param Collection<int,array<string,mixed>> $rows
     * @param array{from:string,to:string,level_id:int|null,min_attempts:int} $filters
     * @return array<string,mixed>
     */
    private function buildSummary(Collection $rows, array $filters): array
    {
        $questionCount = $rows->pluck('question_id')->unique()->count();
        $attemptCount = $rows->count();
        $wrongCount = $rows->where('is_correct', false)->count();
        $accuracy = $attemptCount > 0
            ? round((($attemptCount - $wrongCount) / $attemptCount) * 100, 1)
            : 0.0;

        return [
            'date_range' => [
                'from' => $filters['from'],
                'to' => $filters['to'],
            ],
            'total_questions_analyzed' => $questionCount,
            'total_attempts_analyzed' => $attemptCount,
            'average_accuracy' => $accuracy,
            'minimum_sample_threshold' => $filters['min_attempts'],
        ];
    }

    /**
     * @param Collection<int,array<string,mixed>> $rows
     * @return array<int,array<string,mixed>>
     */
    private function buildHardestQuestions(Collection $rows, int $minAttempts): array
    {
        return $rows
            ->groupBy('question_id')
            ->map(function (Collection $group): array {
                $attemptCount = $group->count();
                $correctCount = $group->where('is_correct', true)->count();
                $wrongCount = $attemptCount - $correctCount;
                $correctRate = $attemptCount > 0 ? $correctCount / $attemptCount : 0.0;
                $difficultyScore = (1 - $correctRate) * log(1 + $attemptCount);
                $timeValues = $group->pluck('time_spent_seconds')
                    ->filter(static fn ($time): bool => $time !== null)
                    ->map(static fn ($time): int => (int) $time)
                    ->sort()
                    ->values();

                return [
                    'question_id' => (int) $group->first()['question_id'],
                    'question_text' => (string) $group->first()['question_text'],
                    'skill_category_id' => (int) $group->first()['skill_category_id'],
                    'skill_category_name' => (string) $group->first()['skill_category_name'],
                    'attempt_count' => $attemptCount,
                    'correct_count' => $correctCount,
                    'wrong_count' => $wrongCount,
                    'correct_rate' => round($correctRate * 100, 1),
                    'wrong_rate' => round((1 - $correctRate) * 100, 1),
                    'median_time_spent_seconds' => $this->median($timeValues),
                    'difficulty_score' => round($difficultyScore, 4),
                    'confidence' => $this->confidenceLabel($attemptCount),
                ];
            })
            ->filter(static fn (array $row): bool => $row['attempt_count'] >= $minAttempts)
            ->sortByDesc('difficulty_score')
            ->take(12)
            ->values()
            ->all();
    }

    /**
     * @param Collection<int,array<string,mixed>> $rows
     * @param array{from:string,to:string,level_id:int|null,min_attempts:int} $filters
     * @return array<int,array<string,mixed>>
     */
    private function buildWeakTopics(Collection $rows, array $filters, User $actor): array
    {
        $current = $rows
            ->groupBy('skill_category_id')
            ->map(function (Collection $group): array {
                $attemptCount = $group->count();
                $correctCount = $group->where('is_correct', true)->count();
                $wrongCount = $attemptCount - $correctCount;
                $accuracy = $attemptCount > 0 ? ($correctCount / $attemptCount) * 100 : 0;
                $wrongRate = $attemptCount > 0 ? ($wrongCount / $attemptCount) * 100 : 0;

                return [
                    'skill_category_id' => (int) $group->first()['skill_category_id'],
                    'skill_category_name' => (string) $group->first()['skill_category_name'],
                    'attempt_count' => $attemptCount,
                    'wrong_count' => $wrongCount,
                    'accuracy' => round($accuracy, 1),
                    'wrong_rate' => round($wrongRate, 1),
                    'confidence' => $this->confidenceLabel($attemptCount),
                ];
            });

        $previousRows = $this->loadAnswerRows($this->previousPeriodFilters($filters), $actor);
        $previousWrongRates = $previousRows
            ->groupBy('skill_category_id')
            ->map(function (Collection $group): float {
                $attemptCount = $group->count();
                if ($attemptCount === 0) {
                    return 0;
                }

                $wrongCount = $group->where('is_correct', false)->count();

                return ($wrongCount / $attemptCount) * 100;
            });

        return $current
            ->map(function (array $topic) use ($previousWrongRates): array {
                $previous = (float) ($previousWrongRates->get($topic['skill_category_id']) ?? 0);
                $delta = $topic['wrong_rate'] - $previous;

                return [
                    ...$topic,
                    'trend_vs_previous_period' => round($delta, 1),
                ];
            })
            ->filter(fn (array $topic): bool => $topic['attempt_count'] >= $filters['min_attempts'])
            ->sortByDesc('wrong_count')
            ->take(10)
            ->values()
            ->all();
    }

    /**
     * @param Collection<int,array<string,mixed>> $rows
     * @param array{from:string,to:string,level_id:int|null,min_attempts:int} $filters
     * @return array<int,array<string,mixed>>
     */
    private function buildRemedialRecommendations(Collection $rows, array $filters, User $actor): array
    {
        $weakTopics = collect($this->buildWeakTopics($rows, $filters, $actor))
            ->sortByDesc('wrong_rate')
            ->take(3)
            ->values();

        if ($weakTopics->isEmpty()) {
            return [];
        }

        return $weakTopics->map(function (array $topic) use ($rows, $filters, $actor): array {
            $questionStats = $rows
                ->where('skill_category_id', $topic['skill_category_id'])
                ->groupBy('question_id')
                ->map(function (Collection $group): array {
                    $attemptCount = $group->count();
                    $correctCount = $group->where('is_correct', true)->count();
                    $wrongCount = $attemptCount - $correctCount;

                    return [
                        'question_id' => (int) $group->first()['question_id'],
                        'question_text' => (string) $group->first()['question_text'],
                        'attempt_count' => $attemptCount,
                        'accuracy' => $attemptCount > 0 ? round(($correctCount / $attemptCount) * 100, 1) : 0.0,
                        'wrong_count' => $wrongCount,
                    ];
                })
                ->filter(fn (array $row): bool => $row['attempt_count'] >= $filters['min_attempts'])
                ->sortBy('accuracy')
                ->take(5)
                ->values();

            $activeQuestionsCount = Question::query()
                ->where('skill_category_id', $topic['skill_category_id'])
                ->where('is_active', true)
                ->when(
                    $filters['level_id'] !== null,
                    fn ($query) => $query->where('level_id', $filters['level_id']),
                )
                ->when(
                    $actor->role === UserRole::Lecturer,
                    fn ($query) => $query->where('created_by', $actor->id),
                )
                ->count();

            return [
                'skill_category_id' => $topic['skill_category_id'],
                'skill_category_name' => $topic['skill_category_name'],
                'reason_tag' => $topic['wrong_rate'] >= 60 ? 'high_wrong_rate' : 'low_accuracy',
                'active_question_pool' => $activeQuestionsCount,
                'suggested_questions' => $questionStats->all(),
                'cta' => [
                    'label' => 'Create Remedial Package',
                    'url' => route('admin.exam-headers.create', [
                        'level_id' => $filters['level_id'],
                        'search' => $topic['skill_category_name'],
                    ]),
                ],
            ];
        })->all();
    }

    /**
     * @return array<string,mixed>
     */
    private function buildMetricsDefinition(): array
    {
        return [
            'difficulty_formula' => '(1 - correct_rate) * log1p(attempt_count)',
            'min_attempts_default' => self::DEFAULT_MIN_ATTEMPTS,
            'confidence_thresholds' => [
                'high' => self::CONFIDENCE_HIGH_MIN_ATTEMPTS,
                'medium' => self::CONFIDENCE_MEDIUM_MIN_ATTEMPTS,
                'low' => 1,
            ],
        ];
    }

    /**
     * @param Collection<int,int> $values
     */
    private function median(Collection $values): ?int
    {
        if ($values->isEmpty()) {
            return null;
        }

        $count = $values->count();
        $middle = (int) floor(($count - 1) / 2);

        if ($count % 2 === 1) {
            return (int) $values[$middle];
        }

        return (int) round(((int) $values[$middle] + (int) $values[$middle + 1]) / 2);
    }

    private function confidenceLabel(int $attemptCount): string
    {
        if ($attemptCount >= self::CONFIDENCE_HIGH_MIN_ATTEMPTS) {
            return 'high';
        }

        if ($attemptCount >= self::CONFIDENCE_MEDIUM_MIN_ATTEMPTS) {
            return 'medium';
        }

        return 'low';
    }

    /**
     * @param array{from:string,to:string,level_id:int|null,min_attempts:int} $filters
     * @return array{from:string,to:string,level_id:int|null,min_attempts:int}
     */
    private function previousPeriodFilters(array $filters): array
    {
        $from = CarbonImmutable::parse($filters['from'])->startOfDay();
        $to = CarbonImmutable::parse($filters['to'])->endOfDay();
        $days = max(1, $from->diffInDays($to) + 1);
        $previousTo = $from->subDay()->endOfDay();
        $previousFrom = $previousTo->subDays($days - 1)->startOfDay();

        return [
            ...$filters,
            'from' => $previousFrom->toDateString(),
            'to' => $previousTo->toDateString(),
        ];
    }
}

