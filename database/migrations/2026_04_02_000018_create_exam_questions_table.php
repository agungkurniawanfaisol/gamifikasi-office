<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_header_id')->constrained('exam_headers')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->unsignedSmallInteger('duration_per_question');
            $table->unsignedSmallInteger('sort_order')->default(1);
            $table->timestamps();

            $table->unique(['exam_header_id', 'question_id'], 'exam_questions_header_question_unique');
            $table->index('exam_header_id');
            $table->index('question_id');
            $table->index(['exam_header_id', 'sort_order'], 'exam_questions_header_order_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_questions');
    }
};

