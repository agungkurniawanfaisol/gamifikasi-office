<?php

namespace App\Enums;

enum AiFeedbackStatus: string
{
    case Pending = 'pending';
    case Generated = 'generated';
    case Reviewed = 'reviewed';
    case Approved = 'approved';
    case Rejected = 'rejected';
}
