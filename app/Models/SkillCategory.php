<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SkillCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
    ];

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function examSessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }

    public function userLevelProgress(): HasMany
    {
        return $this->hasMany(UserLevelProgress::class);
    }

    public function badges(): HasMany
    {
        return $this->hasMany(Badge::class);
    }

    public function scoreMatrices(): HasMany
    {
        return $this->hasMany(ScoreMatrix::class);
    }
}
