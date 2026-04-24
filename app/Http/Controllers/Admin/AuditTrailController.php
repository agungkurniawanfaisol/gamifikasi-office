<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AuditTrailIndexRequest;
use App\Models\AuditTrail;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class AuditTrailController extends Controller
{
    public function index(AuditTrailIndexRequest $request): Response
    {
        $filters = $this->normalizeFilters($request);
        $events = $this->queryEvents($filters);

        return Inertia::render('Admin/AuditTrails/Index', [
            'filters' => $filters,
            'events' => $events,
            'users' => User::query()
                ->select(['id', 'name', 'role'])
                ->orderBy('name')
                ->limit(150)
                ->get(),
        ]);
    }

    /**
     * @param  array<string,mixed>  $filters
     */
    private function queryEvents(array $filters): LengthAwarePaginator
    {
        return AuditTrail::query()
            ->select([
                'id',
                'user_id',
                'user_role',
                'event_type',
                'event_key',
                'route_name',
                'page_url',
                'menu_key',
                'element_key',
                'subject_type',
                'subject_id',
                'subject_label',
                'exam_session_id',
                'exam_header_id',
                'score_before',
                'score_after',
                'score_delta',
                'metadata',
                'occurred_at',
            ])
            ->with(['user:id,name,email'])
            ->when($filters['from'] !== null, fn ($query) => $query->whereDate('occurred_at', '>=', $filters['from']))
            ->when($filters['to'] !== null, fn ($query) => $query->whereDate('occurred_at', '<=', $filters['to']))
            ->when($filters['user_id'] !== null, fn ($query) => $query->where('user_id', $filters['user_id']))
            ->when($filters['user_role'] !== null, fn ($query) => $query->where('user_role', $filters['user_role']))
            ->when($filters['event_type'] !== null, fn ($query) => $query->where('event_type', $filters['event_type']))
            ->when($filters['event_key'] !== null, fn ($query) => $query->where('event_key', 'like', '%'.$filters['event_key'].'%'))
            ->when($filters['route_name'] !== null, fn ($query) => $query->where('route_name', 'like', '%'.$filters['route_name'].'%'))
            ->when($filters['menu_key'] !== null, fn ($query) => $query->where('menu_key', 'like', '%'.$filters['menu_key'].'%'))
            ->when($filters['exam_session_id'] !== null, fn ($query) => $query->where('exam_session_id', $filters['exam_session_id']))
            ->when($filters['score_min'] !== null, fn ($query) => $query->where('score_after', '>=', $filters['score_min']))
            ->when($filters['score_max'] !== null, fn ($query) => $query->where('score_after', '<=', $filters['score_max']))
            ->orderByDesc('occurred_at')
            ->paginate(30)
            ->withQueryString();
    }

    /**
     * @return array{
     *     from:string|null,to:string|null,user_id:int|null,user_role:string|null,event_type:string|null,
     *     event_key:string|null,route_name:string|null,menu_key:string|null,exam_session_id:int|null,
     *     score_min:int|null,score_max:int|null
     * }
     */
    private function normalizeFilters(AuditTrailIndexRequest $request): array
    {
        $today = CarbonImmutable::today()->toDateString();
        $from = trim($request->string('from')->toString());
        $to = trim($request->string('to')->toString());

        return [
            'from' => $from !== '' ? $from : $today,
            'to' => $to !== '' ? $to : $today,
            'user_id' => $request->filled('user_id') ? (int) $request->integer('user_id') : null,
            'user_role' => $this->nullableString($request->string('user_role')->toString()),
            'event_type' => $this->nullableString($request->string('event_type')->toString()),
            'event_key' => $this->nullableString($request->string('event_key')->toString()),
            'route_name' => $this->nullableString($request->string('route_name')->toString()),
            'menu_key' => $this->nullableString($request->string('menu_key')->toString()),
            'exam_session_id' => $request->filled('exam_session_id') ? (int) $request->integer('exam_session_id') : null,
            'score_min' => $request->filled('score_min') ? (int) $request->integer('score_min') : null,
            'score_max' => $request->filled('score_max') ? (int) $request->integer('score_max') : null,
        ];
    }

    private function nullableString(string $value): ?string
    {
        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
