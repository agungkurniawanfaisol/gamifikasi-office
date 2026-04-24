<?php

namespace App\Http\Requests\DailyActivity;

use Illuminate\Foundation\Http\FormRequest;

class CompleteDailyActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isStudent() === true;
    }

    public function rules(): array
    {
        return [];
    }
}
