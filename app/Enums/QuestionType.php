<?php

namespace App\Enums;

enum QuestionType: string
{
    case MultipleChoice = 'multiple_choice';
    case Essay = 'essay';
    case FillBlank = 'fill_blank';
    case TrueFalse = 'true_false';
}
