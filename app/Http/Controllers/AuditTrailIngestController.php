<?php

namespace App\Http\Controllers;

use App\Http\Requests\Audit\StoreAuditTrailEventRequest;
use App\Services\Audit\AuditTrailService;
use Illuminate\Http\JsonResponse;

class AuditTrailIngestController extends Controller
{
    public function __construct(
        private readonly AuditTrailService $auditTrailService,
    ) {
    }

    public function store(StoreAuditTrailEventRequest $request): JsonResponse
    {
        $this->auditTrailService->record(
            payload: $request->validated(),
            actor: $request->user(),
            request: $request,
        );

        return response()->json(['ok' => true]);
    }
}
