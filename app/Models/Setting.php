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
        'gst_number',
        'qst_number',
        'default_terms',
    ];
}
