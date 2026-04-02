<?php

namespace App\Models;

use App\Enums\ExamStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;

class ExamSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'level_id',
        'skill_category_id',
        'status',
        'randomization_seed',
        'total_score',
        'max_possible_score',
        'started_at',
        'completed_at',
        'duration_seconds',
    ];

    protected function casts(): array
    {
        return [
            'status' => ExamStatus::class,
            'randomization_seed' => 'integer',
            'total_score' => 'integer',
            'max_possible_score' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'duration_seconds' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function skillCategory(): BelongsTo
    {
        return $this->belongsTo(SkillCategory::class);
    }

    public function sessionQuestions(): HasMany
    {
        return $this->hasMany(ExamSessionQuestion::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(ExamAnswer::class);
    }

    public function feedback(): HasOne
    {
        return $this->hasOne(ExamSessionFeedback::class);
    }

    public function focusViolations(): HasMany
    {
        return $this->hasMany(FocusModeViolation::class);
    }

    public function scopeInProgress(Builder $query): Builder
    {
        return $query->where('status', ExamStatus::InProgress);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', ExamStatus::Completed);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeResumable(Builder $query, int $userId, int $skillCategoryId): Builder
    {
        return $query->where('user_id', $userId)
            ->where('skill_category_id', $skillCategoryId)
            ->where('status', ExamStatus::InProgress);
    }

    public function isInProgress(): bool
    {
        return $this->status === ExamStatus::InProgress;
    }

    public function isCompleted(): bool
    {
        return $this->status === ExamStatus::Completed;
    }
}
