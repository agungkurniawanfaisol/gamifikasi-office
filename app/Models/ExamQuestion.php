<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExamQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_header_id',
        'question_id',
        'duration_per_question',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'exam_header_id' => 'integer',
            'question_id' => 'integer',
            'duration_per_question' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function examHeader(): BelongsTo
    {
        return $this->belongsTo(ExamHeader::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}

