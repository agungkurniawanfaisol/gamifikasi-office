<?php

namespace App\Http\Middleware;

use App\Services\Audit\AuditTrailService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditTrailRequestMiddleware
{
    public function __construct(
        private readonly AuditTrailService $auditTrailService,
    ) {
    }

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $user = $request->user();

        if ($user === null || $request->isMethod('GET')) {
            return $response;
        }

        if ($request->routeIs('audit-trails.events.store')) {
            return $response;
        }

        $this->auditTrailService->record(
            payload: [
                'event_type' => 'backend_action',
                'event_key' => 'http.'.$request->method(),
                'subject_type' => 'route',
                'subject_label' => $request->route()?->getName(),
                'metadata' => [
                    'method' => $request->method(),
                    'status' => $response->getStatusCode(),
                    'path' => $request->path(),
                ],
            ],
            actor: $user,
            request: $request,
        );

        return $response;
    }
}
