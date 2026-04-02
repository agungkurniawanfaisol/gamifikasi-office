<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            LevelSeeder::class,
            SkillCategorySeeder::class,
            UserSeeder::class,
            QuestionSeeder::class,
        ]);
    }
}
