<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\ExamSession;
use App\Models\Level;
use App\Models\Question;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentExamFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_view_exam_level_selection_page(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $this->seedLevels();

        $response = $this->actingAs($student)->get(route('student.exams.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Student/Exams/Index')
            ->has('levels', 3));
    }

    public function test_student_start_uses_exam_header_first_when_available(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $creator = User::factory()->create(['role' => UserRole::Lecturer]);
        [$basic] = $this->seedLevels();
        $skill = $this->seedSkill();
        $questions = $this->seedQuestions($basic->id, $skill->id, $creator->id, 2);

        $headerId = \DB::table('exam_headers')->insertGetId([
            'title' => 'Header Basic',
            'level_id' => $basic->id,
            'total_duration_minutes' => 5,
            'creator_id' => $creator->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \DB::table('exam_questions')->insert([
            [
                'exam_header_id' => $headerId,
                'question_id' => $questions[0]->id,
                'duration_per_question' => 2,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'exam_header_id' => $headerId,
                'question_id' => $questions[1]->id,
                'duration_per_question' => 3,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $response = $this->actingAs($student)->post(route('student.exams.start'), [
            'level_id' => $basic->id,
        ]);

        $session = ExamSession::query()->firstOrFail();
        $response->assertRedirect(route('student.exams.show', $session->id));
        $this->assertSame(300, (int) $session->duration_seconds);
        $this->assertDatabaseHas('exam_session_questions', [
            'exam_session_id' => $session->id,
            'question_id' => $questions[0]->id,
            'expected_duration_seconds' => 120,
        ]);
        $this->assertDatabaseHas('exam_session_questions', [
            'exam_session_id' => $session->id,
            'question_id' => $questions[1]->id,
            'expected_duration_seconds' => 180,
        ]);
    }

    public function test_student_start_falls_back_to_question_bank_when_no_header(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);
        $creator = User::factory()->create(['role' => UserRole::Lecturer]);
        [$basic] = $this->seedLevels();
        $skill = $this->seedSkill();
        $this->seedQuestions($basic->id, $skill->id, $creator->id, 3);

        $this->actingAs($student)->post(route('student.exams.start'), [
            'level_id' => $basic->id,
        ])->assertRedirect();

        $session = ExamSession::query()->firstOrFail();
        $this->assertSame(180, (int) $session->duration_seconds);
        $this->assertCount(3, $session->sessionQuestions);
        $this->assertDatabaseHas('exam_session_questions', [
            'exam_session_id' => $session->id,
            'expected_duration_seconds' => 60,
        ]);
    }

    public function test_student_can_submit_answer_and_complete_exam(): void
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

        \DB::table('question_options')->insert([
            'question_id' => $question->id,
            'option_text' => '3',
            'is_correct' => false,
            'order' => 2,
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
            'time_spent_seconds' => 12,
        ])->assertRedirect();

        $this->assertDatabaseHas('exam_answers', [
            'exam_session_id' => $session->id,
            'question_id' => $question->id,
            'selected_option_id' => $correctOptionId,
            'is_correct' => 1,
            'score' => 1,
        ]);

        $this->actingAs($student)->post(route('student.exams.complete'), [
            'exam_session_id' => $session->id,
        ])->assertRedirect(route('student.exams.feedback', $session));

        $this->assertDatabaseHas('exam_sessions', [
            'id' => $session->id,
            'status' => 'completed',
            'total_score' => 1,
        ]);

        $this->assertDatabaseHas('exam_session_feedback', [
            'exam_session_id' => $session->id,
            'user_id' => $student->id,
        ]);
    }

    public function test_non_student_cannot_access_student_exam_routes(): void
    {
        $lecturer = User::factory()->create(['role' => UserRole::Lecturer]);

        $this->actingAs($lecturer)
            ->get(route('student.exams.index'))
            ->assertForbidden();
    }

    /**
     * @return array<int,Level>
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
     * @return array<int,Question>
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

