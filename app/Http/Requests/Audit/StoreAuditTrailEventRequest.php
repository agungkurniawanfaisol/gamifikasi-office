<?php

namespace App\Http\Requests\Audit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAuditTrailEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'event_type' => ['required', 'string', Rule::in(['ui_click', 'navigation', 'backend_action', 'exam_event', 'score_event'])],
            'event_key' => ['required', 'string', 'max:120'],
            'page_url' => ['nullable', 'string', 'max:2000'],
            'menu_key' => ['nullable', 'string', 'max:120'],
            'element_key' => ['nullable', 'string', 'max:180'],
            'click_x' => ['nullable', 'integer', 'min:0'],
            'click_y' => ['nullable', 'integer', 'min:0'],
            'subject_type' => ['nullable', 'string', 'max:120'],
            'subject_id' => ['nullable', 'integer', 'min:1'],
            'subject_label' => ['nullable', 'string', 'max:180'],
            'exam_session_id' => ['nullable', 'integer', 'exists:exam_sessions,id'],
            'exam_header_id' => ['nullable', 'integer', 'exists:exam_headers,id'],
            'score_before' => ['nullable', 'integer'],
            'score_after' => ['nullable', 'integer'],
            'score_delta' => ['nullable', 'integer'],
            'metadata' => ['nullable', 'array'],
            'occurred_at' => ['nullable', 'date'],
        ];
    }
}
