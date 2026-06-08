<?php

namespace App\Services\ExamSessions;

use App\Enums\QuestionType;
use App\Models\ExamSession;
use App\Models\ExamSessionQuestion;
use Illuminate\Support\Collection;

class ExamSessionQuestionReviewBuilder
{
    /**
     * @return list<array{
     *   order:int,
     *   question_text:?string,
     *   question_type:string,
     *   student_answer:string,
     *   correct_answer:?string,
     *   is_correct:?bool,
     *   answered_at:?string
     * }>
     */
    public function forSession(ExamSession $session): array
    {
        $questions = $session->relationLoaded('sessionQuestions')
            ? $session->sessionQuestions
            : $session->sessionQuestions()->orderBy('order')->get();

        return $questions
            ->sortBy('order')
            ->values()
            ->map(fn (ExamSessionQuestion $sq): array => $this->rowForSessionQuestion($sq))
            ->all();
    }

    /**
     * @return array{
     *   order:int,
     *   question_text:?string,
     *   question_type:string,
     *   student_answer:string,
     *   correct_answer:?string,
     *   is_correct:?bool,
     *   answered_at:?string
     * }
     */
    public function rowForSessionQuestion(ExamSessionQuestion $sessionQuestion): array
    {
        $question = $sessionQuestion->question;
        $type = $question?->type;
        $typeValue = $type instanceof QuestionType ? $type->value : 'unknown';

        $answer = $sessionQuestion->relationLoaded('answer')
            ? $sessionQuestion->answer
            : $sessionQuestion->answer()->first();

        $options = $question && $question->relationLoaded('options')
            ? $question->options
            : collect();

        $correctAnswer = $this->correctAnswerLabel($type, $options);

        $hasResponse = $answer !== null && (
            $answer->selected_option_id !== null
            || (is_string($answer->answer_text) && trim($answer->answer_text) !== '')
        );

        $studentAnswer = '—';
        $isCorrect = null;

        if ($answer !== null) {
            $isCorrect = $answer->is_correct;
        }

        if (! $hasResponse) {
            $isCorrect = null;
        } elseif ($type === QuestionType::FillBlank) {
            $text = is_string($answer?->answer_text) ? trim($answer->answer_text) : '';
            $studentAnswer = $text !== '' ? $text : '—';
        } elseif ($type === QuestionType::MultipleChoice || $type === QuestionType::TrueFalse) {
            $selected = $answer?->relationLoaded('selectedOption') === true
                ? $answer->selectedOption
                : ($answer !== null && $answer->selected_option_id !== null
                    ? $answer->selectedOption()->first()
                    : null);
            $studentAnswer = $selected !== null && $selected->option_text !== null
                ? (string) $selected->option_text
                : '—';
        } elseif ($type === QuestionType::Essay) {
            $text = is_string($answer?->answer_text) ? trim($answer->answer_text) : '';
            $studentAnswer = $text !== '' ? $text : '—';
        } else {
            $text = is_string($answer?->answer_text) ? trim($answer->answer_text) : '';
            if ($text !== '') {
                $studentAnswer = $text;
            } elseif ($answer?->selected_option_id !== null) {
                $opt = $options->firstWhere('id', (int) $answer->selected_option_id);
                $studentAnswer = $opt !== null ? (string) $opt->option_text : '—';
            }
        }

        return [
            'order' => (int) $sessionQuestion->order,
            'question_text' => $question?->question_text,
            'question_type' => $typeValue,
            'student_answer' => $studentAnswer,
            'correct_answer' => $correctAnswer,
            'is_correct' => $isCorrect,
            'answered_at' => $answer?->answered_at?->toIso8601String(),
        ];
    }

    /**
     * @param  Collection<int, \App\Models\QuestionOption>  $options
     */
    private function correctAnswerLabel(?QuestionType $type, Collection $options): ?string
    {
        if ($options->isEmpty()) {
            return null;
        }

        $correct = $options->where('is_correct', true)->pluck('option_text')->filter()->values();

        if ($correct->isEmpty()) {
            return null;
        }

        return $correct->implode(' / ');
    }
}
