<?php

namespace App\Services\Dashboard;

use App\Enums\ExamStatus;
use App\Enums\UserRole;
use App\Models\DailyActivityLog;
use App\Models\ExamSession;
use App\Models\Question;
use App\Models\User;
use App\Models\UserRewardPoint;
use Illuminate\Support\Collection;

class DashboardAnalyticsService
{
    /**
     * @return array{student?: array<string, mixed>, lecturer?: array<string, mixed>, admin?: array<string, mixed>}
     */
    public function forUser(User $user): array
    {
        return match ($user->role) {
            UserRole::Student => [
                'student' => $this->studentAnalytics((int) $user->id),
            ],
            UserRole::Lecturer => [
                'lecturer' => $this->lecturerAnalytics((int) $user->id),
            ],
            UserRole::Admin => [
                'admin' => $this->adminAnalytics(),
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function studentAnalytics(int $userId): array
    {
        $completedStatuses = [
            ExamStatus::Completed->value,
            ExamStatus::TimedOut->value,
        ];

        $completedCount = ExamSession::query()
            ->where('user_id', $userId)
            ->whereIn('status', $completedStatuses)
            ->count();

        $inProgressCount = ExamSession::query()
            ->where('user_id', $userId)
            ->where('status', ExamStatus::InProgress->value)
            ->count();

        return [
            'completedCount' => $completedCount,
            'inProgressCount' => $inProgressCount,
            'averageScorePercent' => $this->studentAverageScorePercent($userId, $completedStatuses),
            'recentScores' => $this->studentRecentScores($userId, $completedStatuses),
            'scoresByLevel' => $this->studentScoresByLevel($userId, $completedStatuses),
            'dailyActivity' => $this->studentDailyActivity($userId),
        ];
    }

    private function studentAverageScorePercent(int $userId, array $completedStatuses): ?float
    {
        $value = ExamSession::query()
            ->where('user_id', $userId)
            ->whereIn('status', $completedStatuses)
            ->where('max_possible_score', '>', 0)
            ->selectRaw('AVG(total_score * 100.0 / max_possible_score) as avg_pct')
            ->value('avg_pct');

        if ($value === null) {
            return null;
        }

        return round((float) $value, 1);
    }

    /**
     * @return list<array{date: string|null, label: string, scorePercent: float, levelName: string}>
     */
    private function studentRecentScores(int $userId, array $completedStatuses): array
    {
        /** @var Collection<int, ExamSession> $sessions */
        $sessions = ExamSession::query()
            ->where('user_id', $userId)
            ->whereIn('status', $completedStatuses)
            ->whereNotNull('completed_at')
            ->where('max_possible_score', '>', 0)
            ->with(['level:id,name'])
            ->orderByDesc('completed_at')
            ->limit(15)
            ->get()
            ->reverse()
            ->values();

        return $sessions->map(function (ExamSession $session) {
            $pct = round(($session->total_score / $session->max_possible_score) * 100, 1);

            return [
                'date' => $session->completed_at?->toIso8601String(),
                'label' => $session->completed_at?->format('M j') ?? '',
                'scorePercent' => $pct,
                'levelName' => $session->level?->name ?? 'Level',
            ];
        })->all();
    }

    /**
     * @return list<array{name: string, avgPercent: float}>
     */
    private function studentScoresByLevel(int $userId, array $completedStatuses): array
    {
        $rows = ExamSession::query()
            ->where('exam_sessions.user_id', $userId)
            ->whereIn('exam_sessions.status', $completedStatuses)
            ->where('exam_sessions.max_possible_score', '>', 0)
            ->join('levels', 'levels.id', '=', 'exam_sessions.level_id')
            ->selectRaw('levels.name as level_name, AVG(exam_sessions.total_score * 100.0 / exam_sessions.max_possible_score) as avg_pct')
            ->groupBy('levels.id', 'levels.name', 'levels.order')
            ->orderBy('levels.order')
            ->get();

        return $rows->map(fn ($row) => [
            'name' => (string) $row->level_name,
            'avgPercent' => round((float) $row->avg_pct, 1),
        ])->all();
    }

    /**
     * @return array{
     *   todayAnsweredCount: int,
     *   todayCompleted: bool,
     *   minRequired: int,
     *   maxAllowed: int,
     *   currentStreak: int,
     *   weeklyProgressDays: int,
     *   rewardPointsTotal: int
     * }
     */
    private function studentDailyActivity(int $userId): array
    {
        $today = now()->toDateString();
        $todayLog = DailyActivityLog::query()
            ->forUser($userId)
            ->forDate($today)
            ->first();

        $weeklyProgressDays = DailyActivityLog::query()
            ->forUser($userId)
            ->where('is_completed', true)
            ->whereBetween('activity_date', [now()->subDays(6)->toDateString(), $today])
            ->count();

        $rewardPointsTotal = UserRewardPoint::query()
            ->forUser($userId)
            ->sum('points');

        return [
            'todayAnsweredCount' => (int) ($todayLog?->answered_count ?? 0),
            'todayCompleted' => (bool) ($todayLog?->is_completed ?? false),
            'minRequired' => 2,
            'maxAllowed' => 5,
            'currentStreak' => (int) ($todayLog?->streak_after_day ?? 0),
            'weeklyProgressDays' => (int) $weeklyProgressDays,
            'rewardPointsTotal' => (int) $rewardPointsTotal,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function lecturerAnalytics(int $userId): array
    {
        $totalQuestions = Question::query()->where('created_by', $userId)->count();
        $activeQuestions = Question::query()
            ->where('created_by', $userId)
            ->where('is_active', true)
            ->count();

        $bySkill = Question::query()
            ->where('questions.created_by', $userId)
            ->join('skill_categories', 'skill_categories.id', '=', 'questions.skill_category_id')
            ->selectRaw('skill_categories.name as skill_name, COUNT(*) as c')
            ->groupBy('skill_categories.id', 'skill_categories.name')
            ->orderBy('skill_categories.name')
            ->get();

        return [
            'totalQuestions' => $totalQuestions,
            'activeQuestions' => $activeQuestions,
            'questionsBySkill' => $bySkill->map(fn ($r) => [
                'name' => (string) $r->skill_name,
                'count' => (int) $r->c,
            ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function adminAnalytics(): array
    {
        $counts = User::query()
            ->selectRaw('role, COUNT(*) as c')
            ->groupBy('role')
            ->pluck('c', 'role');

        $completedSessions = ExamSession::query()
            ->whereIn('status', [
                ExamStatus::Completed->value,
                ExamStatus::TimedOut->value,
            ])
            ->count();

        return [
            'totalUsers' => User::query()->count(),
            'usersByRole' => [
                'admin' => (int) ($counts[UserRole::Admin->value] ?? 0),
                'lecturer' => (int) ($counts[UserRole::Lecturer->value] ?? 0),
                'student' => (int) ($counts[UserRole::Student->value] ?? 0),
            ],
            'completedExamSessions' => $completedSessions,
        ];
    }
}
