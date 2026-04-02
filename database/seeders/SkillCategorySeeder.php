<?php

namespace Database\Seeders;

use App\Models\SkillCategory;
use Illuminate\Database\Seeder;

class SkillCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Listening',
                'slug' => 'listening',
                'description' => 'Improve your listening comprehension through audio-based exercises.',
                'icon' => 'headphones',
            ],
            [
                'name' => 'Writing',
                'slug' => 'writing',
                'description' => 'Develop your writing skills with structured essay and composition tasks.',
                'icon' => 'pencil',
            ],
            [
                'name' => 'Reading',
                'slug' => 'reading',
                'description' => 'Enhance your reading comprehension with diverse text-based exercises.',
                'icon' => 'book-open',
            ],
        ];

        foreach ($categories as $category) {
            SkillCategory::updateOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
