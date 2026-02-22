<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    protected $fillable = [
        'invoice_id',
        'position',
        'description',
        'qty',
        'unit_price_cents',
        'taxable',
        'line_subtotal_cents',
        'gst_cents',
        'qst_cents',
        'line_total_cents',
    ];

    protected $casts = [
        'taxable' => 'boolean',
        'qty' => 'float',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
