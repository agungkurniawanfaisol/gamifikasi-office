<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_session_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->unsignedSmallInteger('order');
            $table->timestamps();

            $table->unique(['exam_session_id', 'question_id'], 'esq_session_question_unique');
            $table->index(['exam_session_id', 'order'], 'esq_session_order_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_session_questions');
    }
};
