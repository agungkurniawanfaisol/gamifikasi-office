<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('target_sessions')->default(1);
            $table->unsignedInteger('target_score')->default(0);
            $table->unsignedInteger('completed_sessions')->default(0);
            $table->unsignedInteger('achieved_score')->default(0);
            $table->boolean('is_achieved')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_goals');
    }
};
