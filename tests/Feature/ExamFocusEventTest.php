<?php

namespace Tests\Feature;

use App\Enums\ExamStatus;
use App\Enums\UserRole;
use App\Models\ExamSession;
use App\Models\Level;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExamFocusEventTest extends TestCase
{
    use RefreshDatabase;

    private function createExamSessionFor(User $student, ExamStatus $status): ExamSession
    {
        $level = Level::query()->create([
            'name' => 'Basic',
            'slug' => 'basic-focus',
            'order' => 1,
            'min_score_to_unlock' => 0,
            'description' => null,
        ]);
        $skill = SkillCategory::query()->create([
            'name' => 'Listening',
            'slug' => 'listening-focus',
            'description' => null,
            'icon' => null,
        ]);

        return ExamSession::query()->create([
            'user_id' => $student->id,
            'level_id' => $level->id,
            'skill_category_id' => $skill->id,
            'status' => $status,
            'randomization_seed' => 1,
            'started_at' => now(),
            'duration_seconds' => 600,
        ]);
    }

    public function test_student_can_record_focus_event_for_own_in_progress_session(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $session = $this->createExamSessionFor($student, ExamStatus::InProgress);

        $response = $this->actingAs($student)->postJson(
            route('student.exams.focus-events.store', $session),
            [
                'event_type' => 'visibility_hidden',
                'metadata' => [
                    'visibility_state' => 'hidden',
                ],
            ],
        );

        $response->assertOk()->assertJson(['ok' => true]);
        $this->assertDatabaseHas('focus_mode_violations', [
            'exam_session_id' => $session->id,
            'event_type' => 'visibility_hidden',
        ]);
    }

    public function test_other_student_cannot_record_focus_event(): void
    {
        $owner = User::factory()->create(['role' => UserRole::Student]);
        $other = User::factory()->create(['role' => UserRole::Student]);
        $session = $this->createExamSessionFor($owner, ExamStatus::InProgress);

        $this->actingAs($other)->postJson(
            route('student.exams.focus-events.store', $session),
            [
                'event_type' => 'window_blur',
            ],
        )->assertForbidden();
    }

    public function test_cannot_record_focus_event_when_session_not_in_progress(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $session = $this->createExamSessionFor($student, ExamStatus::Completed);

        $this->actingAs($student)->postJson(
            route('student.exams.focus-events.store', $session),
            [
                'event_type' => 'visibility_hidden',
            ],
        )->assertForbidden();
    }

    public function test_focus_event_validation_rejects_invalid_event_type(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $session = $this->createExamSessionFor($student, ExamStatus::InProgress);

        $this->actingAs($student)->postJson(
            route('student.exams.focus-events.store', $session),
            [
                'event_type' => 'not_a_real_type',
            ],
        )->assertUnprocessable();
    }
}
