<?php

namespace App\Enums;

enum ExamStatus: string
{
    case InProgress = 'in_progress';
    case Completed = 'completed';
    case Abandoned = 'abandoned';
    case TimedOut = 'timed_out';
}
