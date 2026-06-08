<?php

namespace Tests\Unit\Services\ExamSessions;

use App\Enums\QuestionType;
use App\Models\ExamSession;
use App\Models\ExamSessionQuestion;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Services\ExamSessions\ExamSessionQuestionReviewBuilder;
use PHPUnit\Framework\TestCase;

class ExamSessionQuestionReviewBuilderTest extends TestCase
{
    public function test_unanswered_row_has_null_correctness_and_dash_answer(): void
    {
        $correct = new QuestionOption([
            'id' => 10,
            'question_id' => 1,
            'option_text' => 'Yes',
            'is_correct' => true,
            'order' => 1,
        ]);
        $question = new Question([
            'id' => 1,
            'type' => QuestionType::TrueFalse,
            'question_text' => 'Sky is blue?',
        ]);
        $question->setRelation('options', collect([$correct]));

        $sq = new ExamSessionQuestion(['order' => 1, 'question_id' => 1]);
        $sq->setRelation('question', $question);
        $sq->setRelation('answer', null);

        $session = new ExamSession(['id' => 99]);
        $session->setRelation('sessionQuestions', collect([$sq]));

        $builder = new ExamSessionQuestionReviewBuilder;
        $rows = $builder->forSession($session);

        $this->assertCount(1, $rows);
        $this->assertSame('—', $rows[0]['student_answer']);
        $this->assertNull($rows[0]['is_correct']);
        $this->assertSame('Yes', $rows[0]['correct_answer']);
    }

    public function test_fill_blank_uses_answer_text_for_student_answer(): void
    {
        $correct = new QuestionOption([
            'id' => 20,
            'question_id' => 2,
            'option_text' => 'Paris',
            'is_correct' => true,
            'order' => 1,
        ]);
        $question = new Question([
            'id' => 2,
            'type' => QuestionType::FillBlank,
            'question_text' => 'Capital?',
        ]);
        $question->setRelation('options', collect([$correct]));

        $answer = new \App\Models\ExamAnswer([
            'selected_option_id' => null,
            'answer_text' => '  paris ',
            'is_correct' => true,
        ]);
        $answer->setRelation('selectedOption', null);

        $sq = new ExamSessionQuestion(['order' => 1, 'question_id' => 2]);
        $sq->setRelation('question', $question);
        $sq->setRelation('answer', $answer);

        $session = new ExamSession(['id' => 100]);
        $session->setRelation('sessionQuestions', collect([$sq]));

        $builder = new ExamSessionQuestionReviewBuilder;
        $rows = $builder->forSession($session);

        $this->assertSame('paris', $rows[0]['student_answer']);
        $this->assertTrue($rows[0]['is_correct']);
    }
}
