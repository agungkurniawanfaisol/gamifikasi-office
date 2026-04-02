<?php

namespace App\Enums;

enum FocusViolationType: string
{
    case TabSwitch = 'tab_switch';
    case WindowBlur = 'window_blur';
    case VisibilityHidden = 'visibility_hidden';
    case CopyAttempt = 'copy_attempt';
}
