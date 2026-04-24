<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PriorityPracticeSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'skill_category_id',
        'status',
        'question_ids',
        'total_questions',
        'answered_count',
        'correct_count',
        'generated_at',
        'expires_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'question_ids' => 'array',
            'total_questions' => 'integer',
            'answered_count' => 'integer',
            'correct_count' => 'integer',
            'generated_at' => 'datetime',
            'expires_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skillCategory(): BelongsTo
    {
        return $this->belongsTo(SkillCategory::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(PriorityPracticeAnswer::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }
}
