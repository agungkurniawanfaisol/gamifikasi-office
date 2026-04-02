<?php

namespace App\Enums;

enum MediaType: string
{
    case Image = 'image';
    case Audio = 'audio';
    case Video = 'video';
}
