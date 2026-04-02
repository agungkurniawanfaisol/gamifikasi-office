<?php

namespace Database\Seeders;

use App\Models\Level;
use Illuminate\Database\Seeder;

class LevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'order' => 1,
                'min_score_to_unlock' => 0,
                'description' => 'Foundation level for beginners. Start your learning journey here.',
            ],
            [
                'name' => 'Intermediate',
                'slug' => 'intermediate',
                'order' => 2,
                'min_score_to_unlock' => 70,
                'description' => 'Build on your fundamentals with more challenging exercises.',
            ],
            [
                'name' => 'Advanced',
                'slug' => 'advanced',
                'order' => 3,
                'min_score_to_unlock' => 80,
                'description' => 'Master complex topics and demonstrate expert-level understanding.',
            ],
        ];

        foreach ($levels as $level) {
            Level::updateOrCreate(['slug' => $level['slug']], $level);
        }
    }
}
