<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->string('business_name')->default('');
            $table->string('business_email')->default('');
            $table->string('business_phone')->default('');
            $table->text('business_address')->default('');
            $table->string('gst_number')->default('');
            $table->string('qst_number')->default('');
            $table->text('default_terms')->default('');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
