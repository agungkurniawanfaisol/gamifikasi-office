<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class StartExamSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStudent() === true;
    }

    public function rules(): array
    {
        return [
            'level_id' => ['required', 'integer', 'exists:levels,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'level_id.exists' => 'The selected level does not exist.',
        ];
    }
}
