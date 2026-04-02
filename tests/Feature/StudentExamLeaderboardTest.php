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

class StudentExamLeaderboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_shows_rank_for_all_attempt_rows_and_my_rank_uses_latest_session(): void
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

        $me = User::factory()->create(['role' => UserRole::Student, 'name' => 'Me']);
        $studentB = User::factory()->create(['role' => UserRole::Student, 'name' => 'Budi']);
        $studentC = User::factory()->create(['role' => UserRole::Student, 'name' => 'Caca']);

        // Two attempts from Budi should both appear in leaderboard rows.
        ExamSession::query()->create([
            'user_id' => $studentB->id,
            'level_id' => $level->id,
            'skill_category_id' => $skill->id,
            'status' => 'completed',
            'randomization_seed' => 1,
            'total_score' => 9,
            'max_possible_score' => 10,
            'started_at' => now()->subMinutes(10),
            'completed_at' => now()->subMinutes(8),
            'duration_seconds' => 120,
        ]);

        // Latest for Budi, lower than older one.
        ExamSession::query()->create([
            'user_id' => $studentB->id,
            'level_id' => $level->id,
            'skill_category_id' => $skill->id,
            'status' => 'completed',
            'randomization_seed' => 2,
            'total_score' => 6,
            'max_possible_score' => 10,
            'started_at' => now()->subMinutes(7),
            'completed_at' => now()->subMinutes(5),
            'duration_seconds' => 150,
        ]);

        // Me and Caca final sessions.
        ExamSession::query()->create([
            'user_id' => $me->id,
            'level_id' => $level->id,
            'skill_category_id' => $skill->id,
            'status' => 'completed',
            'randomization_seed' => 3,
            'total_score' => 8,
            'max_possible_score' => 10,
            'started_at' => now()->subMinutes(6),
            'completed_at' => now()->subMinutes(4),
            'duration_seconds' => 180,
        ]);

        ExamSession::query()->create([
            'user_id' => $studentC->id,
            'level_id' => $level->id,
            'skill_category_id' => $skill->id,
            'status' => 'timed_out',
            'randomization_seed' => 4,
            'total_score' => 7,
            'max_possible_score' => 10,
            'started_at' => now()->subMinutes(6),
            'completed_at' => now()->subMinutes(3),
            'duration_seconds' => 170,
        ]);

        $response = $this->actingAs($me)->get(route('student.exams.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Student/Exams/Index')
            ->where('leaderboardByLevel.'.$level->id.'.my_rank', 2)
            ->where('leaderboardByLevel.'.$level->id.'.top.0.user_name', 'Budi')
            ->where('leaderboardByLevel.'.$level->id.'.top.0.total_score', 9)
            ->where('leaderboardByLevel.'.$level->id.'.top.1.user_name', 'Me')
            ->where('leaderboardByLevel.'.$level->id.'.top.1.total_score', 8)
            ->where('leaderboardByLevel.'.$level->id.'.top.2.user_name', 'Caca')
            ->where('leaderboardByLevel.'.$level->id.'.top.3.user_name', 'Budi')
            ->where('leaderboardByLevel.'.$level->id.'.top.3.total_score', 6));
    }
}

