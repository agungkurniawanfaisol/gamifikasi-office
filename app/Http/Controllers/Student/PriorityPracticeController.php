<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StorePriorityPracticeSessionRequest;
use App\Http\Requests\Student\SubmitPriorityPracticeAnswerRequest;
use App\Services\PriorityPractice\PriorityPracticeService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PriorityPracticeController extends Controller
{
    public function __construct(
        private readonly PriorityPracticeService $priorityPracticeService,
    ) {
    }

    public function index(): Response
    {
        $studentId = (int) request()->user()->id;

        try {
            $latest = $this->priorityPracticeService->findLatestSessionForIndex($studentId);

            if ($latest === null) {
                return Inertia::render('Student/PriorityPractice/Index', [
                    'session' => null,
                    'questions' => collect(),
                    'answers' => collect(),
                    'canCreateNewPackage' => true,
                    'errorMessage' => null,
                ]);
            }

            $session = $this->priorityPracticeService->serializeSession($latest);
            $questions = $this->priorityPracticeService->loadQuestions($studentId, (int) $latest->id);
            $answers = $this->priorityPracticeService->loadAnswers($studentId, (int) $latest->id);

            $canCreateNewPackage = ! (
                $latest->status === 'active'
                && $latest->expires_at !== null
                && $latest->expires_at->isFuture()
            );

            return Inertia::render('Student/PriorityPractice/Index', [
                'session' => $session,
                'questions' => $questions,
                'answers' => $answers,
                'canCreateNewPackage' => $canCreateNewPackage,
                'errorMessage' => null,
            ]);
        } catch (RuntimeException $exception) {
            return Inertia::render('Student/PriorityPractice/Index', [
                'session' => null,
                'questions' => collect(),
                'answers' => collect(),
                'canCreateNewPackage' => true,
                'errorMessage' => $exception->getMessage(),
            ]);
        }
    }

    public function store(StorePriorityPracticeSessionRequest $request): RedirectResponse
    {
        try {
            $this->priorityPracticeService->createNewPackage((int) $request->user()->id);
        } catch (RuntimeException $exception) {
            return redirect()
                ->route('student.priority-practice.index')
                ->withErrors([
                    'priority_practice' => $exception->getMessage(),
                ]);
        }

        return redirect()
            ->route('student.priority-practice.index')
            ->with('status', 'Paket latihan prioritas baru berhasil dibuat.');
    }

    public function answer(SubmitPriorityPracticeAnswerRequest $request): RedirectResponse
    {
        try {
            $this->priorityPracticeService->submitAnswer(
                (int) $request->user()->id,
                $request->validated(),
            );
        } catch (RuntimeException $exception) {
            return back()->withErrors([
                'priority_practice' => $exception->getMessage(),
            ]);
        }

        return back()->with('status', 'Jawaban latihan prioritas berhasil disimpan.');
    }
}
