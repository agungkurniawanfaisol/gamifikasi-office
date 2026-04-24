<?php

namespace App\Services\Audit;

use App\Models\AuditTrail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AuditTrailService
{
    /**
     * @param  array<string,mixed>  $payload
     */
    public function record(array $payload, ?User $actor = null, ?Request $request = null): AuditTrail
    {
        $requestContext = $request ?? request();
        $activeUser = $actor ?? $requestContext->user();
        $scoreBefore = $this->toNullableInt($payload['score_before'] ?? null);
        $scoreAfter = $this->toNullableInt($payload['score_after'] ?? null);
        $scoreDelta = $this->toNullableInt($payload['score_delta'] ?? null);

        if ($scoreBefore !== null && $scoreAfter !== null && $scoreDelta === null) {
            $scoreDelta = $scoreAfter - $scoreBefore;
        }

        return AuditTrail::query()->create([
            'user_id' => $activeUser?->id,
            'user_role' => $activeUser?->role?->value,
            'session_id' => $requestContext->session()->getId(),
            'request_id' => (string) $requestContext->headers->get('X-Request-Id', ''),
            'event_type' => (string) ($payload['event_type'] ?? 'backend_action'),
            'event_key' => (string) ($payload['event_key'] ?? 'unknown'),
            'route_name' => $requestContext->route()?->getName(),
            'page_url' => (string) ($payload['page_url'] ?? $requestContext->fullUrl()),
            'menu_key' => $this->toNullableString($payload['menu_key'] ?? null),
            'element_key' => $this->toNullableString($payload['element_key'] ?? null),
            'click_x' => $this->toNullableInt($payload['click_x'] ?? null),
            'click_y' => $this->toNullableInt($payload['click_y'] ?? null),
            'subject_type' => $this->toNullableString($payload['subject_type'] ?? null),
            'subject_id' => $this->toNullableInt($payload['subject_id'] ?? null),
            'subject_label' => $this->toNullableString($payload['subject_label'] ?? null),
            'exam_session_id' => $this->toNullableInt($payload['exam_session_id'] ?? null),
            'exam_header_id' => $this->toNullableInt($payload['exam_header_id'] ?? null),
            'score_before' => $scoreBefore,
            'score_after' => $scoreAfter,
            'score_delta' => $scoreDelta,
            'ip_address' => $requestContext->ip(),
            'user_agent' => $requestContext->userAgent(),
            'metadata' => is_array($payload['metadata'] ?? null) ? $payload['metadata'] : null,
            'occurred_at' => $this->resolveOccurredAt($payload['occurred_at'] ?? null),
        ]);
    }

    private function resolveOccurredAt(mixed $occurredAt): Carbon
    {
        if (is_string($occurredAt) && $occurredAt !== '') {
            return Carbon::parse($occurredAt);
        }

        return now();
    }

    private function toNullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function toNullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
