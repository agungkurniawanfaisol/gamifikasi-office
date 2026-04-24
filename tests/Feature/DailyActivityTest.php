<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\DailyActivityLog;
use App\Models\Level;
use App\Models\Question;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DailyActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_view_daily_activity_page(): void
    {
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);
        $this->seedQuestionBank();

        $response = $this->actingAs($student)->get(route('student.daily-activity.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Student/DailyActivity/Index')
            ->has('activity')
            ->has('questions')
            ->has('answers'));
    }

    public function test_daily_activity_is_not_completed_if_less_than_minimum_answers(): void
    {
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);
        $this->seedQuestionBank();

        $this->actingAs($student)->get(route('student.daily-activity.index'));
        $log = DailyActivityLog::query()->where('user_id', $student->id)->firstOrFail();
        $questionId = $log->question_ids[0];

        $optionId = \DB::table('question_options')
            ->where('question_id', $questionId)
            ->value('id');

        $this->actingAs($student)->post(route('student.daily-activity.answer'), [
            'question_id' => $questionId,
            'selected_option_id' => $optionId,
        ])->assertRedirect();

        $this->actingAs($student)->post(route('student.daily-activity.complete'))
            ->assertRedirect(route('student.daily-activity.index'));

        $this->assertDatabaseHas('daily_activity_logs', [
            'id' => $log->id,
            'answered_count' => 1,
            'is_completed' => 0,
            'streak_after_day' => 0,
        ]);
        $this->assertDatabaseCount('user_reward_points', 0);
    }

    public function test_weekly_reward_is_granted_after_seven_day_streak(): void
    {
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);
        $this->seedQuestionBank();

        $this->seedCompletedStreak($student->id);

        $this->actingAs($student)->get(route('student.daily-activity.index'));
        $todayLog = DailyActivityLog::query()
            ->where('user_id', $student->id)
            ->where('activity_date', now()->toDateString())
            ->firstOrFail();

        $questionIds = array_slice($todayLog->question_ids, 0, 2);

        foreach ($questionIds as $questionId) {
            $optionId = \DB::table('question_options')
                ->where('question_id', $questionId)
                ->value('id');

            $this->actingAs($student)->post(route('student.daily-activity.answer'), [
                'question_id' => $questionId,
                'selected_option_id' => $optionId,
            ])->assertRedirect();
        }

        $this->actingAs($student)->post(route('student.daily-activity.complete'))
            ->assertRedirect(route('student.daily-activity.index'));

        $this->assertDatabaseHas('daily_activity_logs', [
            'id' => $todayLog->id,
            'is_completed' => 1,
            'streak_after_day' => 7,
        ]);
        $this->assertDatabaseHas('user_reward_points', [
            'user_id' => $student->id,
            'source' => 'daily_activity_weekly',
            'points' => 100,
        ]);
        $this->assertDatabaseCount('user_badges', 1);
    }

    private function seedQuestionBank(): void
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
        $creator = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);

        for ($i = 1; $i <= 8; $i++) {
            $question = Question::query()->create([
                'skill_category_id' => $skill->id,
                'level_id' => $level->id,
                'type' => 'multiple_choice',
                'question_text' => "Daily question {$i}",
                'narrative_text' => null,
                'explanation' => null,
                'created_by' => $creator->id,
                'is_active' => true,
            ]);

            \DB::table('question_options')->insert([
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
    }

    private function seedCompletedStreak(int $userId): void
    {
        for ($offset = 6; $offset >= 1; $offset--) {
            $streak = 7 - $offset;
            DailyActivityLog::query()->create([
                'user_id' => $userId,
                'activity_date' => now()->subDays($offset)->toDateString(),
                'question_ids' => [1, 2, 3, 4, 5],
                'answered_count' => 5,
                'correct_count' => 4,
                'is_completed' => true,
                'streak_after_day' => $streak,
                'completed_at' => now()->subDays($offset),
            ]);
        }
    }
}
