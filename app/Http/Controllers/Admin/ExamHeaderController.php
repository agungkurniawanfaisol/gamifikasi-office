<?php

namespace App\Http\Controllers\Admin;

use App\Actions\ExamHeaders\CreateExamHeaderAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreExamHeaderRequest;
use App\Models\ExamHeader;
use App\Models\Level;
use App\Models\Question;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamHeaderController extends Controller
{
    public function index(): Response
    {
        $headers = ExamHeader::query()
            ->select(['id', 'title', 'level_id', 'total_duration_minutes', 'creator_id', 'created_at'])
            ->with([
                'level:id,name',
                'creator:id,name,email',
            ])
            ->withCount('examQuestions')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/ExamHeaders/Index', [
            'headers' => $headers,
        ]);
    }

    public function create(Request $request): Response
    {
        $validated = $request->validate([
            'level_id' => ['nullable', 'integer', 'exists:levels,id'],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $selectedLevelId = (int) ($validated['level_id'] ?? 0);
        $search = isset($validated['search']) ? trim((string) $validated['search']) : '';

        $levels = Level::query()
            ->select(['id', 'name'])
            ->orderBy('order')
            ->get();

        $questions = Question::query()
            ->select(['id', 'level_id', 'type', 'question_text', 'is_active'])
            ->when($selectedLevelId > 0, fn ($q) => $q->where('level_id', $selectedLevelId))
            ->where('is_active', true)
            ->when($search !== '', function ($query) use ($search): void {
                $like = '%'.$search.'%';
                $query->where(function ($q) use ($like): void {
                    $q->where('question_text', 'like', $like)
                        ->orWhere('narrative_text', 'like', $like);
                });
            })
            ->orderBy('id')
            ->limit(300)
            ->get();

        return Inertia::render('Admin/ExamHeaders/Create', [
            'levels' => $levels,
            'filters' => [
                'level_id' => $selectedLevelId > 0 ? $selectedLevelId : null,
                'search' => $search,
            ],
            'questions' => $questions,
        ]);
    }

    public function store(StoreExamHeaderRequest $request, CreateExamHeaderAction $action): RedirectResponse
    {
        $header = $action->execute(
            payload: $request->validated(),
            creatorId: (int) $request->user()->id,
        );

        return redirect()->route('admin.exam-headers.show', $header->id);
    }

    public function show(ExamHeader $examHeader): Response
    {
        $examHeader->load([
            'level:id,name',
            'creator:id,name,email',
            'examQuestions' => function ($query) {
                $query->select(['id', 'exam_header_id', 'question_id', 'duration_per_question', 'sort_order'])
                    ->with([
                        'question' => function ($q): void {
                            $q->select([
                                'id',
                                'level_id',
                                'type',
                                'question_text',
                                'narrative_text',
                                'explanation',
                                'is_active',
                            ])
                                ->with([
                                    'options' => function ($opt): void {
                                        $opt->select([
                                            'id',
                                            'question_id',
                                            'option_text',
                                            'is_correct',
                                            'order',
                                        ])
                                            ->orderBy('order');
                                    },
                                ]);
                        },
                    ])
                    ->orderBy('sort_order');
            },
        ]);

        return Inertia::render('Admin/ExamHeaders/Show', [
            'header' => $examHeader,
        ]);
    }
}

