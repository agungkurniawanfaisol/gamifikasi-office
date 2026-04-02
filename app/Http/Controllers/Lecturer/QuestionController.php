<?php

namespace App\Http\Controllers\Lecturer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Question\StoreQuestionRequest;
use App\Http\Requests\Question\UpdateQuestionRequest;
use App\Models\Level;
use App\Models\Question;
use App\Models\QuestionMedia;
use App\Models\QuestionOption;
use App\Models\SkillCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class QuestionController extends Controller
{
    public function index(Request $request): Response
    {
        $questions = Question::query()
            ->select([
                'id',
                'skill_category_id',
                'level_id',
                'type',
                'question_text',
                'is_active',
                'created_at',
                'created_by',
            ])
            ->with([
                'skillCategory:id,name',
                'level:id,name',
            ])
            ->when(
                $request->user()?->isLecturer(),
                fn ($q) => $q->where('created_by', $request->user()->id),
            )
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Lecturer/Questions/Index', [
            'questions' => $questions,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Lecturer/Questions/Create', [
            'skillCategories' => SkillCategory::query()->select(['id', 'name'])->orderBy('name')->get(),
            'levels' => Level::query()->select(['id', 'name'])->orderBy('id')->get(),
        ]);
    }

    public function store(StoreQuestionRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $question = Question::query()->create([
            'skill_category_id' => $data['skill_category_id'],
            'level_id' => $data['level_id'],
            'type' => $data['type'],
            'question_text' => $data['question_text'],
            'narrative_text' => $data['narrative_text'] ?? null,
            'explanation' => $data['explanation'] ?? null,
            'created_by' => $request->user()->id,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ]);

        if (isset($data['options']) && is_array($data['options'])) {
            foreach (array_values($data['options']) as $index => $opt) {
                QuestionOption::query()->create([
                    'question_id' => $question->id,
                    'option_text' => $opt['option_text'],
                    'is_correct' => (bool) $opt['is_correct'],
                    'order' => $index + 1,
                ]);
            }
        }

        if (isset($data['media']) && is_array($data['media'])) {
            foreach (array_values($data['media']) as $index => $media) {
                if (! isset($media['file'])) {
                    continue;
                }

                $file = $media['file'];
                $path = Storage::disk('public')->putFile("questions/{$question->id}", $file);

                QuestionMedia::query()->create([
                    'question_id' => $question->id,
                    'media_type' => $media['media_type'],
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'sort_order' => $index + 1,
                ]);
            }
        }

        return redirect()->route('lecturer.questions.index');
    }

    public function edit(Question $question): Response
    {
        $this->authorizeOwnership($question);

        return Inertia::render('Lecturer/Questions/Edit', [
            'question' => $question
                ->load([
                    'options:id,question_id,option_text,is_correct,order',
                    'media:id,question_id,media_type,file_path,file_name,mime_type,file_size,sort_order',
                ])
                ->only([
                    'id',
                    'skill_category_id',
                    'level_id',
                    'type',
                    'question_text',
                    'narrative_text',
                    'explanation',
                    'is_active',
                    'options',
                    'media',
                ]),
            'skillCategories' => SkillCategory::query()->select(['id', 'name'])->orderBy('name')->get(),
            'levels' => Level::query()->select(['id', 'name'])->orderBy('id')->get(),
        ]);
    }

    public function update(UpdateQuestionRequest $request, Question $question): RedirectResponse
    {
        $this->authorizeOwnership($question);

        $data = $request->validated();

        $question->update([
            'skill_category_id' => $data['skill_category_id'] ?? $question->skill_category_id,
            'level_id' => $data['level_id'] ?? $question->level_id,
            'type' => $data['type'] ?? $question->type,
            'question_text' => $data['question_text'] ?? $question->question_text,
            'narrative_text' => $data['narrative_text'] ?? null,
            'explanation' => $data['explanation'] ?? null,
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : $question->is_active,
        ]);

        if (array_key_exists('options', $data)) {
            QuestionOption::query()->where('question_id', $question->id)->delete();

            if (is_array($data['options'])) {
                foreach (array_values($data['options']) as $index => $opt) {
                    QuestionOption::query()->create([
                        'question_id' => $question->id,
                        'option_text' => $opt['option_text'],
                        'is_correct' => (bool) $opt['is_correct'],
                        'order' => $index + 1,
                    ]);
                }
            }
        }

        if (isset($data['remove_media_ids']) && is_array($data['remove_media_ids'])) {
            $mediaRows = QuestionMedia::query()
                ->where('question_id', $question->id)
                ->whereIn('id', $data['remove_media_ids'])
                ->get();

            foreach ($mediaRows as $row) {
                if ($row->file_path) {
                    Storage::disk('public')->delete($row->file_path);
                }
                $row->delete();
            }
        }

        if (isset($data['media']) && is_array($data['media'])) {
            $currentMax = (int) (QuestionMedia::query()->where('question_id', $question->id)->max('sort_order') ?? 0);

            foreach (array_values($data['media']) as $index => $media) {
                if (! isset($media['file'])) {
                    continue;
                }

                $file = $media['file'];
                $path = Storage::disk('public')->putFile("questions/{$question->id}", $file);

                QuestionMedia::query()->create([
                    'question_id' => $question->id,
                    'media_type' => $media['media_type'],
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getClientMimeType(),
                    'file_size' => $file->getSize(),
                    'sort_order' => $currentMax + $index + 1,
                ]);
            }
        }

        return redirect()->route('lecturer.questions.index');
    }

    public function destroy(Question $question): RedirectResponse
    {
        $this->authorizeOwnership($question);

        $mediaRows = QuestionMedia::query()->where('question_id', $question->id)->get();
        foreach ($mediaRows as $row) {
            if ($row->file_path) {
                Storage::disk('public')->delete($row->file_path);
            }
        }

        $question->delete();

        return redirect()->route('lecturer.questions.index');
    }

    private function authorizeOwnership(Question $question): void
    {
        $user = request()->user();

        if (! $user) {
            abort(401);
        }

        if ($user->isAdmin()) {
            return;
        }

        if ($user->isLecturer() && (int) $question->created_by === (int) $user->id) {
            return;
        }

        abort(403);
    }
}

