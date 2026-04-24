<?php

namespace App\Services\ExamSessions;

use App\Models\ExamSession;

class ExamCompletionMessageService
{
    public function messageForSession(ExamSession $session): string
    {
        $score = (int) ($session->total_score ?? 0);
        $max = max(1, (int) ($session->max_possible_score ?? 1));
        $pct = (int) round(($score / $max) * 100);

        $opening = $this->openingForPercentage($pct);

        return sprintf(
            '%s Skor kamu saat ini %d/%d (%d%%). Pertahankan ritme belajar dan fokus pada materi yang belum konsisten agar hasil berikutnya lebih kuat.',
            $opening,
            $score,
            $max,
            $pct
        );
    }

    private function openingForPercentage(int $percentage): string
    {
        if ($percentage >= 85) {
            return 'Luar biasa, performa kamu sangat kuat di sesi ini.';
        }

        if ($percentage >= 65) {
            return 'Bagus, fondasi kamu sudah terlihat dan tinggal dipertajam.';
        }

        return 'Terima kasih sudah menuntaskan sesi ini dengan usaha yang baik.';
    }
}
