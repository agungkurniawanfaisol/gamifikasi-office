<?php

namespace App\Models;

use App\Enums\QuestionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'skill_category_id',
        'level_id',
        'type',
        'question_text',
        'narrative_text',
        'explanation',
        'created_by',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => QuestionType::class,
            'is_active' => 'boolean',
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

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(QuestionMedia::class);
    }

    public function examAnswers(): HasMany
    {
        return $this->hasMany(ExamAnswer::class);
    }

    public function examQuestions(): HasMany
    {
        return $this->hasMany(ExamQuestion::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeBySkill(Builder $query, int $skillCategoryId): Builder
    {
        return $query->where('skill_category_id', $skillCategoryId);
    }

    public function scopeByLevel(Builder $query, int $levelId): Builder
    {
        return $query->where('level_id', $levelId);
    }

    public function scopeByType(Builder $query, QuestionType $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeForExam(Builder $query, int $skillCategoryId, int $levelId): Builder
    {
        return $query->where('skill_category_id', $skillCategoryId)
            ->where('level_id', $levelId)
            ->where('is_active', true);
    }
}
