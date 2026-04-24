<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'activity_date',
        'question_ids',
        'answered_count',
        'correct_count',
        'is_completed',
        'streak_after_day',
        'completed_at',
        'reward_granted_at',
    ];

    protected function casts(): array
    {
        return [
            'activity_date' => 'date',
            'question_ids' => 'array',
            'answered_count' => 'integer',
            'correct_count' => 'integer',
            'is_completed' => 'boolean',
            'streak_after_day' => 'integer',
            'completed_at' => 'datetime',
            'reward_granted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(DailyActivityAnswer::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForDate(Builder $query, string $activityDate): Builder
    {
        return $query->where('activity_date', $activityDate);
    }
}
