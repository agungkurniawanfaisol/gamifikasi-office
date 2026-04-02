<?php

namespace App\Http\Controllers;

use App\Services\Dashboard\DashboardAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardAnalyticsService $dashboardAnalytics,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Dashboard', [
            'role' => $user->role->value,
            'lottieUrl' => config('app.dashboard_lottie_url'),
            ...$this->dashboardAnalytics->forUser($user),
        ]);
    }
}
