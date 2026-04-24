<?php

namespace App\Services\DailyActivity;

use App\Enums\BadgeCategory;
use App\Enums\BadgeCriteriaType;
use App\Models\Badge;
use App\Models\UserBadge;
use App\Models\UserRewardPoint;
use Illuminate\Support\Carbon;

class WeeklyRewardService
{
    public const WEEKLY_BADGE_SLUG = 'weekly-daily-activity';

    public const WEEKLY_POINTS = 100;

    public function grantWeeklyReward(int $userId, Carbon $activityDate, int $streak): bool
    {
        $badge = $this->ensureWeeklyBadge();

        UserBadge::query()->firstOrCreate(
            [
                'user_id' => $userId,
                'badge_id' => $badge->id,
            ],
            [
                'earned_at' => now(),
            ],
        );

        $point = UserRewardPoint::query()->firstOrCreate(
            [
                'user_id' => $userId,
                'source_key' => 'daily-activity-weekly-'.$activityDate->toDateString(),
            ],
            [
                'source' => 'daily_activity_weekly',
                'points' => self::WEEKLY_POINTS,
                'metadata' => [
                    'activity_date' => $activityDate->toDateString(),
                    'streak' => $streak,
                ],
            ],
        );

        return $point->wasRecentlyCreated;
    }

    private function ensureWeeklyBadge(): Badge
    {
        return Badge::query()->firstOrCreate(
            [
                'slug' => self::WEEKLY_BADGE_SLUG,
            ],
            [
                'name' => 'Weekly Daily Activity Champion',
                'description' => 'Menyelesaikan Daily Activity selama 7 hari berturut-turut.',
                'image_path' => null,
                'category' => BadgeCategory::Streak->value,
                'criteria_type' => BadgeCriteriaType::TotalSessions->value,
                'criteria_value' => 7,
                'is_active' => true,
            ],
        );
    }
}
