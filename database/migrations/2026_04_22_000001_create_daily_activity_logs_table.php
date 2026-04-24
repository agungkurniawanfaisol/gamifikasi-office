<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_activity_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('activity_date');
            $table->json('question_ids');
            $table->unsignedInteger('answered_count')->default(0);
            $table->unsignedInteger('correct_count')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->unsignedInteger('streak_after_day')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('reward_granted_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'activity_date']);
            $table->index(['user_id', 'activity_date', 'is_completed'], 'daily_activity_user_date_completed_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_activity_logs');
    }
};
