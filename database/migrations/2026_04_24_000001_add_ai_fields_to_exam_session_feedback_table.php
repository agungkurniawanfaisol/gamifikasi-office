<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exam_session_feedback', function (Blueprint $table) {
            $table->string('ai_status', 20)->default('pending')->after('completion_message');
            $table->string('ai_model', 100)->nullable()->after('ai_status');
            $table->text('ai_error_message')->nullable()->after('ai_model');
            $table->timestamp('ai_generated_at')->nullable()->after('ai_error_message');

            $table->index(['ai_status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('exam_session_feedback', function (Blueprint $table) {
            $table->dropIndex('exam_session_feedback_ai_status_created_at_index');
            $table->dropColumn([
                'ai_status',
                'ai_model',
                'ai_error_message',
                'ai_generated_at',
            ]);
        });
    }
};
