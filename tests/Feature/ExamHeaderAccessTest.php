<?php

namespace Tests\Feature;

use App\Enums\QuestionType;
use App\Enums\UserRole;
use App\Models\Level;
use App\Models\Question;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExamHeaderAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_lecturer_can_view_exam_headers_index(): void
    {
        $lecturer = User::factory()->create(['role' => UserRole::Lecturer]);

        $response = $this->actingAs($lecturer)->get(route('admin.exam-headers.index'));

        $response->assertOk();
    }

    public function test_student_cannot_view_exam_headers_index(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);

        $response = $this->actingAs($student)->get(route('admin.exam-headers.index'));

        $response->assertForbidden();
    }

    public function test_guest_cannot_view_exam_headers_index(): void
    {
        $response = $this->get(route('admin.exam-headers.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_create_page_filters_questions_by_search_query(): void
    {
        $lecturer = User::factory()->create(['role' => UserRole::Lecturer]);
        $skill = SkillCategory::query()->create([
            'name' => 'Listening',
            'slug' => 'listening',
            'description' => null,
            'icon' => null,
        ]);
        $level = Level::query()->create([
            'name' => 'Basic',
            'slug' => 'basic',
            'order' => 1,
            'min_score_to_unlock' => 0,
            'description' => null,
        ]);

        Question::query()->create([
            'skill_category_id' => $skill->id,
            'level_id' => $level->id,
            'type' => QuestionType::MultipleChoice,
            'question_text' => 'Alpha unique token for search',
            'narrative_text' => null,
            'explanation' => null,
            'created_by' => $lecturer->id,
            'is_active' => true,
        ]);

        Question::query()->create([
            'skill_category_id' => $skill->id,
            'level_id' => $level->id,
            'type' => QuestionType::MultipleChoice,
            'question_text' => 'Beta unrelated stem',
            'narrative_text' => null,
            'explanation' => null,
            'created_by' => $lecturer->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($lecturer)->get(route('admin.exam-headers.create', [
            'level_id' => $level->id,
            'search' => 'Alpha unique',
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ExamHeaders/Create')
            ->has('questions', 1)
            ->where('questions.0.question_text', 'Alpha unique token for search')
            ->where('filters.search', 'Alpha unique'));
    }
}
