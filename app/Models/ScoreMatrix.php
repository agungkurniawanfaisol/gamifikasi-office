<?php

namespace App\Models;

use App\Enums\QuestionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreMatrix extends Model
{
    use HasFactory;

    protected $fillable = [
        'skill_category_id',
        'level_id',
        'question_type',
        'correct_score',
        'partial_score',
        'wrong_score',
        'time_bonus_enabled',
        'time_bonus_seconds',
        'time_bonus_score',
    ];

    protected function casts(): array
    {
        return [
            'question_type' => QuestionType::class,
            'correct_score' => 'integer',
            'partial_score' => 'integer',
            'wrong_score' => 'integer',
            'time_bonus_enabled' => 'boolean',
            'time_bonus_seconds' => 'integer',
            'time_bonus_score' => 'integer',
        ];
    }

    public function skillCategory(): BelongsTo
    {
        return $this->belongsTo(SkillCategory::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }
}
