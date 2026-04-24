<?php

namespace Tests\Feature;

use App\Enums\ExamStatus;
use App\Enums\UserRole;
use App\Models\Level;
use App\Models\Question;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentMonitoringTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_and_lecturer_can_access_monitoring_index(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
        ]);
        $lecturer = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get(route('admin.student-monitoring.index'))
            ->assertOk();

        $this->actingAs($lecturer)
            ->get(route('admin.student-monitoring.index'))
            ->assertOk();

        $this->actingAs($student)
            ->get(route('admin.student-monitoring.index'))
            ->assertForbidden();
    }

    public function test_filter_by_date_and_source_returns_expected_attempts(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
        ]);
        $lecturer = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);

        [$level, $skill] = $this->seedBaseCatalog();
        [$question, $correctOptionId, $wrongOptionId] = $this->seedQuestionWithOptions(
            $level->id,
            $skill->id,
            $lecturer->id,
        );

        $this->seedExamAttempt(
            $student->id,
            $level->id,
            $skill->id,
            $question->id,
            $correctOptionId,
            true,
            now(),
        );

        $this->seedDailyAttempt(
            $student->id,
            $question->id,
            $wrongOptionId,
            false,
            now()->subDay(),
        );

        $today = now()->toDateString();
        $response = $this->actingAs($admin)->get(route('admin.student-monitoring.index', [
            'source' => 'exam',
            'from' => $today,
            'to' => $today,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StudentMonitoring/Index')
            ->has('attempts.data', 1)
            ->where('attempts.data.0.source', 'exam')
            ->where('attempts.data.0.student_id', $student->id));
    }

    public function test_default_source_all_combines_exam_and_daily_attempts(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
        ]);
        $lecturer = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);

        [$level, $skill] = $this->seedBaseCatalog();
        [$question, $correctOptionId, $wrongOptionId] = $this->seedQuestionWithOptions(
            $level->id,
            $skill->id,
            $lecturer->id,
        );

        $this->seedExamAttempt(
            $student->id,
            $level->id,
            $skill->id,
            $question->id,
            $correctOptionId,
            true,
            now(),
        );

        $this->seedDailyAttempt(
            $student->id,
            $question->id,
            $wrongOptionId,
            false,
            now(),
        );

        $today = now()->toDateString();
        $response = $this->actingAs($admin)->get(route('admin.student-monitoring.index', [
            'from' => $today,
            'to' => $today,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StudentMonitoring/Index')
            ->where('summary.attempt_count', 2)
            ->where('summary.exam_attempt_count', 1)
            ->where('summary.daily_attempt_count', 1)
            ->has('attempts.data', 2));
    }

    public function test_monitoring_detail_shows_question_and_correctness(): void
    {
        $lecturer = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
        ]);
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);

        [$level, $skill] = $this->seedBaseCatalog();
        [$question, $correctOptionId, $wrongOptionId] = $this->seedQuestionWithOptions(
            $level->id,
            $skill->id,
            $lecturer->id,
        );

        $this->seedExamAttempt(
            $student->id,
            $level->id,
            $skill->id,
            $question->id,
            $wrongOptionId,
            false,
            now(),
        );

        $today = now()->toDateString();
        $response = $this->actingAs($admin)->get(route('admin.student-monitoring.show', [
            'student' => $student->id,
            'source' => 'exam',
            'from' => $today,
            'to' => $today,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StudentMonitoring/Index')
            ->where('selectedStudent.id', $student->id)
            ->has('details', 1)
            ->where('details.0.source', 'exam')
            ->where('details.0.question', 'Monitoring question')
            ->where('details.0.correct_option', 'Correct answer')
            ->where('details.0.is_correct', false));
    }

    public function test_monitoring_detail_source_all_combines_exam_and_daily_without_error(): void
    {
        $lecturer = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);
        $admin = User::factory()->create([
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
        ]);
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);

        [$level, $skill] = $this->seedBaseCatalog();
        [$question, $correctOptionId, $wrongOptionId] = $this->seedQuestionWithOptions(
            $level->id,
            $skill->id,
            $lecturer->id,
        );

        $this->seedExamAttempt(
            $student->id,
            $level->id,
            $skill->id,
            $question->id,
            $wrongOptionId,
            false,
            now(),
        );

        $this->seedDailyAttempt(
            $student->id,
            $question->id,
            $correctOptionId,
            true,
            now(),
        );

        $today = now()->toDateString();
        $response = $this->actingAs($admin)->get(route('admin.student-monitoring.show', [
            'student' => $student->id,
            'source' => 'all',
            'from' => $today,
            'to' => $today,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StudentMonitoring/Index')
            ->where('selectedStudent.id', $student->id)
            ->has('details', 2));
    }

    /**
     * @return array{0:Level,1:SkillCategory}
     */
    private function seedBaseCatalog(): array
    {
        $level = Level::query()->create([
            'name' => 'Basic',
            'slug' => 'basic',
            'order' => 1,
            'min_score_to_unlock' => 0,
            'description' => null,
        ]);

        $skill = SkillCategory::query()->create([
            'name' => 'Listening',
            'slug' => 'listening',
            'description' => null,
            'icon' => null,
        ]);

        return [$level, $skill];
    }

    /**
     * @return array{0:Question,1:int,2:int}
     */
    private function seedQuestionWithOptions(
        int $levelId,
        int $skillId,
        int $creatorId,
    ): array {
        $question = Question::query()->create([
            'skill_category_id' => $skillId,
            'level_id' => $levelId,
            'type' => 'multiple_choice',
            'question_text' => 'Monitoring question',
            'narrative_text' => null,
            'explanation' => null,
            'created_by' => $creatorId,
            'is_active' => true,
        ]);

        $correctOptionId = DB::table('question_options')->insertGetId([
            'question_id' => $question->id,
            'option_text' => 'Correct answer',
            'is_correct' => true,
            'order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $wrongOptionId = DB::table('question_options')->insertGetId([
            'question_id' => $question->id,
            'option_text' => 'Wrong answer',
            'is_correct' => false,
            'order' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [$question, $correctOptionId, $wrongOptionId];
    }

    private function seedExamAttempt(
        int $studentId,
        int $levelId,
        int $skillId,
        int $questionId,
        int $selectedOptionId,
        bool $isCorrect,
        \DateTimeInterface $completedAt,
    ): void {
        $sessionId = DB::table('exam_sessions')->insertGetId([
            'user_id' => $studentId,
            'level_id' => $levelId,
            'skill_category_id' => $skillId,
            'status' => ExamStatus::Completed->value,
            'randomization_seed' => 12345,
            'total_score' => $isCorrect ? 10 : 0,
            'max_possible_score' => 10,
            'started_at' => now()->subMinutes(20),
            'completed_at' => $completedAt,
            'duration_seconds' => 1200,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sessionQuestionId = DB::table('exam_session_questions')->insertGetId([
            'exam_session_id' => $sessionId,
            'question_id' => $questionId,
            'order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('exam_answers')->insert([
            'exam_session_id' => $sessionId,
            'exam_session_question_id' => $sessionQuestionId,
            'question_id' => $questionId,
            'selected_option_id' => $selectedOptionId,
            'answer_text' => null,
            'is_correct' => $isCorrect,
            'score' => $isCorrect ? 10 : 0,
            'answered_at' => $completedAt,
            'time_spent_seconds' => 30,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedDailyAttempt(
        int $studentId,
        int $questionId,
        int $selectedOptionId,
        bool $isCorrect,
        \DateTimeInterface $activityDate,
    ): void {
        $logId = DB::table('daily_activity_logs')->insertGetId([
            'user_id' => $studentId,
            'activity_date' => $activityDate,
            'question_ids' => json_encode([$questionId], JSON_THROW_ON_ERROR),
            'answered_count' => 1,
            'correct_count' => $isCorrect ? 1 : 0,
            'is_completed' => false,
            'streak_after_day' => 0,
            'completed_at' => null,
            'reward_granted_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('daily_activity_answers')->insert([
            'daily_activity_log_id' => $logId,
            'question_id' => $questionId,
            'selected_option_id' => $selectedOptionId,
            'is_correct' => $isCorrect,
            'answered_at' => $activityDate,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
