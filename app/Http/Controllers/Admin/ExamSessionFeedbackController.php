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
            ->withQueryString();

        return Inertia::render('Admin/ExamSessionFeedback/Index', [
            'feedbacks' => $feedbacks,
        ]);
    }
}
