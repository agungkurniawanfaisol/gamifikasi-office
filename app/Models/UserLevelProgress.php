<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class UserLevelProgress extends Model
{
    use HasFactory;

    protected $table = 'user_level_progress';

    protected $fillable = [
        'user_id',
        'level_id',
        'skill_category_id',
        'is_unlocked',
        'unlocked_at',
        'best_score',
        'attempts_count',
        'last_attempt_at',
    ];

    protected function casts(): array
    {
        return [
            'is_unlocked' => 'boolean',
            'unlocked_at' => 'datetime',
            'best_score' => 'integer',
            'attempts_count' => 'integer',
            'last_attempt_at' => 'datetime',
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

    public function scopeUnlocked(Builder $query): Builder
    {
        return $query->where('is_unlocked', true);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
