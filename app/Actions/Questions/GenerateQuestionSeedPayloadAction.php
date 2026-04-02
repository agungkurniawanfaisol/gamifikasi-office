<?php

namespace App\Actions\Questions;

use App\Enums\QuestionType;

class GenerateQuestionSeedPayloadAction
{
    /**
     * @param  array{skill:string,level:string,variant:int}  $context
     * @return array{
     *   question_text:string,
     *   narrative_text:string,
     *   explanation:string,
     *   options:array<int,array{option_text:string,is_correct:bool,order:int}>
     * }
     */
    public function execute(QuestionType $type, array $context): array
    {
        $topic = $this->pick([
            'daily routine',
            'campus life',
            'technology trends',
            'healthy lifestyle',
            'public transportation',
            'environmental awareness',
            'team collaboration',
            'digital communication',
            'time management',
            'creative hobbies',
        ]);

        $scenario = "{$context['skill']} - {$context['level']} set #{$context['variant']}";

        return match ($type) {
            QuestionType::MultipleChoice => $this->multipleChoicePayload($topic, $scenario),
            QuestionType::TrueFalse => $this->trueFalsePayload($topic, $scenario),
            QuestionType::Essay => $this->essayPayload($topic, $scenario),
            QuestionType::FillBlank => $this->fillBlankPayload($topic, $scenario),
        };
    }

    /**
     * @return array{
     *   question_text:string,
     *   narrative_text:string,
     *   explanation:string,
     *   options:array<int,array{option_text:string,is_correct:bool,order:int}>
     * }
     */
    private function multipleChoicePayload(string $topic, string $scenario): array
    {
        $templates = [
            "Which sentence best summarizes the main idea about {$topic}?",
            "Choose the best response for the context of {$topic}.",
            "Which option is the most accurate statement about {$topic}?",
        ];
        $questionText = $this->pick($templates)." ({$scenario})";

        $correct = $this->pick([
            'It provides a clear and specific explanation.',
            'It gives practical details and supports the claim.',
            'It is relevant and logically connected to the context.',
        ]);

        $distractors = [
            'It repeats the question without adding information.',
            'It contains unrelated ideas and no clear focus.',
            'It uses vague language and no concrete evidence.',
        ];
        shuffle($distractors);

        $options = [
            ['option_text' => $correct, 'is_correct' => true, 'order' => 1],
            ['option_text' => $distractors[0], 'is_correct' => false, 'order' => 2],
            ['option_text' => $distractors[1], 'is_correct' => false, 'order' => 3],
            ['option_text' => $distractors[2], 'is_correct' => false, 'order' => 4],
        ];
        shuffle($options);

        foreach ($options as $idx => &$opt) {
            $opt['order'] = $idx + 1;
        }

        return [
            'question_text' => $questionText,
            'narrative_text' => "Learners discuss {$topic} in a realistic classroom situation.",
            'explanation' => 'Choose the answer that is most relevant, specific, and logically coherent.',
            'options' => $options,
        ];
    }

    /**
     * @return array{
     *   question_text:string,
     *   narrative_text:string,
     *   explanation:string,
     *   options:array<int,array{option_text:string,is_correct:bool,order:int}>
     * }
     */
    private function trueFalsePayload(string $topic, string $scenario): array
    {
        $isTrue = (bool) mt_rand(0, 1);

        return [
            'question_text' => "True or False: Effective {$topic} habits require consistency over time. ({$scenario})",
            'narrative_text' => "The statement is evaluated in the context of {$topic}.",
            'explanation' => 'Determine whether the statement aligns with common best practices.',
            'options' => [
                ['option_text' => 'True', 'is_correct' => $isTrue, 'order' => 1],
                ['option_text' => 'False', 'is_correct' => ! $isTrue, 'order' => 2],
            ],
        ];
    }

    /**
     * @return array{
     *   question_text:string,
     *   narrative_text:string,
     *   explanation:string,
     *   options:array<int,array{option_text:string,is_correct:bool,order:int}>
     * }
     */
    private function essayPayload(string $topic, string $scenario): array
    {
        return [
            'question_text' => "Write a short argument (120-180 words) about why {$topic} matters in modern learning. ({$scenario})",
            'narrative_text' => "A student is asked to present a structured personal perspective on {$topic}.",
            'explanation' => 'Assess clarity, coherence, supporting details, grammar, and vocabulary.',
            'options' => [],
        ];
    }

    /**
     * @return array{
     *   question_text:string,
     *   narrative_text:string,
     *   explanation:string,
     *   options:array<int,array{option_text:string,is_correct:bool,order:int}>
     * }
     */
    private function fillBlankPayload(string $topic, string $scenario): array
    {
        $answers = [
            'consistent',
            'effective',
            'relevant',
            'balanced',
            'clear',
        ];
        $answer = $this->pick($answers);

        return [
            'question_text' => "Fill in the blank: A _____ strategy is essential for improving {$topic}. ({$scenario})",
            'narrative_text' => "Students complete an academic sentence with the most suitable word.",
            'explanation' => "Expected answer: {$answer}. Accept close synonyms with equivalent meaning.",
            'options' => [],
        ];
    }

    /**
     * @param  array<int,string>  $items
     */
    private function pick(array $items): string
    {
        return $items[array_rand($items)];
    }
}

