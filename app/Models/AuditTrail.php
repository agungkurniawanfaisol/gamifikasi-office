<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditTrail extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'user_role',
        'session_id',
        'request_id',
        'event_type',
        'event_key',
        'route_name',
        'page_url',
        'menu_key',
        'element_key',
        'click_x',
        'click_y',
        'subject_type',
        'subject_id',
        'subject_label',
        'exam_session_id',
        'exam_header_id',
        'score_before',
        'score_after',
        'score_delta',
        'ip_address',
        'user_agent',
        'metadata',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'occurred_at' => 'datetime',
            'score_before' => 'integer',
            'score_after' => 'integer',
            'score_delta' => 'integer',
            'click_x' => 'integer',
            'click_y' => 'integer',
            'exam_session_id' => 'integer',
            'exam_header_id' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    public function examHeader(): BelongsTo
    {
        return $this->belongsTo(ExamHeader::class);
    }
}
