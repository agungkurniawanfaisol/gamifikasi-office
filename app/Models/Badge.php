<?php

namespace App\Models;

use App\Enums\BadgeCategory;
use App\Enums\BadgeCriteriaType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Badge extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'image_path',
        'category',
        'criteria_type',
        'criteria_value',
        'skill_category_id',
        'level_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'category' => BadgeCategory::class,
            'criteria_type' => BadgeCriteriaType::class,
            'criteria_value' => 'integer',
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

    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
