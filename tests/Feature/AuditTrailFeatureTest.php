<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\AuditTrail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditTrailFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_ingest_ui_click_event(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);

        $response = $this->actingAs($student)->postJson(route('audit-trails.events.store'), [
            'event_type' => 'ui_click',
            'event_key' => 'menu.click',
            'menu_key' => 'student.exams',
            'element_key' => 'a[audit=sidebar-nav-item]',
            'page_url' => 'http://localhost/student/exams',
            'click_x' => 180,
            'click_y' => 240,
            'metadata' => [
                'path' => '/student/exams',
            ],
        ]);

        $response->assertOk()->assertJson(['ok' => true]);
        $this->assertDatabaseHas('audit_trails', [
            'user_id' => $student->id,
            'event_type' => 'ui_click',
            'event_key' => 'menu.click',
            'menu_key' => 'student.exams',
        ]);
    }

    public function test_student_cannot_open_audit_trail_page(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);

        $this->actingAs($student)
            ->get(route('admin.audit-trails.index'))
            ->assertForbidden();
    }

    public function test_lecturer_can_filter_audit_trail_by_event_and_score(): void
    {
        $lecturer = User::factory()->create(['role' => UserRole::Lecturer]);
        $student = User::factory()->create(['role' => UserRole::Student]);

        AuditTrail::query()->create([
            'user_id' => $student->id,
            'user_role' => UserRole::Student->value,
            'event_type' => 'score_event',
            'event_key' => 'exam.complete',
            'score_after' => 8,
            'occurred_at' => now(),
        ]);
        AuditTrail::query()->create([
            'user_id' => $student->id,
            'user_role' => UserRole::Student->value,
            'event_type' => 'ui_click',
            'event_key' => 'ui.click',
            'score_after' => null,
            'occurred_at' => now(),
        ]);

        $response = $this->actingAs($lecturer)->get(route('admin.audit-trails.index', [
            'event_type' => 'score_event',
            'score_min' => 7,
        ]));

        $response->assertOk();
        $response->assertSee('score_event');
        $response->assertDontSee('ui.click');
    }
}
