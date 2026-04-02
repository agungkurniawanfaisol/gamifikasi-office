<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\ExamSession;
use App\Models\Level;
use App\Models\SkillCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StudentRankingPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_access_rankings_page_with_global_and_level_payload(): void
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
        $skill = SkillCategory::query()->create([
            'name' => 'Listening',
            'slug' => 'listening',
            'description' => null,
            'icon' => null,
        ]);

        $me = User::factory()->create(['role' => UserRole::Student, 'name' => 'Me']);
        $alice = User::factory()->create(['role' => UserRole::Student, 'name' => 'Alice']);
        $bob = User::factory()->create(['role' => UserRole::Student, 'name' => 'Bob']);

        // Alice has two attempts; both should appear as separate rows.
        ExamSession::query()->create([
            'user_id' => $alice->id,
            'level_id' => $basic->id,
            'skill_category_id' => $skill->id,
            'status' => 'completed',
            'randomization_seed' => 100,
            'total_score' => 95,
            'max_possible_score' => 100,
            'started_at' => now()->subMinutes(20),
            'completed_at' => now()->subMinutes(19),
            'duration_seconds' => 100,
        ]);

        ExamSession::query()->create([
            'user_id' => $alice->id,
            'level_id' => $basic->id,
            'skill_category_id' => $skill->id,
            'status' => 'completed',
            'randomization_seed' => 101,
            'total_score' => 60,
            'max_possible_score' => 100,
            'started_at' => now()->subMinutes(10),
            'completed_at' => now()->subMinutes(9),
            'duration_seconds' => 120,
        ]);

        ExamSession::query()->create([
            'user_id' => $me->id,
            'level_id' => $basic->id,
            'skill_category_id' => $skill->id,
            'status' => 'completed',
            'randomization_seed' => 102,
            'total_score' => 80,
            'max_possible_score' => 100,
            'started_at' => now()->subMinutes(8),
            'completed_at' => now()->subMinutes(7),
            'duration_seconds' => 200,
        ]);

        ExamSession::query()->create([
            'user_id' => $bob->id,
            'level_id' => $intermediate->id,
            'skill_category_id' => $skill->id,
            'status' => 'timed_out',
            'randomization_seed' => 103,
            'total_score' => 70,
            'max_possible_score' => 100,
            'started_at' => now()->subMinutes(6),
            'completed_at' => now()->subMinutes(5),
            'duration_seconds' => 150,
        ]);

        $response = $this->actingAs($me)->get(route('student.rankings.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Student/Rankings/Index')
            ->has('globalLeaderboardAllAttempts.top')
            ->has('globalLeaderboardLatest.top')
            ->has('leaderboardByLevelAllAttempts.'.$basic->id.'.top')
            ->has('leaderboardByLevelLatest.'.$basic->id.'.top')
            ->where('globalLeaderboardAllAttempts.my_rank', 2)
            ->where('globalLeaderboardAllAttempts.top.0.user_name', 'Alice')
            ->where('globalLeaderboardAllAttempts.top.0.total_score', 95)
            ->where('globalLeaderboardAllAttempts.top.1.user_name', 'Me')
            ->where('globalLeaderboardLatest.my_rank', 1)
            ->where('globalLeaderboardLatest.top.0.user_name', 'Me')
            ->where('globalLeaderboardLatest.top.0.total_score', 80)
            ->where('globalLeaderboardLatest.top.1.user_name', 'Bob')
            ->where('globalLeaderboardLatest.top.2.user_name', 'Alice')
            ->where('leaderboardByLevelAllAttempts.'.$basic->id.'.my_rank', 2)
            ->where('leaderboardByLevelAllAttempts.'.$basic->id.'.top.0.user_name', 'Alice')
            ->where('leaderboardByLevelAllAttempts.'.$basic->id.'.top.0.total_score', 95)
            ->where('leaderboardByLevelAllAttempts.'.$basic->id.'.top.1.user_name', 'Me')
            ->where('leaderboardByLevelAllAttempts.'.$basic->id.'.top.2.user_name', 'Alice')
            ->where('leaderboardByLevelAllAttempts.'.$basic->id.'.top.2.total_score', 60)
            ->where('leaderboardByLevelLatest.'.$basic->id.'.my_rank', 1)
            ->where('leaderboardByLevelLatest.'.$basic->id.'.top.0.user_name', 'Me')
            ->where('leaderboardByLevelLatest.'.$basic->id.'.top.1.user_name', 'Alice'));
    }

    public function test_non_student_cannot_access_rankings_page(): void
    {
        $lecturer = User::factory()->create(['role' => UserRole::Lecturer]);

        $this->actingAs($lecturer)
            ->get(route('student.rankings.index'))
            ->assertForbidden();
    }
}

