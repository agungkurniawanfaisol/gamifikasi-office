<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StudentMonitoringIndexRequest;
use App\Models\User;
use App\Services\Monitoring\StudentMonitoringQueryService;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class StudentMonitoringController extends Controller
{
    public function __construct(
        private readonly StudentMonitoringQueryService $queryService,
    ) {
    }

    public function index(StudentMonitoringIndexRequest $request): Response
    {
        $filters = $this->normalizeFilters($request);

        return Inertia::render('Admin/StudentMonitoring/Index', [
            'filters' => $filters,
            'summary' => $this->queryService->summaryCards($filters),
            'attempts' => $this->queryService->attemptList($filters),
            'selectedStudent' => null,
            'details' => [],
        ]);
    }

    public function show(StudentMonitoringIndexRequest $request, User $student): Response
    {
        abort_unless($student->role === UserRole::Student, 404);

        $filters = $this->normalizeFilters($request);

        return Inertia::render('Admin/StudentMonitoring/Index', [
            'filters' => $filters,
            'summary' => $this->queryService->summaryCards($filters),
            'attempts' => $this->queryService->attemptList($filters),
            'selectedStudent' => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
            ],
            'details' => $this->queryService->detailRows($student, $filters),
        ]);
    }

    /**
     * @return array{from:string,to:string,source:string,search:?string,page:int,per_page:int}
     */
    private function normalizeFilters(StudentMonitoringIndexRequest $request): array
    {
        $today = CarbonImmutable::today();
        $from = $request->string('from')->toString();
        $to = $request->string('to')->toString();

        return [
            'from' => $from !== '' ? $from : $today->toDateString(),
            'to' => $to !== '' ? $to : $today->toDateString(),
            'source' => $request->string('source')->toString() ?: 'all',
            'search' => $request->filled('search')
                ? trim($request->string('search')->toString())
                : null,
            'page' => max(1, (int) $request->integer('page', 1)),
            'per_page' => 10,
        ];
    }
}
