<?php

namespace App\Http\Requests\Exam;

use App\Enums\FocusViolationType;
use App\Models\ExamSession;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamFocusEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->user()?->isStudent() !== true) {
            return false;
        }

        $session = $this->route('examSession');

        if (! $session instanceof ExamSession) {
            return false;
        }

        return (int) $session->user_id === (int) $this->user()->id
            && $session->isInProgress();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'event_type' => ['required', 'string', Rule::enum(FocusViolationType::class)],
            'metadata' => ['nullable', 'array', 'max:20'],
            'metadata.*' => ['nullable', 'string', 'max:500'],
        ];
    }
}
