<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SharesInertiaAuthPayload;
use App\Services\Dashboard\DashboardAnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use SharesInertiaAuthPayload;

    public function __construct(
        private readonly DashboardAnalyticsService $dashboardAnalytics,
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Dashboard', [
            ...$this->inertiaAuthPayload($request),
            'role' => $user->role->value,
            'lottieUrl' => config('app.dashboard_lottie_url'),
            ...$this->dashboardAnalytics->forUser($user),
        ]);
    }
}
