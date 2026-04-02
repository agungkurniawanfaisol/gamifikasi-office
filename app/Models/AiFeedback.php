<?php

namespace App\Models;

use App\Enums\AiFeedbackStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class AiFeedback extends Model
{
    use HasFactory;

    protected $table = 'ai_feedbacks';

    protected $fillable = [
        'exam_answer_id',
        'user_id',
        'feedback_text',
        'grammar_score',
        'coherence_score',
        'vocabulary_score',
        'status',
        'reviewed_by',
        'reviewed_at',
        'reviewer_notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => AiFeedbackStatus::class,
            'grammar_score' => 'integer',
            'coherence_score' => 'integer',
            'vocabulary_score' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function examAnswer(): BelongsTo
    {
        return $this->belongsTo(ExamAnswer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', AiFeedbackStatus::Pending);
    }

    public function scopeGenerated(Builder $query): Builder
    {
        return $query->where('status', AiFeedbackStatus::Generated);
    }

    public function scopeNeedsReview(Builder $query): Builder
    {
        return $query->whereIn('status', [AiFeedbackStatus::Pending, AiFeedbackStatus::Generated]);
    }
}
