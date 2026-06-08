<?php

namespace App\Http\Controllers\Student;

use App\Actions\ExamSessions\CompleteExamSessionAction;
use App\Actions\ExamSessions\EnsureExamSessionFeedbackAction;
use App\Actions\ExamSessions\StartExamSessionAction;
use App\Actions\ExamSessions\SubmitExamAnswerAction;
use App\Actions\ExamSessions\SubmitExamSessionFeedbackAction;
use App\Enums\ExamStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\CompleteExamSessionRequest;
use App\Http\Requests\Exam\StartExamSessionRequest;
use App\Http\Requests\Exam\StoreExamSessionFeedbackRequest;
use App\Http\Requests\Exam\SubmitExamAnswerRequest;
use App\Jobs\GenerateExamSessionFeedbackJob;
use App\Models\ExamSession;
use App\Models\Level;
use App\Services\ExamSessions\ExamSessionQuestionReviewBuilder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ExamSessionController extends Controller
{
    public function index(): Response
    {
        $user = request()->user();

        $levels = Level::query()
            ->select(['id', 'name', 'order'])
            ->orderBy('order')
            ->get();

        $inProgress = ExamSession::query()
            ->select(['id', 'level_id', 'started_at', 'duration_seconds'])
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->with(['level:id,name'])
            ->latest('id')
            ->get()
            ->keyBy('level_id');

        $completedByLevel = ExamSession::query()
            ->select(['id', 'level_id', 'status', 'total_score', 'max_possible_score', 'duration_seconds', 'completed_at'])
            ->where('user_id', $user->id)
            ->whereIn('status', ['completed', 'timed_out'])
            ->latest('id')
            ->get()
            ->unique('level_id')
            ->keyBy('level_id');

        $leaderboardByLevel = $this->buildLeaderboardsByLevel($levels, (int) $user->id, 10, latestOnly: false);

        return Inertia::render('Student/Exams/Index', [
            'levels' => $levels,
            'inProgressByLevel' => $inProgress,
            'completedByLevel' => $completedByLevel,
            'leaderboardByLevel' => $leaderboardByLevel,
        ]);
    }

    public function rankings(): Response
    {
        $userId = (int) request()->user()->id;
        $levels = Level::query()
            ->select(['id', 'name', 'order'])
            ->orderBy('order')
            ->get();

        return Inertia::render('Student/Rankings/Index', [
            'levels' => $levels,
            'globalLeaderboardLatest' => $this->buildGlobalLeaderboard($userId, latestOnly: true),
            'globalLeaderboardAllAttempts' => $this->buildGlobalLeaderboard($userId, latestOnly: false),
            'leaderboardByLevelLatest' => $this->buildLeaderboardsByLevel($levels, $userId, 5000, latestOnly: true),
            'leaderboardByLevelAllAttempts' => $this->buildLeaderboardsByLevel($levels, $userId, 5000, latestOnly: false),
        ]);
    }

    public function start(StartExamSessionRequest $request, StartExamSessionAction $action): RedirectResponse
    {
        $payload = $request->validated();
        $session = $action->execute(
            userId: (int) $request->user()->id,
            levelId: (int) $payload['level_id'],
        );

        return redirect()->route('student.exams.show', $session->id);
    }

    public function show(ExamSession $examSession): Response|RedirectResponse
    {
        abort_unless((int) $examSession->user_id === (int) request()->user()->id, 403);

        if (! $examSession->isInProgress()) {
            $examSession->load('feedback');
            if ($examSession->feedback !== null && $examSession->feedback->submitted_at === null) {
                return redirect()->route('student.exams.feedback', $examSession);
            }

            return redirect()
                ->route('student.exams.index')
                ->with('status', 'Sesi ujian ini sudah selesai.');
        }

        $examSession->load([
            'level:id,name',
            'sessionQuestions' => function ($query): void {
                $query->select(['id', 'exam_session_id', 'question_id', 'order', 'expected_duration_seconds'])
                    ->with([
                        'question:id,type,question_text,narrative_text,explanation',
                        'question.options:id,question_id,option_text,is_correct,order',
                        'answer:id,exam_session_question_id,selected_option_id,answer_text,time_spent_seconds',
                    ])
                    ->orderBy('order');
            },
        ]);

        return Inertia::render('Student/Exams/Show', [
            'session' => $examSession,
            'serverNow' => now()->toIso8601String(),
        ]);
    }

    public function answer(SubmitExamAnswerRequest $request, SubmitExamAnswerAction $action): RedirectResponse
    {
        $action->execute(
            payload: $request->validated(),
            userId: (int) $request->user()->id,
        );

        return back();
    }

    public function complete(
        CompleteExamSessionRequest $request,
        CompleteExamSessionAction $action,
        EnsureExamSessionFeedbackAction $ensureFeedback,
    ): RedirectResponse {
        $payload = $request->validated();

        $session = $action->execute(
            sessionId: (int) $payload['exam_session_id'],
            userId: (int) $request->user()->id,
            timedOut: (bool) $request->boolean('timed_out'),
        );

        $session->refresh();
        $ensureFeedback->execute($session);

        return redirect()->route('student.exams.feedback', $session);
    }

    public function feedback(ExamSession $examSession): Response|RedirectResponse
    {
        abort_unless((int) $examSession->user_id === (int) request()->user()->id, 403);

        if (! in_array($examSession->status, [ExamStatus::Completed, ExamStatus::TimedOut], true)) {
            return redirect()->route('student.exams.show', $examSession);
        }

        $examSession->load(['level:id,name', 'feedback']);

        if ($examSession->feedback === null) {
            app(EnsureExamSessionFeedbackAction::class)->execute($examSession);
            $examSession->load('feedback');
        }

        if ($this->shouldGenerateFeedback($examSession)) {
            app()->call([new GenerateExamSessionFeedbackJob((int) $examSession->id), 'handle']);
            $examSession->load('feedback');
        }

        $examSession->load([
            'sessionQuestions' => function ($query): void {
                $query->select(['id', 'exam_session_id', 'question_id', 'order', 'expected_duration_seconds'])
                    ->with([
                        'question:id,type,question_text',
                        'question.options:id,question_id,option_text,is_correct,order',
                        'answer:id,exam_session_question_id,selected_option_id,answer_text,is_correct,answered_at',
                        'answer.selectedOption:id,option_text',
                    ])
                    ->orderBy('order');
            },
        ]);

        $questionReview = app(ExamSessionQuestionReviewBuilder::class)->forSession($examSession);

        if ($examSession->feedback->isSubmitted()) {
            return Inertia::render('Student/Exams/Feedback', [
                'session' => [
                    'id' => $examSession->id,
                    'status' => $examSession->status->value,
                    'total_score' => $examSession->total_score,
                    'max_possible_score' => $examSession->max_possible_score,
                    'level' => $examSession->level,
                    'completion_message' => $examSession->feedback->completion_message,
                    'ai_status' => $examSession->feedback->ai_status?->value,
                    'ai_error_message' => $examSession->feedback->ai_error_message,
                ],
                'feedback' => [
                    'rating' => $examSession->feedback->rating,
                    'testimonial' => $examSession->feedback->testimonial,
                    'submitted_at' => $examSession->feedback->submitted_at?->toIso8601String(),
                    'is_submitted' => true,
                ],
                'question_review' => $questionReview,
            ]);
        }

        return Inertia::render('Student/Exams/Feedback', [
            'session' => [
                'id' => $examSession->id,
                'status' => $examSession->status->value,
                'total_score' => $examSession->total_score,
                'max_possible_score' => $examSession->max_possible_score,
                'level' => $examSession->level,
                'completion_message' => $examSession->feedback->completion_message,
                'ai_status' => $examSession->feedback->ai_status?->value,
                'ai_error_message' => $examSession->feedback->ai_error_message,
            ],
            'feedback' => [
                'rating' => $examSession->feedback->rating,
                'testimonial' => $examSession->feedback->testimonial,
                'submitted_at' => $examSession->feedback->submitted_at?->toIso8601String(),
                'is_submitted' => false,
            ],
            'question_review' => $questionReview,
        ]);
    }

    public function storeFeedback(
        StoreExamSessionFeedbackRequest $request,
        ExamSession $examSession,
        SubmitExamSessionFeedbackAction $action,
    ): RedirectResponse {
        abort_unless((int) $examSession->user_id === (int) $request->user()->id, 403);

        if (! in_array($examSession->status, [ExamStatus::Completed, ExamStatus::TimedOut], true)) {
            return redirect()->route('student.exams.index');
        }

        $validated = $request->validated();
        app(EnsureExamSessionFeedbackAction::class)->execute($examSession);

        $action->execute(
            session: $examSession,
            userId: (int) $request->user()->id,
            rating: (int) $validated['rating'],
            testimonial: trim((string) $validated['testimonial']),
        );

        return redirect()
            ->route('student.exams.feedback', $examSession)
            ->with('status', 'Feedback berhasil disimpan ke database.');
    }

    /**
     * @return array<string,array{top:Collection<int,array<string,mixed>>,my_rank:int|null}>
     */
    private function buildLeaderboardsByLevel(Collection $levels, int $userId, int $limit, bool $latestOnly = false): array
    {
        $leaderboardByLevel = [];
        foreach ($levels as $level) {
            $rows = ExamSession::query()
                ->select(['id', 'user_id', 'level_id', 'status', 'total_score', 'max_possible_score', 'duration_seconds', 'completed_at'])
                ->where('level_id', $level->id)
                ->whereIn('status', ['completed', 'timed_out'])
                ->whereHas('user', fn ($q) => $q->where('role', 'student'))
                ->with(['user:id,name'])
                ->latest('id')
                ->get();

            $toRank = $latestOnly ? $this->latestSessionPerUser($rows) : $rows;
            $ranked = $this->rankAllSessions($toRank);
            $myLatestSessionId = ExamSession::query()
                ->where('user_id', $userId)
                ->where('level_id', $level->id)
                ->whereIn('status', ['completed', 'timed_out'])
                ->latest('id')
                ->value('id');
            $myRow = $myLatestSessionId !== null
                ? $ranked->firstWhere('session_id', (int) $myLatestSessionId)
                : null;

            $leaderboardByLevel[(string) $level->id] = [
                'top' => $ranked->take($limit)->values(),
                'my_rank' => $myRow['rank'] ?? null,
            ];
        }

        return $leaderboardByLevel;
    }

    /**
     * @return array{top:Collection<int,array<string,mixed>>,my_rank:int|null}
     */
    private function buildGlobalLeaderboard(int $userId, bool $latestOnly = false): array
    {
        $rows = ExamSession::query()
            ->select(['id', 'user_id', 'level_id', 'status', 'total_score', 'max_possible_score', 'duration_seconds', 'completed_at'])
            ->whereIn('status', ['completed', 'timed_out'])
            ->whereHas('user', fn ($q) => $q->where('role', 'student'))
            ->with(['user:id,name', 'level:id,name'])
            ->latest('id')
            ->get();

        $toRank = $latestOnly ? $this->latestSessionPerUser($rows) : $rows;
        $ranked = $this->rankAllSessions($toRank, includeLevel: true);
        $myLatestSessionId = ExamSession::query()
            ->where('user_id', $userId)
            ->whereIn('status', ['completed', 'timed_out'])
            ->latest('id')
            ->value('id');
        $myRow = $myLatestSessionId !== null
            ? $ranked->firstWhere('session_id', (int) $myLatestSessionId)
            : null;

        return [
            'top' => $ranked->values(),
            'my_rank' => $myRow['rank'] ?? null,
        ];
    }

    /**
     * @param  Collection<int,ExamSession>  $rows
     * @return Collection<int,array<string,mixed>>
     */
    private function rankAllSessions(Collection $rows, bool $includeLevel = false): Collection
    {
        $sorted = $rows->sort(function (ExamSession $a, ExamSession $b): int {
            $scoreCmp = ((int) $b->total_score) <=> ((int) $a->total_score);
            if ($scoreCmp !== 0) {
                return $scoreCmp;
            }

            return ((int) ($a->duration_seconds ?? PHP_INT_MAX)) <=> ((int) ($b->duration_seconds ?? PHP_INT_MAX));
        })->values();

        return $sorted->map(function (ExamSession $s, int $idx) use ($includeLevel): array {
            $row = [
                'rank' => $idx + 1,
                'session_id' => (int) $s->id,
                'user_id' => (int) $s->user_id,
                'user_name' => (string) ($s->user->name ?? 'Unknown'),
                'total_score' => (int) ($s->total_score ?? 0),
                'max_possible_score' => (int) ($s->max_possible_score ?? 0),
                'status' => (string) $s->status->value,
                'duration_seconds' => $s->duration_seconds !== null ? (int) $s->duration_seconds : null,
            ];

            if ($includeLevel) {
                $row['level_name'] = (string) ($s->level->name ?? '-');
            }

            return $row;
        });
    }

    /**
     * Keep each student's most recent finished session (highest id).
     *
     * @param  Collection<int,ExamSession>  $rows
     * @return Collection<int,ExamSession>
     */
    private function latestSessionPerUser(Collection $rows): Collection
    {
        return $rows->sortByDesc('id')->unique('user_id')->values();
    }

    private function shouldGenerateFeedback(ExamSession $examSession): bool
    {
        if ($examSession->feedback === null) {
            return false;
        }

        if (request()->boolean('regenerate')) {
            return true;
        }

        return $examSession->feedback->ai_status?->value !== 'ready';
    }
}
