<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_session_questions', function (Blueprint $table): void {
            $table->unsignedInteger('expected_duration_seconds')->default(60)->after('order');
        });
    }

    public function down(): void
    {
        Schema::table('exam_session_questions', function (Blueprint $table): void {
            $table->dropColumn('expected_duration_seconds');
        });
    }
};

