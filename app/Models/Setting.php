<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'id',
        'business_name',
        'business_email',
        'business_phone',
        'business_address',
        'timezone',
        'gst_number',
        'qst_number',
        'tax_1_label',
        'tax_1_rate',
        'tax_1_number',
        'tax_2_label',
        'tax_2_rate',
        'tax_2_number',
        'default_terms',
    ];
}
