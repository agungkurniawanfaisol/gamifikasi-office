<?php

namespace App\Actions\ExamHeaders;

use App\Models\ExamHeader;
use Illuminate\Support\Facades\DB;

class CreateExamHeaderAction
{
    /**
     * @param  array{
     *   title:string,
     *   level_id:int,
     *   total_duration_minutes:int,
     *   items:array<int,array{question_id:int,duration_per_question:int}>
     * }  $payload
     */
    public function execute(array $payload, int $creatorId): ExamHeader
    {
        return DB::transaction(function () use ($payload, $creatorId): ExamHeader {
            $header = ExamHeader::query()->create([
                'title' => $payload['title'],
                'level_id' => $payload['level_id'],
                'total_duration_minutes' => $payload['total_duration_minutes'],
                'creator_id' => $creatorId,
            ]);

            $rows = [];
            foreach (array_values($payload['items']) as $index => $item) {
                $rows[] = [
                    'exam_header_id' => $header->id,
                    'question_id' => (int) $item['question_id'],
                    'duration_per_question' => (int) $item['duration_per_question'],
                    'sort_order' => $index + 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            DB::table('exam_questions')->insert($rows);

            return $header;
        });
    }
}

