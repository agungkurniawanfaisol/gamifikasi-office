<?php

namespace App\Actions\ExamSessions;

use App\Enums\ExamStatus;
use App\Enums\QuestionType;
use App\Models\ExamAnswer;
use App\Models\ExamSession;
use App\Models\ExamSessionQuestion;
use App\Services\Audit\AuditTrailService;
use Illuminate\Validation\ValidationException;

class SubmitExamAnswerAction
{
    /**
     * @param  array{
     *   exam_session_id:int,
     *   exam_session_question_id:int,
     *   question_id:int,
     *   selected_option_id:int|null,
     *   answer_text:string|null,
     *   time_spent_seconds:int|null
     * }  $payload
     */
    public function execute(array $payload, int $userId): ExamAnswer
    {
        $session = ExamSession::query()->findOrFail($payload['exam_session_id']);
        if ((int) $session->user_id !== $userId || $session->status !== ExamStatus::InProgress) {
            throw ValidationException::withMessages([
                'exam_session_id' => 'Session is not accessible.',
            ]);
        }

        $sessionQuestion = ExamSessionQuestion::query()
            ->where('id', $payload['exam_session_question_id'])
            ->where('exam_session_id', $session->id)
            ->with(['question.options:id,question_id,option_text,is_correct'])
            ->first();

        if (! $sessionQuestion || (int) $sessionQuestion->question_id !== (int) $payload['question_id']) {
            throw ValidationException::withMessages([
                'exam_session_question_id' => 'Question does not belong to this session.',
            ]);
        }

        $selectedOptionId = $payload['selected_option_id'] ?? null;
        $answerText = $payload['answer_text'] ?? null;
        $isCorrect = null;
        $score = 0;
        $question = $sessionQuestion->question;

        if ($question->type === QuestionType::MultipleChoice || $question->type === QuestionType::TrueFalse) {
            if ($selectedOptionId !== null) {
                $option = $question->options->firstWhere('id', $selectedOptionId);
                if (! $option) {
                    throw ValidationException::withMessages([
                        'selected_option_id' => 'Option does not belong to question.',
                    ]);
                }
                $isCorrect = (bool) $option->is_correct;
                $score = $isCorrect ? 1 : 0;
            }
        } elseif ($question->type === QuestionType::FillBlank) {
            if (is_string($answerText) && trim($answerText) !== '') {
                $normalized = mb_strtolower(trim($answerText));
                $isCorrect = $question->options
                    ->where('is_correct', true)
                    ->contains(fn ($opt) => mb_strtolower(trim((string) $opt->option_text)) === $normalized);
                $score = $isCorrect ? 1 : 0;
            }
        }

        $answer = ExamAnswer::query()->updateOrCreate(
            [
                'exam_session_id' => $session->id,
                'exam_session_question_id' => $sessionQuestion->id,
            ],
            [
                'question_id' => $sessionQuestion->question_id,
                'selected_option_id' => $selectedOptionId,
                'answer_text' => $answerText,
                'is_correct' => $isCorrect,
                'score' => $score,
                'answered_at' => now(),
                'time_spent_seconds' => $payload['time_spent_seconds'] ?? null,
            ],
        );

        app(AuditTrailService::class)->record(
            payload: [
                'event_type' => 'exam_event',
                'event_key' => 'exam.answer.submit',
                'subject_type' => 'exam_session_question',
                'subject_id' => (int) $sessionQuestion->id,
                'subject_label' => 'Submit exam answer',
                'exam_session_id' => (int) $session->id,
                'score_after' => $score,
                'metadata' => [
                    'question_id' => (int) $sessionQuestion->question_id,
                    'is_correct' => $isCorrect,
                    'selected_option_id' => $selectedOptionId,
                    'time_spent_seconds' => $payload['time_spent_seconds'] ?? null,
                ],
            ],
            actor: $session->user,
        );

        return $answer;
    }
}

