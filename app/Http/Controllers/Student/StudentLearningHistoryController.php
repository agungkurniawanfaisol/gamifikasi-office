<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Http\Requests\Student\StudentLearningHistoryIndexRequest;
use App\Services\Monitoring\StudentLearningHistoryService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentLearningHistoryController extends Controller
{
    public function __construct(
        private readonly StudentLearningHistoryService $historyService,
    ) {
    }

    public function index(StudentLearningHistoryIndexRequest $request): Response
    {
        $filters = $this->normalizeFilters($request);
        $student = $request->user();

        return Inertia::render('Student/LearningHistory/Index', [
            'filters' => $filters,
            'summary' => $this->historyService->summaryCards($student->id, $filters),
            'targets' => $this->historyService->targetSummary($student->id, $filters),
            'attempts' => $this->historyService->attemptList($student->id, $filters),
            'details' => $this->historyService->detailRows($student->id, $filters),
        ]);
    }

    public function export(StudentLearningHistoryIndexRequest $request): StreamedResponse
    {
        $filters = $this->normalizeFilters($request);
        $student = $request->user();
        $rows = $this->historyService->exportRows($student->id, $filters);
        $fileName = 'learning-history-'.$student->id.'-'.now()->format('Ymd_His').'.csv';

        return response()->streamDownload(
            function () use ($rows): void {
                $stream = fopen('php://output', 'w');
                if ($stream === false) {
                    abort(HttpResponse::HTTP_INTERNAL_SERVER_ERROR, 'Tidak bisa membuat stream CSV.');
                }

                fputcsv($stream, [
                    'source',
                    'attempt_label',
                    'question',
                    'selected_option',
                    'correct_option',
                    'is_correct',
                    'answered_at',
                ]);

                foreach ($rows as $row) {
                    fputcsv($stream, [
                        $row['source'],
                        $row['attempt_label'],
                        $row['question'],
                        $row['selected_option'],
                        $row['correct_option'],
                        $row['is_correct'] ? 'Benar' : 'Salah',
                        $row['answered_at'],
                    ]);
                }

                fclose($stream);
            },
            $fileName,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ],
        );
    }

    /**
     * @return array{
     *     from:string,
     *     to:string,
     *     source:string,
     *     search:?string,
     *     page:int,
     *     per_page:int,
     *     attempt_source:?string,
     *     attempt_id:?int
     * }
     */
    private function normalizeFilters(StudentLearningHistoryIndexRequest $request): array
    {
        $today = CarbonImmutable::today()->toDateString();
        $from = $request->string('from')->toString();
        $to = $request->string('to')->toString();
        $attemptSource = $request->string('attempt_source')->toString();
        $attemptId = $request->input('attempt_id');

        return [
            'from' => $from !== '' ? $from : $today,
            'to' => $to !== '' ? $to : $today,
            'source' => $request->string('source')->toString() ?: 'all',
            'search' => $request->filled('search')
                ? trim($request->string('search')->toString())
                : null,
            'page' => max(1, (int) $request->integer('page', 1)),
            'per_page' => 10,
            'attempt_source' => $attemptSource !== '' ? $attemptSource : null,
            'attempt_id' => is_numeric($attemptId) ? (int) $attemptId : null,
        ];
    }
}
