<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExamHeader extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'level_id',
        'total_duration_minutes',
        'creator_id',
    ];

    protected function casts(): array
    {
        return [
            'level_id' => 'integer',
            'total_duration_minutes' => 'integer',
            'creator_id' => 'integer',
        ];
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function examQuestions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class);
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'exam_questions')
            ->withPivot(['duration_per_question', 'sort_order'])
            ->withTimestamps()
            ->orderByPivot('sort_order');
    }

    public function scopeForLevel(Builder $query, int $levelId): Builder
    {
        return $query->where('level_id', $levelId);
    }

    public function scopeByCreator(Builder $query, int $creatorId): Builder
    {
        return $query->where('creator_id', $creatorId);
    }
}

