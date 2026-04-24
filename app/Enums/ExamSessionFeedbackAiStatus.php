<?php

namespace App\Enums;

enum ExamSessionFeedbackAiStatus: string
{
    case Pending = 'pending';
    case Ready = 'ready';
    case Failed = 'failed';
}
