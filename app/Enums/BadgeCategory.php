<?php

namespace App\Enums;

enum BadgeCategory: string
{
    case Score = 'score';
    case Streak = 'streak';
    case Completion = 'completion';
    case Special = 'special';
}
