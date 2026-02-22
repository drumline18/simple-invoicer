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
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->text('description')->default('');
            $table->decimal('qty', 12, 2)->default(0);
            $table->integer('unit_price_cents')->default(0);
            $table->boolean('taxable')->default(true);
            $table->integer('line_subtotal_cents')->default(0);
            $table->integer('gst_cents')->default(0);
            $table->integer('qst_cents')->default(0);
            $table->integer('line_total_cents')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
