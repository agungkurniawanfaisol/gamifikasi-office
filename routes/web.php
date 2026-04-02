<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ExamHeaderController as AdminExamHeaderController;
use App\Http\Controllers\Admin\ExamSessionFeedbackController as AdminExamSessionFeedbackController;
use App\Http\Controllers\Lecturer\QuestionController as LecturerQuestionController;
use App\Http\Controllers\Student\ExamSessionController as StudentExamSessionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('users', AdminUserController::class)->except(['show']);
});

Route::middleware(['auth', 'verified', 'role:lecturer,admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::resource('exam-headers', AdminExamHeaderController::class)->only([
        'index',
        'create',
        'store',
        'show',
    ]);
    Route::get('/exam-session-feedback', [AdminExamSessionFeedbackController::class, 'index'])->name('exam-session-feedback.index');
});

Route::middleware(['auth', 'verified', 'role:lecturer,admin'])->prefix('lecturer')->name('lecturer.')->group(function () {
    Route::resource('questions', LecturerQuestionController::class)->except(['show']);
});

Route::middleware(['auth', 'verified', 'role:student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/exams', [StudentExamSessionController::class, 'index'])->name('exams.index');
    Route::get('/rankings', [StudentExamSessionController::class, 'rankings'])->name('rankings.index');
    Route::post('/exams/start', [StudentExamSessionController::class, 'start'])->name('exams.start');
    Route::get('/exams/{examSession}/feedback', [StudentExamSessionController::class, 'feedback'])->name('exams.feedback');
    Route::post('/exams/{examSession}/feedback', [StudentExamSessionController::class, 'storeFeedback'])->name('exams.feedback.store');
    Route::get('/exams/{examSession}', [StudentExamSessionController::class, 'show'])->name('exams.show');
    Route::post('/exams/answer', [StudentExamSessionController::class, 'answer'])->name('exams.answer');
    Route::post('/exams/complete', [StudentExamSessionController::class, 'complete'])->name('exams.complete');
});

require __DIR__.'/auth.php';
