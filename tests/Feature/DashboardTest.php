<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_dashboard(): void
    {
        $response = $this->get(route('dashboard'));

        $response->assertRedirect(route('login'));
    }

    public function test_student_sees_dashboard_with_student_analytics(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Student,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('role', 'student')
            ->has('lottieUrl')
            ->has('student', fn (Assert $s) => $s
                ->has('completedCount')
                ->has('inProgressCount')
                ->has('averageScorePercent')
                ->has('recentScores')
                ->has('scoresByLevel')
                ->has('dailyActivity')
                ->etc()));
    }

    public function test_lecturer_sees_dashboard_with_lecturer_analytics(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Lecturer,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('role', 'lecturer')
            ->has('lecturer', fn (Assert $l) => $l
                ->has('totalQuestions')
                ->has('activeQuestions')
                ->has('questionsBySkill')
                ->etc()));
    }

    public function test_admin_sees_dashboard_with_admin_analytics(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::Admin,
            'email_verified_at' => now(),
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('role', 'admin')
            ->has('auth.user', fn (Assert $u) => $u
                ->where('id', $user->id)
                ->where('email', $user->email)
                ->etc())
            ->has('admin', fn (Assert $a) => $a
                ->has('totalUsers')
                ->has('completedExamSessions')
                ->has('usersByRole', fn (Assert $r) => $r
                    ->has('admin')
                    ->has('lecturer')
                    ->has('student')
                    ->etc())
                ->etc()));
    }
}
