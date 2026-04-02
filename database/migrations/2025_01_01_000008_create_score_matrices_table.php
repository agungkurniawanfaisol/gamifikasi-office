<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('score_matrices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('skill_category_id')->constrained('skill_categories')->cascadeOnDelete();
            $table->foreignId('level_id')->constrained('levels')->cascadeOnDelete();
            $table->string('question_type');
            $table->unsignedInteger('correct_score');
            $table->unsignedInteger('partial_score')->default(0);
            $table->unsignedInteger('wrong_score')->default(0);
            $table->boolean('time_bonus_enabled')->default(false);
            $table->unsignedInteger('time_bonus_seconds')->nullable();
            $table->unsignedInteger('time_bonus_score')->default(0);
            $table->timestamps();

            $table->unique(['skill_category_id', 'level_id', 'question_type'], 'score_matrices_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('score_matrices');
    }
};
