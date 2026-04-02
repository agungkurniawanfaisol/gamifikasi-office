<?php

namespace App\Services\Questions;

use App\Actions\Questions\GenerateQuestionSeedPayloadAction;
use App\Enums\QuestionType;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class QuestionSeedService
{
    public function __construct(
        private readonly GenerateQuestionSeedPayloadAction $generator,
    ) {
    }

    /**
     * @param  callable(string):void|null  $progress
     */
    public function seed(int $targetCount, bool $truncate = false, ?callable $progress = null): void
    {
        mt_srand(20260402);

        $skillCategories = DB::table('skill_categories')
            ->select(['id', 'name'])
            ->orderBy('id')
            ->get();

        $levels = DB::table('levels')
            ->select(['id', 'name'])
            ->orderBy('id')
            ->get();

        if ($skillCategories->isEmpty() || $levels->isEmpty()) {
            throw new RuntimeException('Cannot seed questions: skill_categories or levels are empty.');
        }

        $creatorId = DB::table('users')
            ->select(['id'])
            ->whereIn('role', ['admin', 'lecturer'])
            ->where('is_active', true)
            ->orderBy('id')
            ->value('id');

        if (! $creatorId) {
            throw new RuntimeException('Cannot seed questions: no active admin/lecturer user found.');
        }

        if ($truncate) {
            DB::transaction(function (): void {
                DB::table('question_options')->delete();
                DB::table('questions')->delete();
            });
        }

        $batchSize = 100;
        $targetCount = max(1, $targetCount);

        $existingCount = (int) DB::table('questions')->count();
        $remainingToInsert = max(0, $targetCount - $existingCount);
        if ($remainingToInsert === 0) {
            if ($progress !== null) {
                $progress("Questions already at target ({$existingCount}/{$targetCount}). Skipping.");
            }

            return;
        }

        $combinations = [];
        foreach ($skillCategories as $skill) {
            foreach ($levels as $level) {
                $combinations[] = [
                    'skill_id' => $skill->id,
                    'skill_name' => $skill->name,
                    'level_id' => $level->id,
                    'level_name' => $level->name,
                ];
            }
        }

        $types = QuestionType::cases();
        $now = Carbon::now();
        $inserted = 0;

        while ($inserted < $remainingToInsert) {
            $remaining = $remainingToInsert - $inserted;
            $batchCount = min($batchSize, $remaining);

            DB::transaction(function () use (
                $batchCount,
                $combinations,
                $types,
                $creatorId,
                $now,
                $existingCount,
                &$inserted
            ): void {
                for ($i = 0; $i < $batchCount; $i++) {
                    $sequence = $existingCount + $inserted + $i;
                    $combo = $combinations[$sequence % count($combinations)];
                    $type = $types[$sequence % count($types)];

                    $payload = $this->generator->execute($type, [
                        'skill' => $combo['skill_name'],
                        'level' => $combo['level_name'],
                        'variant' => $sequence + 1,
                    ]);

                    $questionId = DB::table('questions')->insertGetId([
                        'skill_category_id' => $combo['skill_id'],
                        'level_id' => $combo['level_id'],
                        'type' => $type->value,
                        'question_text' => $payload['question_text'],
                        'narrative_text' => $payload['narrative_text'],
                        'explanation' => $payload['explanation'],
                        'created_by' => $creatorId,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);

                    if ($payload['options'] !== []) {
                        $rows = [];
                        foreach ($payload['options'] as $option) {
                            $rows[] = [
                                'question_id' => $questionId,
                                'option_text' => $option['option_text'],
                                'is_correct' => (bool) $option['is_correct'],
                                'order' => (int) $option['order'],
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }

                        DB::table('question_options')->insert($rows);
                    }
                }
            });

            $inserted += $batchCount;
            if ($progress !== null) {
                $progress("Seeded questions: {$inserted}/{$remainingToInsert} (total {$existingCount}+{$inserted}/{$targetCount})");
            }
        }
    }
}

