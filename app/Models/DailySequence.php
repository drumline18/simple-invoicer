<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailySequence extends Model
{
    protected $primaryKey = 'sequence_date';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'sequence_date',
        'last_seq',
    ];
}
