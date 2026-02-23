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
            'tax_1_label' => ['nullable', 'string'],
            'tax_1_rate' => ['nullable', 'numeric', 'min:0'],
            'tax_1_number' => ['nullable', 'string'],
            'tax_2_label' => ['nullable', 'string'],
            'tax_2_rate' => ['nullable', 'numeric', 'min:0'],
            'tax_2_number' => ['nullable', 'string'],
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
            'tax_1_label' => trim((string) ($data['tax_1_label'] ?? $settings->tax_1_label ?? 'GST')),
            'tax_1_rate' => (float) ($data['tax_1_rate'] ?? $settings->tax_1_rate ?? 5),
            'tax_1_number' => (string) ($data['tax_1_number'] ?? $settings->tax_1_number ?? ''),
            'tax_2_label' => trim((string) ($data['tax_2_label'] ?? $settings->tax_2_label ?? 'QST')),
            'tax_2_rate' => (float) ($data['tax_2_rate'] ?? $settings->tax_2_rate ?? 9.975),
            'tax_2_number' => (string) ($data['tax_2_number'] ?? $settings->tax_2_number ?? ''),
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
                'tax_1_label' => 'GST',
                'tax_1_rate' => 5,
                'tax_1_number' => '',
                'tax_2_label' => 'QST',
                'tax_2_rate' => 9.975,
                'tax_2_number' => '',
                'default_terms' => '',
            ]
        );
    }
}
