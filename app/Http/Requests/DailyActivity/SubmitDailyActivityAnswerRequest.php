<?php

namespace App\Http\Requests\DailyActivity;

use Illuminate\Foundation\Http\FormRequest;

class SubmitDailyActivityAnswerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStudent() === true;
    }

    public function rules(): array
    {
        return [
            'question_id' => ['required', 'integer', 'exists:questions,id'],
            'selected_option_id' => ['required', 'integer', 'exists:question_options,id'],
        ];
    }
}
