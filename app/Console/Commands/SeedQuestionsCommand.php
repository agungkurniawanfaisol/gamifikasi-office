<?php

namespace App\Console\Commands;

use App\Services\Questions\QuestionSeedService;
use Illuminate\Console\Command;

class SeedQuestionsCommand extends Command
{
    protected $signature = 'app:seed-questions
        {--count=1000 : Number of questions to generate}
        {--truncate : Delete existing questions/options before seeding}';

    protected $description = 'Seed randomized questions for bank soal performance testing.';

    public function __construct(
        private readonly QuestionSeedService $questionSeedService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $count = (int) $this->option('count');
        if ($count < 1) {
            $this->error('The --count option must be at least 1.');

            return self::FAILURE;
        }

        $truncate = (bool) $this->option('truncate');

        $this->info("Seeding {$count} randomized questions...");
        if ($truncate) {
            $this->warn('Truncate mode enabled: existing question data will be deleted first.');
        }

        $this->questionSeedService->seed(
            targetCount: $count,
            truncate: $truncate,
            progress: fn (string $message): ?bool => $this->line($message),
        );

        $this->info('Question seeding completed successfully.');

        return self::SUCCESS;
    }
}

