<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'role',
        'avatar',
        'phone_number',
        'gender',
        'birth_date',
        'address',
        'bio',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'birth_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function examSessions(): HasMany
    {
        return $this->hasMany(ExamSession::class);
    }

    public function userBadges(): HasMany
    {
        return $this->hasMany(UserBadge::class);
    }

    public function levelProgress(): HasMany
    {
        return $this->hasMany(UserLevelProgress::class);
    }

    public function dailyGoals(): HasMany
    {
        return $this->hasMany(DailyGoal::class);
    }

    public function dailyActivityLogs(): HasMany
    {
        return $this->hasMany(DailyActivityLog::class);
    }

    public function rewardPoints(): HasMany
    {
        return $this->hasMany(UserRewardPoint::class);
    }

    public function priorityPracticeSessions(): HasMany
    {
        return $this->hasMany(PriorityPracticeSession::class);
    }

    public function createdQuestions(): HasMany
    {
        return $this->hasMany(Question::class, 'created_by');
    }

    public function aiFeedbacks(): HasMany
    {
        return $this->hasMany(AiFeedback::class);
    }

    public function examHeaders(): HasMany
    {
        return $this->hasMany(ExamHeader::class, 'creator_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeByRole(Builder $query, UserRole $role): Builder
    {
        return $query->where('role', $role);
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isLecturer(): bool
    {
        return $this->role === UserRole::Lecturer;
    }

    public function isStudent(): bool
    {
        return $this->role === UserRole::Student;
    }
}
