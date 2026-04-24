<?php

namespace Tests\Unit\Jobs;

use App\Actions\ExamSessions\EnsureExamSessionFeedbackAction;
use App\Enums\ExamSessionFeedbackAiStatus;
use App\Enums\UserRole;
use App\Jobs\GenerateExamSessionFeedbackJob;
use App\Models\ExamSession;
use App\Models\Level;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GenerateExamSessionFeedbackJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_marks_feedback_ready_when_gemini_returns_text(): void
    {
        config()->set('services.gemini.api_key', 'test-key');
        config()->set('services.gemini.model', 'gemini-2.5-flash');
        config()->set('services.gemini.fallback_models', ['gemini-2.0-flash']);

        Http::fake([
            '*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'Kamu sudah bekerja keras. Lanjutkan dengan dua sesi latihan fokus minggu ini.'],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $session = $this->createCompletedSession();
        app(EnsureExamSessionFeedbackAction::class)->execute($session);

        app()->call([new GenerateExamSessionFeedbackJob((int) $session->id), 'handle']);

        $feedback = $session->feedback()->firstOrFail()->refresh();
        $this->assertSame(ExamSessionFeedbackAiStatus::Ready, $feedback->ai_status);
        $this->assertNotNull($feedback->ai_generated_at);
        $this->assertNull($feedback->ai_error_message);
        $this->assertSame('gemini-2.5-flash', $feedback->ai_model);
        $this->assertStringContainsString('Kamu sudah bekerja keras', $feedback->completion_message);
    }

    public function test_job_uses_fallback_model_when_primary_hits_quota_limit(): void
    {
        config()->set('services.gemini.api_key', 'test-key');
        config()->set('services.gemini.model', 'gemini-2.5-flash');
        config()->set('services.gemini.fallback_models', ['gemini-2.0-flash']);

        Http::fake([
            '*' => function (\Illuminate\Http\Client\Request $request) {
                if (str_contains($request->url(), 'models/gemini-2.5-flash:generateContent')) {
                    return Http::response(['error' => ['message' => 'quota exceeded']], 429);
                }

                return Http::response([
                    'candidates' => [
                        [
                            'content' => [
                                'parts' => [
                                    ['text' => 'Model cadangan berhasil membuat feedback yang tetap suportif.'],
                                ],
                            ],
                        ],
                    ],
                ], 200);
            },
        ]);

        $session = $this->createCompletedSession();
        app(EnsureExamSessionFeedbackAction::class)->execute($session);

        app()->call([new GenerateExamSessionFeedbackJob((int) $session->id), 'handle']);

        $feedback = $session->feedback()->firstOrFail()->refresh();
        $this->assertSame(ExamSessionFeedbackAiStatus::Ready, $feedback->ai_status);
        $this->assertSame('gemini-2.0-flash', $feedback->ai_model);
        $this->assertNull($feedback->ai_error_message);
        $this->assertStringContainsString('Model cadangan berhasil', $feedback->completion_message);
    }

    public function test_job_marks_feedback_failed_and_uses_fallback_when_all_models_fail(): void
    {
        config()->set('services.gemini.api_key', 'test-key');
        config()->set('services.gemini.model', 'gemini-2.5-flash');
        config()->set('services.gemini.fallback_models', ['gemini-2.0-flash']);

        Http::fake([
            '*' => Http::response(['error' => ['message' => 'quota exceeded']], 429),
        ]);

        $session = $this->createCompletedSession();
        app(EnsureExamSessionFeedbackAction::class)->execute($session);

        app()->call([new GenerateExamSessionFeedbackJob((int) $session->id), 'handle']);

        $feedback = $session->feedback()->firstOrFail()->refresh();
        $this->assertSame(ExamSessionFeedbackAiStatus::Failed, $feedback->ai_status);
        $this->assertNotNull($feedback->ai_generated_at);
        $this->assertNotNull($feedback->ai_error_message);
        $this->assertSame('gemini-2.5-flash', $feedback->ai_model);
        $this->assertStringContainsString('Skor kamu saat ini', $feedback->completion_message);
    }

    private function createCompletedSession(): ExamSession
    {
        $level = Level::query()->create([
            'name' => 'Basic',
            'slug' => 'basic',
            'order' => 1,
            'min_score_to_unlock' => 0,
            'description' => null,
        ]);

        $student = User::factory()->create(['role' => UserRole::Student]);
        $skillCategory = SkillCategory::query()->create([
            'name' => 'Reading',
            'slug' => 'reading',
            'description' => null,
            'icon' => null,
        ]);

        return ExamSession::query()->create([
            'user_id' => $student->id,
            'level_id' => $level->id,
            'skill_category_id' => $skillCategory->id,
            'status' => 'completed',
            'randomization_seed' => 12345,
            'total_score' => 8,
            'max_possible_score' => 10,
            'started_at' => now()->subMinutes(10),
            'completed_at' => now(),
            'duration_seconds' => 600,
        ]);
    }
}
