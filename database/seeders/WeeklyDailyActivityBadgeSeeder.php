<?php

namespace Database\Seeders;

use App\Enums\BadgeCategory;
use App\Enums\BadgeCriteriaType;
use App\Models\Badge;
use Illuminate\Database\Seeder;

class WeeklyDailyActivityBadgeSeeder extends Seeder
{
    public function run(): void
    {
        Badge::query()->updateOrCreate(
            ['slug' => 'weekly-daily-activity'],
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
