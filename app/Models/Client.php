<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'is_archived',
        'archived_at',
    ];

    protected $casts = [
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
    ];
}
