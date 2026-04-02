<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExamHeaderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isAdmin() || $user->isLecturer());
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'level_id' => ['required', 'integer', 'exists:levels,id'],
            'total_duration_minutes' => ['required', 'integer', 'min:1', 'max:600'],
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.question_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('questions', 'id')->where(function ($query) {
                    return $query
                        ->where('level_id', (int) $this->input('level_id'))
                        ->where('is_active', true);
                }),
            ],
            'items.*.duration_per_question' => ['required', 'integer', 'min:1', 'max:120'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $items = $this->input('items', []);
            $totalDuration = (int) $this->input('total_duration_minutes', 0);

            if (! is_array($items) || $items === []) {
                return;
            }

            $sum = collect($items)->sum(fn ($item) => (int) ($item['duration_per_question'] ?? 0));
            if ($sum !== $totalDuration) {
                $validator->errors()->add(
                    'total_duration_minutes',
                    'Total duration must equal the sum of each question duration.'
                );
            }
        });
    }
}

