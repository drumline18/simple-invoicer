<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('tax_1_label')->default('GST')->after('qst_number');
            $table->decimal('tax_1_rate', 8, 3)->default(5)->after('tax_1_label');
            $table->string('tax_1_number')->default('')->after('tax_1_rate');
            $table->string('tax_2_label')->default('QST')->after('tax_1_number');
            $table->decimal('tax_2_rate', 8, 3)->default(9.975)->after('tax_2_label');
            $table->string('tax_2_number')->default('')->after('tax_2_rate');
        });

        DB::table('settings')->update([
            'tax_1_label' => 'GST',
            'tax_1_rate' => 5,
            'tax_1_number' => DB::raw("COALESCE(gst_number, '')"),
            'tax_2_label' => 'QST',
            'tax_2_rate' => 9.975,
            'tax_2_number' => DB::raw("COALESCE(qst_number, '')"),
        ]);
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'tax_1_label',
                'tax_1_rate',
                'tax_1_number',
                'tax_2_label',
                'tax_2_rate',
                'tax_2_number',
            ]);
        });
    }
};
