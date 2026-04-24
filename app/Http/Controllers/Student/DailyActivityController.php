<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\DailyActivity\CompleteDailyActivityRequest;
use App\Http\Requests\DailyActivity\StartDailyActivityRequest;
use App\Http\Requests\DailyActivity\SubmitDailyActivityAnswerRequest;
use App\Services\DailyActivity\DailyActivityService;
use App\Services\DailyActivity\WeeklyRewardService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DailyActivityController extends Controller
{
    public function index(DailyActivityService $service): Response
    {
        $userId = (int) request()->user()->id;
        $log = $service->getOrCreateTodayLog($userId);
        $log->load('answers');
        $questions = $service->loadQuestions($log);
        $answeredQuestionIds = $log->answers
            ->pluck('question_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $answersByQuestion = $log->answers
            ->keyBy('question_id')
            ->map(fn ($answer) => [
                'question_id' => (int) $answer->question_id,
                'selected_option_id' => $answer->selected_option_id !== null
                    ? (int) $answer->selected_option_id
                    : null,
                'is_correct' => (bool) $answer->is_correct,
            ])
            ->values();

        return Inertia::render('Student/DailyActivity/Index', [
            'activity' => $service->summarizeLog($log),
            'questions' => $questions->map(function ($question) use ($answeredQuestionIds, $log): array {
                $correctOption = $question->options->firstWhere('is_correct', true);
                $canShowCorrectAnswer = $log->is_completed || $answeredQuestionIds->contains((int) $question->id);

                return [
                    'id' => (int) $question->id,
                    'question_text' => (string) $question->question_text,
                    'options' => $question->options->map(fn ($option) => [
                        'id' => (int) $option->id,
                        'option_text' => (string) $option->option_text,
                    ])->values(),
                    'correct_option' => $canShowCorrectAnswer && $correctOption !== null
                        ? [
                            'id' => (int) $correctOption->id,
                            'option_text' => (string) $correctOption->option_text,
                        ]
                        : null,
                ];
            })->values(),
            'answers' => $answersByQuestion,
            'rewardJustGranted' => (bool) session('rewardJustGranted', false),
            'weeklyRewardPoints' => WeeklyRewardService::WEEKLY_POINTS,
        ]);
    }

    public function start(
        StartDailyActivityRequest $request,
        DailyActivityService $service,
    ): RedirectResponse {
        $service->getOrCreateTodayLog((int) $request->user()->id);

        return redirect()->route('student.daily-activity.index');
    }

    public function answer(
        SubmitDailyActivityAnswerRequest $request,
        DailyActivityService $service,
    ): RedirectResponse {
        $payload = $request->validated();

        $service->submitAnswer(
            userId: (int) $request->user()->id,
            questionId: (int) $payload['question_id'],
            selectedOptionId: (int) $payload['selected_option_id'],
        );

        return back()->with('status', 'Jawaban daily activity disimpan.');
    }

    public function complete(
        CompleteDailyActivityRequest $request,
        DailyActivityService $service,
    ): RedirectResponse {
        $result = $service->completeToday((int) $request->user()->id);

        if ($result['rewardJustGranted']) {
            return redirect()
                ->route('student.daily-activity.index')
                ->with('rewardJustGranted', true)
                ->with('status', 'Selamat! Anda mendapatkan badge mingguan dan 100 poin.');
        }

        return redirect()
            ->route('student.daily-activity.index')
            ->with('status', 'Daily activity hari ini telah diselesaikan.');
    }
}
