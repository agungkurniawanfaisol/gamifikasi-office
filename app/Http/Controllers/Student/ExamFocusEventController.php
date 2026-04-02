<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\StoreExamFocusEventRequest;
use App\Models\ExamSession;
use App\Models\FocusModeViolation;
use Illuminate\Http\JsonResponse;

class ExamFocusEventController extends Controller
{
    public function store(StoreExamFocusEventRequest $request, ExamSession $examSession): JsonResponse
    {
        $validated = $request->validated();

        FocusModeViolation::query()->create([
            'exam_session_id' => $examSession->id,
            'event_type' => $validated['event_type'],
            'occurred_at' => now(),
            'metadata' => $validated['metadata'] ?? null,
            'created_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }
}
