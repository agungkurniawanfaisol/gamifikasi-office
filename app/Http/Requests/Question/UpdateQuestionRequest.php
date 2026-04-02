<?php

namespace App\Http\Requests\Question;

use App\Enums\QuestionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin() || $this->user()->isLecturer();
    }

    public function rules(): array
    {
        return [
            'skill_category_id' => ['sometimes', 'integer', 'exists:skill_categories,id'],
            'level_id' => ['sometimes', 'integer', 'exists:levels,id'],
            'type' => ['sometimes', 'string', Rule::enum(QuestionType::class)],
            'question_text' => ['sometimes', 'string', 'max:10000'],
            'narrative_text' => ['nullable', 'string', 'max:5000'],
            'explanation' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
            'options' => ['sometimes', 'array', 'min:2', 'max:6'],
            'options.*.id' => ['sometimes', 'integer', 'exists:question_options,id'],
            'options.*.option_text' => ['required_with:options', 'string', 'max:2000'],
            'options.*.is_correct' => ['required_with:options', 'boolean'],
            'media' => ['nullable', 'array', 'max:5'],
            'media.*.file' => ['sometimes', 'file', 'max:20480', 'mimes:jpg,jpeg,png,gif,mp3,wav,ogg,mp4,webm'],
            'media.*.media_type' => ['required_with:media.*.file', 'string', Rule::in(['image', 'audio', 'video'])],
            'remove_media_ids' => ['sometimes', 'array'],
            'remove_media_ids.*' => ['integer', 'exists:question_media,id'],
        ];
    }
}
