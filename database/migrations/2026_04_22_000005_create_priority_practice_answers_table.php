<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('priority_practice_answers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('priority_practice_session_id')
                ->constrained('priority_practice_sessions')
                ->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->foreignId('selected_option_id')->nullable()->constrained('question_options')->nullOnDelete();
            $table->boolean('is_correct')->default(false);
            $table->timestamp('answered_at');
            $table->timestamps();

            $table->unique(
                ['priority_practice_session_id', 'question_id'],
                'priority_practice_session_question_unique',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('priority_practice_answers');
    }
};
