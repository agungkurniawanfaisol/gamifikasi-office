<?php

namespace Database\Seeders;

use App\Services\Questions\QuestionSeedService;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    private const DEFAULT_TARGET = 1000;

    public function __construct(
        private readonly QuestionSeedService $questionSeedService,
    ) {
    }

    public function run(): void
    {
        $target = (int) (env('SEED_QUESTION_TARGET', self::DEFAULT_TARGET));
        $target = max($target, self::DEFAULT_TARGET);

        $this->questionSeedService->seed(
            targetCount: $target,
            truncate: false,
            progress: fn (string $message): ?bool => $this->command?->info($message),
        );
    }
}

