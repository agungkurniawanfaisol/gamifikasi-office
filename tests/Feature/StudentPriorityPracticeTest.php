<?php

use App\Enums\ExamStatus;
use App\Enums\UserRole;
use App\Models\Level;
use App\Models\Question;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('allows student and blocks non student from priority practice page', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    seedPriorityPracticeCatalog($lecturer->id);

    $this->actingAs($student)
        ->get(route('student.priority-practice.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/PriorityPractice/Index')
            ->where('session', null)
            ->where('canCreateNewPackage', true));

    $this->actingAs($lecturer)
        ->get(route('student.priority-practice.index'))
        ->assertForbidden();
});

it('does not create a priority practice session on index alone', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    seedPriorityPracticeCatalog($lecturer->id);

    $this->actingAs($student)
        ->get(route('student.priority-practice.index'))
        ->assertOk();

    expect(DB::table('priority_practice_sessions')->where('user_id', $student->id)->count())->toBe(0);
});

it('generates remedial package from weakest skill', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    [$listeningSkill, $grammarSkill, $level, $listeningQuestion] = seedPriorityPracticeCatalog($lecturer->id);

    seedWrongExamAnswerForSkill(
        studentId: $student->id,
        levelId: $level->id,
        skillId: $listeningSkill->id,
        questionId: $listeningQuestion->id,
    );
    seedWrongExamAnswerForSkill(
        studentId: $student->id,
        levelId: $level->id,
        skillId: $listeningSkill->id,
        questionId: $listeningQuestion->id,
    );

    $this->actingAs($student)
        ->post(route('student.priority-practice.store'))
        ->assertRedirect(route('student.priority-practice.index'))
        ->assertSessionHas('status');

    $response = $this->actingAs($student)->get(route('student.priority-practice.index'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Student/PriorityPractice/Index')
        ->where('session.focusSkill', $listeningSkill->name)
        ->where('canCreateNewPackage', false)
        ->has('questions', 5));
});

it('rejects creating a second package while an active session exists', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    [$listeningSkill, $grammarSkill, $level, $listeningQuestion] = seedPriorityPracticeCatalog($lecturer->id);

    seedWrongExamAnswerForSkill(
        studentId: $student->id,
        levelId: $level->id,
        skillId: $listeningSkill->id,
        questionId: $listeningQuestion->id,
    );

    $this->actingAs($student)->post(route('student.priority-practice.store'))->assertSessionHas('status');

    $this->actingAs($student)
        ->post(route('student.priority-practice.store'))
        ->assertRedirect(route('student.priority-practice.index'))
        ->assertSessionHasErrors('priority_practice');
});

it('sets canCreateNewPackage true when latest session is completed', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    [$listeningSkill] = seedPriorityPracticeCatalog($lecturer->id);

    $questionIds = Question::query()
        ->where('skill_category_id', $listeningSkill->id)
        ->orderBy('id')
        ->limit(5)
        ->pluck('id')
        ->all();

    DB::table('priority_practice_sessions')->insert([
        'user_id' => $student->id,
        'skill_category_id' => $listeningSkill->id,
        'status' => 'completed',
        'question_ids' => json_encode($questionIds, JSON_THROW_ON_ERROR),
        'total_questions' => 5,
        'answered_count' => 5,
        'correct_count' => 3,
        'generated_at' => now()->subDay(),
        'expires_at' => now()->addDay(),
        'completed_at' => now()->subHours(2),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($student)
        ->get(route('student.priority-practice.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canCreateNewPackage', true)
            ->where('session.status', 'completed'));
});

it('stores answer for active priority practice question', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    seedPriorityPracticeCatalog($lecturer->id);

    $this->actingAs($student)->post(route('student.priority-practice.store'))->assertSessionHas('status');

    $session = DB::table('priority_practice_sessions')->where('user_id', $student->id)->first();
    expect($session)->not()->toBeNull();

    $questionId = (int) json_decode((string) $session->question_ids, true, 512, JSON_THROW_ON_ERROR)[0];
    $optionId = (int) DB::table('question_options')->where('question_id', $questionId)->value('id');

    $this->actingAs($student)->post(route('student.priority-practice.answer'), [
        'priority_practice_session_id' => (int) $session->id,
        'question_id' => $questionId,
        'selected_option_id' => $optionId,
    ])->assertRedirect();

    $this->assertDatabaseHas('priority_practice_answers', [
        'priority_practice_session_id' => (int) $session->id,
        'question_id' => $questionId,
        'selected_option_id' => $optionId,
    ]);
});

/**
 * @return array{0:SkillCategory,1:SkillCategory,2:Level,3:Question}
 */
function seedPriorityPracticeCatalog(int $creatorId): array
{
    $level = Level::query()->create([
        'name' => 'Basic',
        'slug' => 'basic',
        'order' => 1,
        'min_score_to_unlock' => 0,
        'description' => null,
    ]);

    $listeningSkill = SkillCategory::query()->create([
        'name' => 'Listening',
        'slug' => 'listening',
        'description' => null,
        'icon' => null,
    ]);

    $grammarSkill = SkillCategory::query()->create([
        'name' => 'Grammar',
        'slug' => 'grammar',
        'description' => null,
        'icon' => null,
    ]);

    $firstListeningQuestion = null;

    for ($i = 1; $i <= 5; $i++) {
        $question = Question::query()->create([
            'skill_category_id' => $listeningSkill->id,
            'level_id' => $level->id,
            'type' => 'multiple_choice',
            'question_text' => "Listening priority question {$i}",
            'narrative_text' => null,
            'explanation' => null,
            'created_by' => $creatorId,
            'is_active' => true,
        ]);

        if ($firstListeningQuestion === null) {
            $firstListeningQuestion = $question;
        }

        DB::table('question_options')->insert([
            [
                'question_id' => $question->id,
                'option_text' => 'Correct',
                'is_correct' => true,
                'order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question_id' => $question->id,
                'option_text' => 'Wrong',
                'is_correct' => false,
                'order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    for ($i = 1; $i <= 5; $i++) {
        $question = Question::query()->create([
            'skill_category_id' => $grammarSkill->id,
            'level_id' => $level->id,
            'type' => 'multiple_choice',
            'question_text' => "Grammar priority question {$i}",
            'narrative_text' => null,
            'explanation' => null,
            'created_by' => $creatorId,
            'is_active' => true,
        ]);

        DB::table('question_options')->insert([
            [
                'question_id' => $question->id,
                'option_text' => 'Correct',
                'is_correct' => true,
                'order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'question_id' => $question->id,
                'option_text' => 'Wrong',
                'is_correct' => false,
                'order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    return [$listeningSkill, $grammarSkill, $level, $firstListeningQuestion];
}

function seedWrongExamAnswerForSkill(
    int $studentId,
    int $levelId,
    int $skillId,
    int $questionId,
): void {
    $sessionId = DB::table('exam_sessions')->insertGetId([
        'user_id' => $studentId,
        'level_id' => $levelId,
        'skill_category_id' => $skillId,
        'status' => ExamStatus::Completed->value,
        'randomization_seed' => random_int(1000, 9999),
        'total_score' => 0,
        'max_possible_score' => 10,
        'started_at' => now()->subMinutes(30),
        'completed_at' => now(),
        'duration_seconds' => 300,
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

    $wrongOptionId = (int) DB::table('question_options')
        ->where('question_id', $questionId)
        ->where('is_correct', false)
        ->value('id');

    DB::table('exam_answers')->insert([
        'exam_session_id' => $sessionId,
        'exam_session_question_id' => $sessionQuestionId,
        'question_id' => $questionId,
        'selected_option_id' => $wrongOptionId,
        'answer_text' => null,
        'is_correct' => false,
        'score' => 0,
        'answered_at' => now(),
        'time_spent_seconds' => 20,
        'created_at' => now(),
        'updated_at' => now(),
    ]);
}
