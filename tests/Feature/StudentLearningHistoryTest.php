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

it('allows only student to access learning history page', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $admin = User::factory()->create([
        'role' => UserRole::Admin,
        'email_verified_at' => now(),
    ]);

    $this->actingAs($student)
        ->get(route('student.learning-history.index'))
        ->assertOk();

    $this->actingAs($admin)
        ->get(route('student.learning-history.index'))
        ->assertForbidden();
});

it('filters attempt list by source and date', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    [$level, $skill] = seedCatalog();
    [$question, $correctOptionId, $wrongOptionId] = seedQuestionWithOptions($level->id, $skill->id, $lecturer->id);

    seedExamAttempt(
        studentId: $student->id,
        levelId: $level->id,
        skillId: $skill->id,
        questionId: $question->id,
        selectedOptionId: $correctOptionId,
        isCorrect: true,
        completedAt: now(),
    );

    seedDailyAttempt(
        studentId: $student->id,
        questionId: $question->id,
        selectedOptionId: $wrongOptionId,
        isCorrect: false,
        activityDate: now()->subDay(),
    );

    $today = now()->toDateString();

    $this->actingAs($student)
        ->get(route('student.learning-history.index', [
            'source' => 'exam',
            'from' => $today,
            'to' => $today,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/LearningHistory/Index')
            ->has('attempts.data', 1)
            ->where('attempts.data.0.source', 'exam')
            ->where('summary.total_attempts', 1));
});

it('shows detail rows and target summary for selected attempt', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    [$level, $skill] = seedCatalog();
    [$question, $correctOptionId] = seedQuestionWithOptions($level->id, $skill->id, $lecturer->id);

    $sessionId = seedExamAttempt(
        studentId: $student->id,
        levelId: $level->id,
        skillId: $skill->id,
        questionId: $question->id,
        selectedOptionId: $correctOptionId,
        isCorrect: true,
        completedAt: now(),
    );

    $today = now()->toDateString();

    $this->actingAs($student)
        ->get(route('student.learning-history.index', [
            'source' => 'exam',
            'from' => $today,
            'to' => $today,
            'attempt_source' => 'exam',
            'attempt_id' => $sessionId,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/LearningHistory/Index')
            ->has('details', 1)
            ->where('details.0.question', 'Monitoring question')
            ->where('details.0.is_correct', true)
            ->where('targets.daily.min_required', 2)
            ->has('targets.streak')
            ->has('targets.accuracy')
            ->has('targets.risk')
            ->has('targets.recommendation.actions'));
});

it('exports student learning history as csv', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    [$level, $skill] = seedCatalog();
    [$question, $correctOptionId] = seedQuestionWithOptions($level->id, $skill->id, $lecturer->id);

    seedExamAttempt(
        studentId: $student->id,
        levelId: $level->id,
        skillId: $skill->id,
        questionId: $question->id,
        selectedOptionId: $correctOptionId,
        isCorrect: true,
        completedAt: now(),
    );

    $response = $this->actingAs($student)->get(route('student.learning-history.export'));

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
    $response->assertHeader('content-disposition');
});

it('marks risk indicator as high when accuracy below threshold for three days', function (): void {
    $student = User::factory()->create([
        'role' => UserRole::Student,
        'email_verified_at' => now(),
    ]);
    $lecturer = User::factory()->create([
        'role' => UserRole::Lecturer,
        'email_verified_at' => now(),
    ]);

    [$level, $skill] = seedCatalog();
    [$question, , $wrongOptionId] = seedQuestionWithOptions($level->id, $skill->id, $lecturer->id);

    seedDailyAttempt(
        studentId: $student->id,
        questionId: $question->id,
        selectedOptionId: $wrongOptionId,
        isCorrect: false,
        activityDate: now(),
    );
    seedDailyAttempt(
        studentId: $student->id,
        questionId: $question->id,
        selectedOptionId: $wrongOptionId,
        isCorrect: false,
        activityDate: now()->subDay(),
    );
    seedDailyAttempt(
        studentId: $student->id,
        questionId: $question->id,
        selectedOptionId: $wrongOptionId,
        isCorrect: false,
        activityDate: now()->subDays(2),
    );

    $this->actingAs($student)
        ->get(route('student.learning-history.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('targets.risk.status', 'high_risk')
            ->where('targets.risk.days_below_threshold', 3)
            ->where('targets.recommendation.priority', 'high')
            ->where('targets.recommendation.focus_source', 'daily'));
});

/**
 * @return array{0:Level,1:SkillCategory}
 */
function seedCatalog(): array
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
function seedQuestionWithOptions(
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

function seedExamAttempt(
    int $studentId,
    int $levelId,
    int $skillId,
    int $questionId,
    int $selectedOptionId,
    bool $isCorrect,
    \DateTimeInterface $completedAt,
): int {
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

    return $sessionId;
}

function seedDailyAttempt(
    int $studentId,
    int $questionId,
    int $selectedOptionId,
    bool $isCorrect,
    \DateTimeInterface $activityDate,
): int {
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

    return $logId;
}
