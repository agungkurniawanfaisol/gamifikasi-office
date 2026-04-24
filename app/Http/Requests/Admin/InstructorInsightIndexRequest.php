<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class InstructorInsightIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'window' => ['nullable', 'in:7d,30d,custom'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'level_id' => ['nullable', 'integer', 'exists:levels,id'],
            'min_attempts' => ['nullable', 'integer', 'min:1', 'max:200'],
        ];
    }
}

