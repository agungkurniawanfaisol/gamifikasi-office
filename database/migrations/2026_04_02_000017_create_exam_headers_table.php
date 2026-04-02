<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_headers', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->foreignId('level_id')->constrained('levels')->cascadeOnDelete();
            $table->unsignedInteger('total_duration_minutes');
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index('level_id');
            $table->index('creator_id');
            $table->index(['level_id', 'created_at'], 'exam_headers_level_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_headers');
    }
};

