<?php

namespace App\Http\Requests\Exam;

use App\Models\ExamSession;
use Illuminate\Foundation\Http\FormRequest;

class CompleteExamSessionRequest extends FormRequest
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
            'timed_out' => ['nullable', 'boolean'],
        ];
    }
}
