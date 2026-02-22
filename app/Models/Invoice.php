<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_number',
        'language',
        'issue_date',
        'due_date',
        'client_name',
        'client_email',
        'client_phone',
        'client_address',
        'notes',
        'terms',
        'subtotal_cents',
        'gst_cents',
        'qst_cents',
        'total_cents',
    ];

    protected $casts = [
        'issue_date' => 'date:Y-m-d',
        'due_date' => 'date:Y-m-d',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
