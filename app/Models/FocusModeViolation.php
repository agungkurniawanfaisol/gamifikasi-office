<?php

namespace App\Models;

use App\Enums\FocusViolationType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FocusModeViolation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'exam_session_id',
        'event_type',
        'occurred_at',
        'metadata',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'event_type' => FocusViolationType::class,
            'occurred_at' => 'datetime',
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }
}
