<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class StudentLearningHistoryIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->isStudent();
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'source' => ['nullable', 'in:all,exam,daily'],
            'search' => ['nullable', 'string', 'max:100'],
            'attempt_source' => ['nullable', 'in:exam,daily'],
            'attempt_id' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
