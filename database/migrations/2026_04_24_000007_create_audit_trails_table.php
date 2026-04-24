<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_trails', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('user_role', 32)->nullable();
            $table->string('session_id', 120)->nullable();
            $table->string('request_id', 120)->nullable();
            $table->string('event_type', 40);
            $table->string('event_key', 120);
            $table->string('route_name', 150)->nullable();
            $table->text('page_url')->nullable();
            $table->string('menu_key', 120)->nullable();
            $table->string('element_key', 180)->nullable();
            $table->integer('click_x')->nullable();
            $table->integer('click_y')->nullable();
            $table->string('subject_type', 120)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_label', 180)->nullable();
            $table->foreignId('exam_session_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('exam_header_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('score_before')->nullable();
            $table->integer('score_after')->nullable();
            $table->integer('score_delta')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index('occurred_at');
            $table->index(['event_type', 'occurred_at']);
            $table->index(['user_id', 'occurred_at']);
            $table->index('route_name');
            $table->index(['subject_type', 'subject_id']);
            $table->index('exam_session_id');
            $table->index('score_after');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_trails');
    }
};
