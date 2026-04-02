<?php

namespace App\Actions\ExamSessions;

use App\Models\ExamHeader;
use App\Models\Question;
use Illuminate\Validation\ValidationException;

class ResolveQuestionSourceAction
{
    /**
     * @return array{
     *   source:string,
     *   header_id:int|null,
     *   duration_seconds:int,
     *   skill_category_id:int,
     *   items:array<int,array{
     *     question_id:int,
     *     order:int,
     *     expected_duration_seconds:int
     *   }>
     * }
     */
    public function execute(int $levelId): array
    {
        $header = ExamHeader::query()
            ->select(['id', 'level_id', 'total_duration_minutes'])
            ->where('level_id', $levelId)
            ->with([
                'examQuestions' => function ($query): void {
                    $query->select(['id', 'exam_header_id', 'question_id', 'duration_per_question', 'sort_order'])
                        ->with([
                            'question:id,skill_category_id,level_id,is_active',
                        ])
                        ->orderBy('sort_order');
                },
            ])
            ->latest('id')
            ->first();

        if ($header && $header->examQuestions->isNotEmpty()) {
            $items = [];
            foreach ($header->examQuestions as $idx => $eq) {
                if (! $eq->question || ! $eq->question->is_active) {
                    continue;
                }

                $items[] = [
                    'question_id' => (int) $eq->question_id,
                    'order' => $idx + 1,
                    'expected_duration_seconds' => (int) $eq->duration_per_question * 60,
                ];
            }

            if ($items !== []) {
                return [
                    'source' => 'exam_header',
                    'header_id' => (int) $header->id,
                    'duration_seconds' => (int) $header->total_duration_minutes * 60,
                    'skill_category_id' => (int) ($header->examQuestions->first()->question->skill_category_id ?? 0),
                    'items' => $items,
                ];
            }
        }

        $questions = Question::query()
            ->select(['id', 'skill_category_id'])
            ->where('level_id', $levelId)
            ->where('is_active', true)
            ->inRandomOrder()
            ->limit(10)
            ->get();

        if ($questions->isEmpty()) {
            throw ValidationException::withMessages([
                'level_id' => 'No active questions available for selected level.',
            ]);
        }

        $items = [];
        foreach ($questions->values() as $idx => $question) {
            $items[] = [
                'question_id' => (int) $question->id,
                'order' => $idx + 1,
                'expected_duration_seconds' => 60,
            ];
        }

        return [
            'source' => 'question_bank',
            'header_id' => null,
            'duration_seconds' => count($items) * 60,
            'skill_category_id' => (int) $questions->first()->skill_category_id,
            'items' => $items,
        ];
    }
}

