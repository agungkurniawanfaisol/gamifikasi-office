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

class InstructorInsightDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_and_lecturer_can_access_instructor_insights(): void
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
            ->get(route('admin.instructor-insights.index'))
            ->assertOk();

        $this->actingAs($lecturer)
            ->get(route('admin.instructor-insights.index'))
            ->assertOk();

        $this->actingAs($student)
            ->get(route('admin.instructor-insights.index'))
            ->assertForbidden();
    }

    public function test_lecturer_only_sees_their_question_insights(): void
    {
        $lecturerA = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);
        $lecturerB = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);

        [$level, $skill] = $this->seedBaseCatalog();
        [$questionA, $correctA, $wrongA] = $this->seedQuestionWithOptions(
            $level->id,
            $skill->id,
            $lecturerA->id,
            'Question by lecturer A',
        );
        [$questionB, $correctB, $wrongB] = $this->seedQuestionWithOptions(
            $level->id,
            $skill->id,
            $lecturerB->id,
            'Question by lecturer B',
        );

        $this->seedExamAnswer($student->id, $level->id, $skill->id, $questionA->id, $wrongA, false);
        $this->seedExamAnswer($student->id, $level->id, $skill->id, $questionB->id, $wrongB, false);
        $this->seedDailyAnswer($student->id, $questionA->id, $wrongA, false);
        $this->seedDailyAnswer($student->id, $questionB->id, $wrongB, false);

        $response = $this->actingAs($lecturerA)->get(route('admin.instructor-insights.index', [
            'min_attempts' => 1,
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/InstructorInsights/Index')
            ->where('summary.total_questions_analyzed', 1)
            ->has('hardest_questions', 1)
            ->where('hardest_questions.0.question_id', $questionA->id)
            ->has('weak_topics', 1)
            ->where('weak_topics.0.skill_category_id', $skill->id)
            ->has('remedial_recommendations', 1));
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
        string $questionText,
    ): array {
        $question = Question::query()->create([
            'skill_category_id' => $skillId,
            'level_id' => $levelId,
            'type' => 'multiple_choice',
            'question_text' => $questionText,
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

    private function seedExamAnswer(
        int $studentId,
        int $levelId,
        int $skillId,
        int $questionId,
        int $selectedOptionId,
        bool $isCorrect,
    ): void {
        $sessionId = DB::table('exam_sessions')->insertGetId([
            'user_id' => $studentId,
            'level_id' => $levelId,
            'skill_category_id' => $skillId,
            'status' => ExamStatus::Completed->value,
            'randomization_seed' => 123,
            'total_score' => $isCorrect ? 10 : 0,
            'max_possible_score' => 10,
            'started_at' => now()->subMinutes(10),
            'completed_at' => now(),
            'duration_seconds' => 600,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sessionQuestionId = DB::table('exam_session_questions')->insertGetId([
            'exam_session_id' => $sessionId,
            'question_id' => $questionId,
            'order' => 1,
            'expected_duration_seconds' => 60,
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
            'answered_at' => now(),
            'time_spent_seconds' => 40,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedDailyAnswer(
        int $studentId,
        int $questionId,
        int $selectedOptionId,
        bool $isCorrect,
    ): void {
        $activityDate = now()->toDateString();
        $log = DB::table('daily_activity_logs')
            ->where('user_id', $studentId)
            ->where('activity_date', $activityDate)
            ->first();

        if ($log === null) {
            $logId = DB::table('daily_activity_logs')->insertGetId([
                'user_id' => $studentId,
                'activity_date' => $activityDate,
                'question_ids' => json_encode([$questionId], JSON_THROW_ON_ERROR),
                'answered_count' => 1,
                'correct_count' => $isCorrect ? 1 : 0,
                'is_completed' => false,
                'streak_after_day' => 1,
                'completed_at' => null,
                'reward_granted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $existingQuestionIds = json_decode((string) $log->question_ids, true, 512, JSON_THROW_ON_ERROR);
            $updatedQuestionIds = array_values(array_unique(array_merge(
                is_array($existingQuestionIds) ? $existingQuestionIds : [],
                [$questionId],
            )));

            DB::table('daily_activity_logs')
                ->where('id', $log->id)
                ->update([
                    'question_ids' => json_encode($updatedQuestionIds, JSON_THROW_ON_ERROR),
                    'answered_count' => (int) $log->answered_count + 1,
                    'correct_count' => (int) $log->correct_count + ($isCorrect ? 1 : 0),
                    'updated_at' => now(),
                ]);

            $logId = (int) $log->id;
        }

        DB::table('daily_activity_answers')->insert([
            'daily_activity_log_id' => $logId,
            'question_id' => $questionId,
            'selected_option_id' => $selectedOptionId,
            'is_correct' => $isCorrect,
            'answered_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}

