<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Lecturer = 'lecturer';
    case Student = 'student';
}
