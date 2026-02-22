<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json($this->settings());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'business_name' => ['nullable', 'string'],
            'business_email' => ['nullable', 'string'],
            'business_phone' => ['nullable', 'string'],
            'business_address' => ['nullable', 'string'],
            'gst_number' => ['nullable', 'string'],
            'qst_number' => ['nullable', 'string'],
            'default_terms' => ['nullable', 'string'],
        ]);

        $settings = $this->settings();
        $settings->fill([
            'business_name' => (string) ($data['business_name'] ?? ''),
            'business_email' => (string) ($data['business_email'] ?? ''),
            'business_phone' => (string) ($data['business_phone'] ?? ''),
            'business_address' => (string) ($data['business_address'] ?? ''),
            'gst_number' => (string) ($data['gst_number'] ?? ''),
            'qst_number' => (string) ($data['qst_number'] ?? ''),
            'default_terms' => (string) ($data['default_terms'] ?? ''),
        ]);
        $settings->save();

        return response()->json($settings->fresh());
    }

    private function settings(): Setting
    {
        return Setting::query()->firstOrCreate(
            ['id' => 1],
            [
                'business_name' => '',
                'business_email' => '',
                'business_phone' => '',
                'business_address' => '',
                'gst_number' => '',
                'qst_number' => '',
                'default_terms' => '',
            ]
        );
    }
}
