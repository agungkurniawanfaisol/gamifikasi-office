<?php

namespace App\Enums;

enum BadgeCriteriaType: string
{
    case MinScore = 'min_score';
    case TotalSessions = 'total_sessions';
    case PerfectScore = 'perfect_score';
    case LevelComplete = 'level_complete';
}
