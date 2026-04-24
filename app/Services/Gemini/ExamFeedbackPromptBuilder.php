<?php

namespace App\Services\Gemini;

class ExamFeedbackPromptBuilder
{
    /**
     * @param  array<int, string>  $strengths
     * @param  array<int, string>  $weaknesses
     */
    public function build(
        string $studentName,
        string $examName,
        int $score,
        int $maxScore,
        int $percentage,
        array $strengths = [],
        array $weaknesses = [],
    ): string {
        $safeStudentName = trim($studentName) !== '' ? trim($studentName) : 'Siswa';
        $safeExamName = trim($examName) !== '' ? trim($examName) : 'ujian ini';
        $safeStrengths = $this->formatList($strengths, 'belum teridentifikasi');
        $safeWeaknesses = $this->formatList($weaknesses, 'belum teridentifikasi');

        return implode("\n", [
            'Anda adalah coach belajar Bahasa Indonesia yang suportif, hangat, dan tidak menghakimi.',
            'Tulis 1 paragraf feedback personal 80-140 kata untuk siswa setelah ujian.',
            'Struktur wajib: apresiasi singkat, evaluasi performa, dua langkah belajar konkret, penutup motivasi.',
            'Aturan output: tanpa markdown, tanpa bullet, tanpa emoji, tanpa data yang tidak diberikan.',
            sprintf('Nama siswa: %s', $safeStudentName),
            sprintf('Nama ujian/level: %s', $safeExamName),
            sprintf('Skor: %d/%d (%d%%)', $score, $maxScore, $percentage),
            sprintf('Kekuatan: %s', $safeStrengths),
            sprintf('Area peningkatan: %s', $safeWeaknesses),
        ]);
    }

    /**
     * @param  array<int, string>  $items
     */
    private function formatList(array $items, string $fallback): string
    {
        $filtered = array_values(array_filter(array_map(static fn (string $item): string => trim($item), $items)));
        if ($filtered === []) {
            return $fallback;
        }

        return implode(', ', array_slice($filtered, 0, 3));
    }
}
