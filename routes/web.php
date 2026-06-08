<?php

use App\Http\Controllers\Admin\ExamHeaderController as AdminExamHeaderController;
use App\Http\Controllers\Admin\ExamSessionFeedbackController as AdminExamSessionFeedbackController;
use App\Http\Controllers\Admin\StudentMonitoringController as AdminStudentMonitoringController;
use App\Http\Controllers\Admin\InstructorInsightController as AdminInstructorInsightController;
use App\Http\Controllers\Admin\AuditTrailController as AdminAuditTrailController;
use App\Http\Controllers\AuditTrailIngestController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Lecturer\QuestionController as LecturerQuestionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Student\DailyActivityController as StudentDailyActivityController;
use App\Http\Controllers\Student\ExamFocusEventController;
use App\Http\Controllers\Student\ExamSessionController as StudentExamSessionController;
use App\Http\Controllers\Student\PriorityPracticeController as StudentPriorityPracticeController;
use App\Http\Controllers\Student\StudentLearningHistoryController as StudentLearningHistoryController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
| Public JSON health check (same stack as other web routes).
| Use when diagnosing deploy: if this works but pages fail, suspect assets/Inertia.
| Registered here (not only routes/api.php) so shared hosts never miss the route file.
*/
Route::get('/api/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'laravel',
        'timestamp' => now()->toIso8601String(),
        'laravel' => Application::VERSION,
        'php' => PHP_VERSION,
    ]);
})->name('api.health');

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'audit'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin', 'audit'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', AdminUserController::class)->except(['show']);
});

Route::middleware(['auth', 'verified', 'role:lecturer,admin', 'audit'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('exam-headers', AdminExamHeaderController::class)->only([
        'index',
        'create',
        'store',
        'show',
    ]);
    Route::get('/exam-session-feedback', [AdminExamSessionFeedbackController::class, 'index'])->name('exam-session-feedback.index');
    Route::get('/student-monitoring', [AdminStudentMonitoringController::class, 'index'])->name('student-monitoring.index');
    Route::get('/student-monitoring/{student}', [AdminStudentMonitoringController::class, 'show'])->name('student-monitoring.show');
    Route::get('/instructor-insights', [AdminInstructorInsightController::class, 'index'])->name('instructor-insights.index');
    Route::get('/audit-trails', [AdminAuditTrailController::class, 'index'])->name('audit-trails.index');
});

Route::middleware(['auth', 'verified', 'role:lecturer,admin', 'audit'])->prefix('lecturer')->name('lecturer.')->group(function () {
    Route::resource('questions', LecturerQuestionController::class)->except(['show']);
});

Route::middleware(['auth', 'verified', 'role:student', 'audit'])->prefix('student')->name('student.')->group(function () {
    Route::get('/priority-practice', [StudentPriorityPracticeController::class, 'index'])->name('priority-practice.index');
    Route::post('/priority-practice', [StudentPriorityPracticeController::class, 'store'])->name('priority-practice.store');
    Route::post('/priority-practice/answer', [StudentPriorityPracticeController::class, 'answer'])->name('priority-practice.answer');

    Route::get('/learning-history', [StudentLearningHistoryController::class, 'index'])->name('learning-history.index');
    Route::get('/learning-history/export', [StudentLearningHistoryController::class, 'export'])->name('learning-history.export');

    Route::get('/daily-activity', [StudentDailyActivityController::class, 'index'])->name('daily-activity.index');
    Route::post('/daily-activity/start', [StudentDailyActivityController::class, 'start'])->name('daily-activity.start');
    Route::post('/daily-activity/answer', [StudentDailyActivityController::class, 'answer'])->name('daily-activity.answer');
    Route::post('/daily-activity/complete', [StudentDailyActivityController::class, 'complete'])->name('daily-activity.complete');

    Route::get('/exams', [StudentExamSessionController::class, 'index'])->name('exams.index');
    Route::get('/rankings', [StudentExamSessionController::class, 'rankings'])->name('rankings.index');
    Route::post('/exams/start', [StudentExamSessionController::class, 'start'])->name('exams.start');
    Route::post('/exams/{examSession}/focus-events', [ExamFocusEventController::class, 'store'])->name('exams.focus-events.store');
    Route::get('/exams/{examSession}/feedback', [StudentExamSessionController::class, 'feedback'])->name('exams.feedback');
    Route::post('/exams/{examSession}/feedback', [StudentExamSessionController::class, 'storeFeedback'])->name('exams.feedback.store');
    Route::get('/exams/{examSession}', [StudentExamSessionController::class, 'show'])->name('exams.show');
    Route::post('/exams/answer', [StudentExamSessionController::class, 'answer'])->name('exams.answer');
    Route::post('/exams/complete', [StudentExamSessionController::class, 'complete'])->name('exams.complete');
});

Route::middleware(['auth', 'verified'])->post('/audit-trails/events', [AuditTrailIngestController::class, 'store'])
    ->name('audit-trails.events.store');

require __DIR__.'/auth.php';
