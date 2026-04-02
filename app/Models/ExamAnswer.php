<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ExamAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_session_id',
        'exam_session_question_id',
        'question_id',
        'selected_option_id',
        'answer_text',
        'is_correct',
        'score',
        'answered_at',
        'time_spent_seconds',
    ];

    protected function casts(): array
    {
        return [
            'is_correct' => 'boolean',
            'score' => 'integer',
            'answered_at' => 'datetime',
            'time_spent_seconds' => 'integer',
        ];
    }

    public function examSession(): BelongsTo
    {
        return $this->belongsTo(ExamSession::class);
    }

    public function sessionQuestion(): BelongsTo
    {
        return $this->belongsTo(ExamSessionQuestion::class, 'exam_session_question_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function selectedOption(): BelongsTo
    {
        return $this->belongsTo(QuestionOption::class, 'selected_option_id');
    }

    public function aiFeedback(): HasOne
    {
        return $this->hasOne(AiFeedback::class);
    }
}
