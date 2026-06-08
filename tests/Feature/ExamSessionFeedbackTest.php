<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\ExamSession;
use App\Models\ExamSessionFeedback;
use App\Models\Level;
use App\Models\Question;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExamSessionFeedbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_submit_feedback_after_exam(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $creator = User::factory()->create(['role' => UserRole::Lecturer]);
        [$basic] = $this->seedLevels();
        $skill = $this->seedSkill();
        $question = $this->seedQuestions($basic->id, $skill->id, $creator->id, 1)[0];

        $correctOptionId = \DB::table('question_options')->insertGetId([
            'question_id' => $question->id,
            'option_text' => '2',
            'is_correct' => true,
            'order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($student)->post(route('student.exams.start'), [
            'level_id' => $basic->id,
        ]);

        $session = ExamSession::query()->firstOrFail();
        $sq = $session->sessionQuestions()->firstOrFail();

        $this->actingAs($student)->post(route('student.exams.answer'), [
            'exam_session_id' => $session->id,
            'exam_session_question_id' => $sq->id,
            'question_id' => $question->id,
            'selected_option_id' => $correctOptionId,
            'time_spent_seconds' => 10,
        ]);

        $this->actingAs($student)->post(route('student.exams.complete'), [
            'exam_session_id' => $session->id,
        ])->assertRedirect(route('student.exams.feedback', $session));

        $this->actingAs($student)->post(route('student.exams.feedback.store', $session), [
            'rating' => 5,
            'testimonial' => 'Pengalaman ujian yang sangat baik.',
        ])->assertRedirect(route('student.exams.feedback', $session));

        $this->assertDatabaseHas('exam_session_feedback', [
            'exam_session_id' => $session->id,
            'user_id' => $student->id,
            'rating' => 5,
        ]);
        $this->assertNotNull(
            ExamSessionFeedback::query()
                ->where('exam_session_id', $session->id)
                ->value('submitted_at'),
        );
    }

    public function test_feedback_validation_requires_rating_and_testimonial(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $session = $this->createCompletedSessionWithFeedbackRow($student);

        $this->actingAs($student)->post(route('student.exams.feedback.store', $session), [
            'rating' => 0,
            'testimonial' => 'short',
        ])->assertSessionHasErrors(['rating', 'testimonial']);
    }

    public function test_admin_can_view_feedback_index(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $student = User::factory()->create(['role' => UserRole::Student]);
        $session = $this->createCompletedSessionWithFeedbackRow($student);

        ExamSessionFeedback::query()->where('exam_session_id', $session->id)->update([
            'rating' => 4,
            'testimonial' => 'Bagus sekali.',
            'submitted_at' => now(),
            'completion_message' => 'AI summary for admin table.',
            'ai_status' => 'ready',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.exam-session-feedback.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/ExamSessionFeedback/Index')
                ->has('feedbacks.data', 1)
                ->where('feedbacks.data.0.completion_message', 'AI summary for admin table.')
                ->where('feedbacks.data.0.ai_status', 'ready'));
    }

    public function test_lecturer_can_view_feedback_index(): void
    {
        $lecturer = User::factory()->create(['role' => UserRole::Lecturer]);
        $student = User::factory()->create(['role' => UserRole::Student]);
        $session = $this->createCompletedSessionWithFeedbackRow($student);

        ExamSessionFeedback::query()->where('exam_session_id', $session->id)->update([
            'rating' => 3,
            'testimonial' => 'Cukup.',
            'submitted_at' => now(),
        ]);

        $this->actingAs($lecturer)
            ->get(route('admin.exam-session-feedback.index'))
            ->assertOk();
    }

    public function test_student_cannot_view_admin_feedback_index(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);

        $this->actingAs($student)
            ->get(route('admin.exam-session-feedback.index'))
            ->assertForbidden();
    }

    private function createCompletedSessionWithFeedbackRow(User $student): ExamSession
    {
        $creator = User::factory()->create(['role' => UserRole::Lecturer]);
        [$basic] = $this->seedLevels();
        $skill = $this->seedSkill();
        $question = $this->seedQuestions($basic->id, $skill->id, $creator->id, 1)[0];

        $correctOptionId = \DB::table('question_options')->insertGetId([
            'question_id' => $question->id,
            'option_text' => '2',
            'is_correct' => true,
            'order' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($student)->post(route('student.exams.start'), [
            'level_id' => $basic->id,
        ]);

        $session = ExamSession::query()->firstOrFail();
        $sq = $session->sessionQuestions()->firstOrFail();

        $this->actingAs($student)->post(route('student.exams.answer'), [
            'exam_session_id' => $session->id,
            'exam_session_question_id' => $sq->id,
            'question_id' => $question->id,
            'selected_option_id' => $correctOptionId,
            'time_spent_seconds' => 10,
        ]);

        $this->actingAs($student)->post(route('student.exams.complete'), [
            'exam_session_id' => $session->id,
        ]);

        $session->refresh();

        return $session;
    }

    public function test_feedback_page_exposes_ai_status_in_inertia_payload(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $session = $this->createCompletedSessionWithFeedbackRow($student);

        $this->actingAs($student)
            ->get(route('student.exams.feedback', $session))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Student/Exams/Feedback')
                ->where('session.ai_status', 'failed')
                ->has('question_review', 1)
                ->where('question_review.0.question_text', 'Question 1')
                ->where('question_review.0.student_answer', '2')
                ->where('question_review.0.correct_answer', '2'));
    }

    /**
     * @return array<int, Level>
     */
    private function seedLevels(): array
    {
        $basic = Level::query()->create([
            'name' => 'Basic',
            'slug' => 'basic',
            'order' => 1,
            'min_score_to_unlock' => 0,
            'description' => null,
        ]);
        $intermediate = Level::query()->create([
            'name' => 'Intermediate',
            'slug' => 'intermediate',
            'order' => 2,
            'min_score_to_unlock' => 20,
            'description' => null,
        ]);
        $advanced = Level::query()->create([
            'name' => 'Advanced',
            'slug' => 'advanced',
            'order' => 3,
            'min_score_to_unlock' => 40,
            'description' => null,
        ]);

        return [$basic, $intermediate, $advanced];
    }

    private function seedSkill(): SkillCategory
    {
        return SkillCategory::query()->create([
            'name' => 'Listening',
            'slug' => 'listening',
            'description' => null,
            'icon' => null,
        ]);
    }

    /**
     * @return array<int, Question>
     */
    private function seedQuestions(int $levelId, int $skillId, int $creatorId, int $count): array
    {
        $rows = [];
        for ($i = 1; $i <= $count; $i++) {
            $rows[] = Question::query()->create([
                'skill_category_id' => $skillId,
                'level_id' => $levelId,
                'type' => 'multiple_choice',
                'question_text' => "Question {$i}",
                'narrative_text' => null,
                'explanation' => null,
                'created_by' => $creatorId,
                'is_active' => true,
            ]);
        }

        return $rows;
    }
}
