<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_activity_answers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('daily_activity_log_id')
                ->constrained('daily_activity_logs')
                ->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->foreignId('selected_option_id')->nullable()->constrained('question_options')->nullOnDelete();
            $table->boolean('is_correct')->default(false);
            $table->timestamp('answered_at');
            $table->timestamps();

            $table->unique(['daily_activity_log_id', 'question_id'], 'daily_activity_log_question_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_activity_answers');
    }
};
