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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->string('language', 2)->default('en');
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->string('client_name')->default('');
            $table->string('client_email')->default('');
            $table->string('client_phone')->default('');
            $table->text('client_address')->default('');
            $table->text('notes')->default('');
            $table->text('terms')->default('');
            $table->integer('subtotal_cents')->default(0);
            $table->integer('gst_cents')->default(0);
            $table->integer('qst_cents')->default(0);
            $table->integer('total_cents')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
