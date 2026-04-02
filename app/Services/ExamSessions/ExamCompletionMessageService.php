<?php

namespace App\Services\ExamSessions;

use App\Models\ExamSession;

class ExamCompletionMessageService
{
    /**
     * Placeholder messages until Gemini integration (same method signature).
     */
    public function messageForSession(ExamSession $session): string
    {
        $score = (int) ($session->total_score ?? 0);
        $max = max(1, (int) ($session->max_possible_score ?? 1));
        $pct = (int) round(($score / $max) * 100);

        $templates = [
            'Kerja bagus! Kamu sudah menyelesaikan ujian ini dengan sungguh-sungguh.',
            'Terima kasih telah mengikuti ujian. Tetap semangat belajar dan evaluasi hasilmu.',
            'Ujian selesai. Gunakan hasil ini sebagai bahan refleksi untuk langkah berikutnya.',
            'Bagus! Kamu telah menyelesaikan sesi ini. Istirahat sejenak, lalu lanjutkan latihan.',
            'Selesai! Setiap percobaan adalah langkah menuju pemahaman yang lebih baik.',
        ];

        $pick = $templates[array_rand($templates)];

        return sprintf(
            '%s Skor kamu: %d/%d (%d%%).',
            $pick,
            $score,
            $max,
            $pct
        );
    }
}
