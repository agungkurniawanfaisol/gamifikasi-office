<?php

namespace App\Services\Gemini;

use App\Models\ExamSession;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;
use RuntimeException;
use Throwable;

class GeminiFeedbackService
{
    public function __construct(
        private readonly HttpFactory $http,
        private readonly ExamFeedbackPromptBuilder $promptBuilder,
    ) {}

    /**
     * @return array{text:string,model:string}
     */
    public function generateForSession(ExamSession $session): array
    {
        $apiKey = (string) config('services.gemini.api_key', '');
        if ($apiKey === '') {
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $score = (int) ($session->total_score ?? 0);
        $maxScore = max(1, (int) ($session->max_possible_score ?? 1));
        $percentage = (int) round(($score / $maxScore) * 100);

        $prompt = $this->promptBuilder->build(
            studentName: (string) ($session->user?->name ?? 'Siswa'),
            examName: (string) ($session->level?->name ?? 'Ujian'),
            score: $score,
            maxScore: $maxScore,
            percentage: $percentage,
        );

        $timeout = max(1, (int) config('services.gemini.timeout', 20));
        $models = $this->resolveModels();
        $lastException = null;

        foreach ($models as $index => $model) {
            try {
                $text = $this->generateWithModel(
                    apiKey: $apiKey,
                    prompt: $prompt,
                    model: $model,
                    timeout: $timeout,
                );

                return [
                    'text' => $text,
                    'model' => $model,
                ];
            } catch (Throwable $exception) {
                $lastException = $exception;
                if (! $this->shouldTryNextModel($exception, $index, count($models))) {
                    throw $exception;
                }
            }
        }

        if ($lastException instanceof Throwable) {
            throw $lastException;
        }

        throw new RuntimeException('Gemini generation failed without a specific error.');
    }

    /**
     * @return array<int, string>
     */
    private function resolveModels(): array
    {
        $primary = trim((string) config('services.gemini.model', 'gemini-2.5-flash'));
        $fallbacks = config('services.gemini.fallback_models', []);
        $fallbackModels = is_array($fallbacks) ? $fallbacks : [];

        $normalized = array_values(array_filter(array_map(
            static fn (mixed $model): string => trim((string) $model),
            array_merge([$primary], $fallbackModels)
        )));

        return array_values(array_unique($normalized));
    }

    private function generateWithModel(
        string $apiKey,
        string $prompt,
        string $model,
        int $timeout,
    ): string {
        $url = sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent',
            $model,
        );

        $response = $this->http
            ->timeout($timeout)
            ->withQueryParameters(['key' => $apiKey])
            ->post($url, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => 0.5,
                    'topP' => 0.9,
                    'maxOutputTokens' => 240,
                ],
            ]);

        $response->throw();

        $text = trim((string) data_get($response->json(), 'candidates.0.content.parts.0.text', ''));
        if ($text === '') {
            throw new RuntimeException('Gemini returned empty feedback text.');
        }

        return $this->normalize($text);
    }

    private function shouldTryNextModel(Throwable $exception, int $index, int $totalModels): bool
    {
        if ($index >= $totalModels - 1) {
            return false;
        }

        if (! $exception instanceof RequestException) {
            return false;
        }

        $status = $exception->response?->status();

        return in_array($status, [429, 503], true);
    }

    private function normalize(string $text): string
    {
        $singleLine = preg_replace('/\s+/', ' ', $text);

        return trim((string) $singleLine);
    }
}
