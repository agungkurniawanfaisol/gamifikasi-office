<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ExamSessionFeedback;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExamSessionFeedbackController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user !== null && ($user->isAdmin() || $user->isLecturer()), 403);

        $feedbacks = ExamSessionFeedback::query()
            ->whereNotNull('submitted_at')
            ->with([
                'user:id,name,email',
                'examSession:id,level_id,total_score,max_possible_score,status,completed_at',
                'examSession.level:id,name',
            ])
            ->latest('submitted_at')
            ->paginate(15)
            ->withQueryString()
            ->through(function (ExamSessionFeedback $row): array {
                $session = $row->examSession;
                $level = $session?->level;

                return [
                    'id' => (int) $row->id,
                    'rating' => $row->rating,
                    'testimonial' => $row->testimonial,
                    'submitted_at' => $row->submitted_at?->toIso8601String(),
                    'completion_message' => $row->completion_message,
                    'ai_status' => $row->ai_status?->value,
                    'user' => [
                        'id' => (int) $row->user->id,
                        'name' => (string) $row->user->name,
                        'email' => (string) $row->user->email,
                    ],
                    'exam_session' => [
                        'id' => (int) ($session?->id ?? 0),
                        'total_score' => $session?->total_score,
                        'max_possible_score' => $session?->max_possible_score,
                        'status' => (string) ($session?->status?->value ?? ''),
                        'completed_at' => $session?->completed_at?->toIso8601String(),
                        'level' => $level !== null
                            ? [
                                'id' => (int) $level->id,
                                'name' => (string) $level->name,
                            ]
                            : null,
                    ],
                ];
            });

        return Inertia::render('Admin/ExamSessionFeedback/Index', [
            'feedbacks' => $feedbacks,
        ]);
    }
}
