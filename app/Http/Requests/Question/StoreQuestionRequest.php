<?php

namespace App\Http\Requests\Question;

use App\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin() || $this->user()->isLecturer();
    }

    public function rules(): array
    {
        return [
            'skill_category_id' => ['required', 'integer', 'exists:skill_categories,id'],
            'level_id' => ['required', 'integer', 'exists:levels,id'],
            'type' => ['required', 'string', Rule::enum(QuestionType::class)],
            'question_text' => ['required', 'string', 'max:10000'],
            'narrative_text' => ['nullable', 'string', 'max:5000'],
            'explanation' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
            'options' => ['required_if:type,multiple_choice,true_false', 'array', 'min:2', 'max:6'],
            'options.*.option_text' => ['required_with:options', 'string', 'max:2000'],
            'options.*.is_correct' => ['required_with:options', 'boolean'],
            'media' => ['nullable', 'array', 'max:5'],
            'media.*.file' => ['required_with:media', 'file', 'max:20480', 'mimes:jpg,jpeg,png,gif,mp3,wav,ogg,mp4,webm'],
            'media.*.media_type' => ['required_with:media', 'string', Rule::in(['image', 'audio', 'video'])],
        ];
    }

    public function messages(): array
    {
        return [
            'options.required_if' => 'Options are required for multiple choice and true/false questions.',
            'options.min' => 'At least 2 options are required.',
            'media.*.file.max' => 'Each media file must not exceed 20MB.',
        ];
    }
}
