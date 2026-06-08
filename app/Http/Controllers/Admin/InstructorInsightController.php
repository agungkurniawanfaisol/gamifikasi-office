<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\SharesInertiaAuthPayload;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\InstructorInsightIndexRequest;
use App\Services\Monitoring\InstructorInsightService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InstructorInsightController extends Controller
{
    use SharesInertiaAuthPayload;

    public function __construct(
        private readonly InstructorInsightService $insightService,
    ) {
    }

    public function index(InstructorInsightIndexRequest $request): Response
    {
        $filters = $this->normalizeFilters($request);
        $insights = $this->insightService->buildInsights($filters, $request->user());

        return Inertia::render('Admin/InstructorInsights/Index', [
            ...$this->inertiaAuthPayload($request),
            'filters' => $filters,
            ...$insights,
        ]);
    }

    /**
     * @return array{window:string,from:string,to:string,level_id:int|null,min_attempts:int}
     */
    private function normalizeFilters(Request $request): array
    {
        $today = CarbonImmutable::today();
        $window = (string) $request->input('window', '7d');

        $resolvedWindow = in_array($window, ['7d', '30d', 'custom'], true) ? $window : '7d';

        $defaultFrom = $resolvedWindow === '30d'
            ? $today->subDays(29)->toDateString()
            : $today->subDays(6)->toDateString();
        $defaultTo = $today->toDateString();

        return [
            'window' => $resolvedWindow,
            'from' => (string) $request->input('from', $defaultFrom),
            'to' => (string) $request->input('to', $defaultTo),
            'level_id' => $request->filled('level_id') ? (int) $request->integer('level_id') : null,
            'min_attempts' => max(
                1,
                (int) $request->integer('min_attempts', InstructorInsightService::DEFAULT_MIN_ATTEMPTS),
            ),
        ];
    }
}

