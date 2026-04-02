<?php

namespace App\Http\Requests\Exam;

use App\Models\ExamSession;
use Illuminate\Foundation\Http\FormRequest;

class SubmitExamAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->user()?->isStudent() !== true) {
            return false;
        }

        $session = ExamSession::find($this->input('exam_session_id'));

        if (! $session) {
            return false;
        }

        return (int) $session->user_id === (int) $this->user()->id && $session->isInProgress();
    }

    public function rules(): array
    {
        return [
            'exam_session_id' => ['required', 'integer', 'exists:exam_sessions,id'],
            'exam_session_question_id' => ['required', 'integer', 'exists:exam_session_questions,id'],
            'question_id' => ['required', 'integer', 'exists:questions,id'],
            'selected_option_id' => ['nullable', 'integer', 'exists:question_options,id'],
            'answer_text' => ['nullable', 'string', 'max:50000'],
            'time_spent_seconds' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'exam_session_id.exists' => 'The exam session does not exist.',
            'exam_session_question_id.exists' => 'The exam question does not exist.',
            'answer_text.max' => 'Your answer must not exceed 50,000 characters.',
        ];
    }
}
