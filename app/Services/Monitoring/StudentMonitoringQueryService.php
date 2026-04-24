<?php

namespace App\Services\Monitoring;

use App\Enums\ExamStatus;
use App\Enums\UserRole;
use App\Models\DailyActivityAnswer;
use App\Models\DailyActivityLog;
use App\Models\ExamAnswer;
use App\Models\ExamSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class StudentMonitoringQueryService
{
    /**
     * @param array{from:string,to:string,source:string,search:?string,page:int,per_page:int} $filters
     */
    public function attemptList(array $filters): LengthAwarePaginator
    {
        $examAttempts = $this->loadExamAttempts($filters);
        $dailyAttempts = $this->loadDailyAttempts($filters);

        $rows = $examAttempts
            ->when($filters['source'] !== 'exam', fn (Collection $collection) => $collection->merge($dailyAttempts))
            ->values()
            ->sortByDesc('attempt_date')
            ->values();

        return $this->paginateCollection($rows, $filters['page'], $filters['per_page']);
    }

    /**
     * @param array{from:string,to:string,source:string,search:?string,page:int,per_page:int} $filters
     * @return Collection<int, array<string, mixed>>
     */
    public function detailRows(User $student, array $filters): Collection
    {
        if ($student->role !== UserRole::Student) {
            return collect();
        }

        $examRows = $filters['source'] === 'daily'
            ? collect()
            : $this->loadExamDetails($student, $filters);

        $dailyRows = $filters['source'] === 'exam'
            ? collect()
            : $this->loadDailyDetails($student, $filters);

        return $examRows
            ->merge($dailyRows)
            ->sortByDesc('answered_at')
            ->values();
    }

    /**
     * @param array{from:string,to:string,source:string,search:?string,page:int,per_page:int} $filters
     * @return array<string, mixed>
     */
    public function summaryCards(array $filters): array
    {
        $examAttempts = $this->loadExamAttempts($filters);
        $dailyAttempts = $this->loadDailyAttempts($filters);

        $allAttempts = $examAttempts
            ->when($filters['source'] !== 'exam', fn (Collection $collection) => $collection->merge($dailyAttempts))
            ->when($filters['source'] === 'daily', fn () => $dailyAttempts)
            ->values();

        $studentsActive = $allAttempts->pluck('student_id')->unique()->count();
        $attemptCount = $allAttempts->count();

        $accuracy = $allAttempts->avg(function (array $row): float {
            if (($row['answered_count'] ?? 0) === 0) {
                return 0;
            }

            return (($row['correct_count'] ?? 0) / max(1, $row['answered_count'])) * 100;
        });

        return [
            'students_active' => $studentsActive,
            'attempt_count' => $attemptCount,
            'average_accuracy' => round((float) $accuracy, 1),
            'exam_attempt_count' => $examAttempts->count(),
            'daily_attempt_count' => $dailyAttempts->count(),
        ];
    }

    /**
     * @param array{from:string,to:string,source:string,search:?string,page:int,per_page:int} $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function loadExamAttempts(array $filters): Collection
    {
        if ($filters['source'] === 'daily') {
            return collect();
        }

        $sessions = ExamSession::query()
            ->select(['id', 'user_id', 'completed_at'])
            ->whereIn('status', [ExamStatus::Completed, ExamStatus::TimedOut])
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [
                CarbonImmutable::parse($filters['from'])->startOfDay(),
                CarbonImmutable::parse($filters['to'])->endOfDay(),
            ])
            ->whereHas('user', function (Builder $query) use ($filters): void {
                $query->where('role', UserRole::Student)
                    ->when(
                        $filters['search'],
                        function (Builder $searchQuery, ?string $search): void {
                            $term = trim((string) $search);
                            if ($term === '') {
                                return;
                            }

                            $searchQuery->where(function (Builder $keywordQuery) use ($term): void {
                                $keywordQuery->where('name', 'like', "%{$term}%")
                                    ->orWhere('email', 'like', "%{$term}%");
                            });
                        },
                    );
            })
            ->with('user:id,name,email')
            ->withCount([
                'answers as answered_count',
                'answers as correct_count' => fn (Builder $query) => $query->where('is_correct', true),
            ])
            ->get()
            ->toBase();

        return $sessions->map(function (ExamSession $session): array {
            $answeredCount = (int) $session->answered_count;
            $correctCount = (int) $session->correct_count;

            return [
                'source' => 'exam',
                'attempt_id' => $session->id,
                'student_id' => $session->user_id,
                'student_name' => $session->user?->name,
                'student_email' => $session->user?->email,
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
     * @param array{from:string,to:string,source:string,search:?string,page:int,per_page:int} $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function loadDailyAttempts(array $filters): Collection
    {
        if ($filters['source'] === 'exam') {
            return collect();
        }

        $logs = DailyActivityLog::query()
            ->whereBetween('activity_date', [$filters['from'], $filters['to']])
            ->where('answered_count', '>', 0)
            ->whereHas('user', function (Builder $query) use ($filters): void {
                $query->where('role', UserRole::Student)
                    ->when(
                        $filters['search'],
                        function (Builder $searchQuery, ?string $search): void {
                            $term = trim((string) $search);
                            if ($term === '') {
                                return;
                            }

                            $searchQuery->where(function (Builder $keywordQuery) use ($term): void {
                                $keywordQuery->where('name', 'like', "%{$term}%")
                                    ->orWhere('email', 'like', "%{$term}%");
                            });
                        },
                    );
            })
            ->with('user:id,name,email')
            ->get()
            ->toBase();

        return $logs->map(function (DailyActivityLog $log): array {
            $answeredCount = (int) $log->answered_count;
            $correctCount = (int) $log->correct_count;

            return [
                'source' => 'daily',
                'attempt_id' => $log->id,
                'student_id' => $log->user_id,
                'student_name' => $log->user?->name,
                'student_email' => $log->user?->email,
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
     * @param array{from:string,to:string,source:string,search:?string,page:int,per_page:int} $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function loadExamDetails(User $student, array $filters): Collection
    {
        $answers = ExamAnswer::query()
            ->whereHas('examSession', function (Builder $query) use ($student, $filters): void {
                $query->where('user_id', $student->id)
                    ->whereIn('status', [ExamStatus::Completed, ExamStatus::TimedOut])
                    ->whereNotNull('completed_at')
                    ->whereBetween('completed_at', [
                        CarbonImmutable::parse($filters['from'])->startOfDay(),
                        CarbonImmutable::parse($filters['to'])->endOfDay(),
                    ]);
            })
            ->with([
                'examSession:id,completed_at',
                'question:id,question_text',
                'question.options:id,question_id,option_text,is_correct',
                'selectedOption:id,option_text',
            ])
            ->orderByDesc('answered_at')
            ->get()
            ->toBase();

        return $answers->map(function (ExamAnswer $answer): array {
            $correctOption = $answer->question
                ? $answer->question->options->firstWhere('is_correct', true)
                : null;

            return [
                'source' => 'exam',
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
     * @param array{from:string,to:string,source:string,search:?string,page:int,per_page:int} $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function loadDailyDetails(User $student, array $filters): Collection
    {
        $answers = DailyActivityAnswer::query()
            ->whereHas('log', function (Builder $query) use ($student, $filters): void {
                $query->where('user_id', $student->id)
                    ->whereBetween('activity_date', [$filters['from'], $filters['to']]);
            })
            ->with([
                'log:id,user_id,activity_date',
                'question:id,question_text',
                'question.options:id,question_id,option_text,is_correct',
                'selectedOption:id,option_text',
            ])
            ->orderByDesc('answered_at')
            ->get()
            ->toBase();

        return $answers->map(function (DailyActivityAnswer $answer): array {
            $correctOption = $answer->question
                ? $answer->question->options->firstWhere('is_correct', true)
                : null;

            return [
                'source' => 'daily',
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

        return new \Illuminate\Pagination\LengthAwarePaginator(
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
}
