<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class DailyGoal extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'target_sessions',
        'target_score',
        'completed_sessions',
        'achieved_score',
        'is_achieved',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'target_sessions' => 'integer',
            'target_score' => 'integer',
            'completed_sessions' => 'integer',
            'achieved_score' => 'integer',
            'is_achieved' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->where('date', $date);
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->where('date', now()->toDateString());
    }

    public function scopeAchieved(Builder $query): Builder
    {
        return $query->where('is_achieved', true);
    }
}
