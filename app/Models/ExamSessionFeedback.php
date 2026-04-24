<?php

namespace App\Models;

use App\Enums\ExamSessionFeedbackAiStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamSessionFeedback extends Model
{
    protected $table = 'exam_session_feedback';

    protected $fillable = [
        'exam_session_id',
        'user_id',
        'completion_message',
        'ai_status',
        'ai_model',
        'ai_error_message',
        'ai_generated_at',
        'rating',
        'testimonial',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'ai_status' => ExamSessionFeedbackAiStatus::class,
            'ai_generated_at' => 'datetime',
            'rating' => 'integer',
            'submitted_at' => 'datetime',
        ];
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isSubmitted(): bool
    {
        return $this->submitted_at !== null;
    }
}
