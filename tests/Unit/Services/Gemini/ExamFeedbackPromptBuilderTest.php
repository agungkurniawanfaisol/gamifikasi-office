<?php

namespace Tests\Unit\Services\Gemini;

use App\Services\Gemini\ExamFeedbackPromptBuilder;
use Tests\TestCase;

class ExamFeedbackPromptBuilderTest extends TestCase
{
    public function test_it_builds_a_coach_style_prompt_with_context(): void
    {
        $builder = new ExamFeedbackPromptBuilder;

        $prompt = $builder->build(
            studentName: 'Agung',
            examName: 'Level Intermediate',
            score: 18,
            maxScore: 25,
            percentage: 72,
            strengths: ['Listening comprehension', 'Vocabulary context'],
            weaknesses: ['Grammar tense consistency'],
        );

        $this->assertStringContainsString('Nama siswa: Agung', $prompt);
        $this->assertStringContainsString('Nama ujian/level: Level Intermediate', $prompt);
        $this->assertStringContainsString('Skor: 18/25 (72%)', $prompt);
        $this->assertStringContainsString('Kekuatan: Listening comprehension, Vocabulary context', $prompt);
        $this->assertStringContainsString('Area peningkatan: Grammar tense consistency', $prompt);
        $this->assertStringContainsString('tanpa markdown, tanpa bullet, tanpa emoji', $prompt);
    }
}
