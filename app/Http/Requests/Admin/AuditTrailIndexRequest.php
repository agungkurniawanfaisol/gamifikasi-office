<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AuditTrailIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && ($user->isAdmin() || $user->isLecturer());
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'user_role' => ['nullable', 'string', Rule::in(['admin', 'lecturer', 'student'])],
            'event_type' => ['nullable', 'string', Rule::in(['ui_click', 'navigation', 'backend_action', 'exam_event', 'score_event'])],
            'event_key' => ['nullable', 'string', 'max:120'],
            'route_name' => ['nullable', 'string', 'max:150'],
            'menu_key' => ['nullable', 'string', 'max:120'],
            'exam_session_id' => ['nullable', 'integer', 'exists:exam_sessions,id'],
            'score_min' => ['nullable', 'integer'],
            'score_max' => ['nullable', 'integer', 'gte:score_min'],
        ];
    }
}
