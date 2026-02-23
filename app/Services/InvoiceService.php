<?php

namespace App\Services;

use App\Models\DailySequence;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function normalizeIssueDate(?string $value): string
    {
        if (! $value) {
            return now()->toDateString();
        }

        return substr((string) $value, 0, 10);
    }

    public function normalizeLanguage(?string $value): string
    {
        return strtolower((string) $value) === 'fr' ? 'fr' : 'en';
    }

    public function previewInvoiceNumber(string $issueDate): string
    {
        $sequenceDate = str_replace('-', '', $issueDate);
        $existing = DailySequence::query()->find($sequenceDate);
        $nextSeq = $existing ? ((int) $existing->last_seq + 1) : 1;
        $seqPart = $nextSeq < 100 ? str_pad((string) $nextSeq, 2, '0', STR_PAD_LEFT) : (string) $nextSeq;

        return $sequenceDate.$seqPart;
    }

    public function nextInvoiceNumber(string $issueDate): string
    {
        return DB::transaction(function () use ($issueDate) {
            $sequenceDate = str_replace('-', '', $issueDate);

            $row = DailySequence::query()->lockForUpdate()->find($sequenceDate);

            if (! $row) {
                $row = DailySequence::query()->create([
                    'sequence_date' => $sequenceDate,
                    'last_seq' => 1,
                ]);
            } else {
                $row->last_seq = (int) $row->last_seq + 1;
                $row->save();
            }

            $nextSeq = (int) $row->last_seq;
            $seqPart = $nextSeq < 100 ? str_pad((string) $nextSeq, 2, '0', STR_PAD_LEFT) : (string) $nextSeq;

            return $sequenceDate.$seqPart;
        });
    }

    public function syncSequenceFromInvoiceNumber(string $issueDate, string $invoiceNumber): void
    {
        $sequenceDate = str_replace('-', '', $issueDate);
        $trimmed = trim($invoiceNumber);

        if (! str_starts_with($trimmed, $sequenceDate)) {
            return;
        }

        $suffix = substr($trimmed, strlen($sequenceDate));
        if ($suffix === '' || ! ctype_digit($suffix)) {
            return;
        }

        $seqValue = (int) $suffix;
        if ($seqValue < 1) {
            return;
        }

        $row = DailySequence::query()->lockForUpdate()->find($sequenceDate);
        if (! $row) {
            DailySequence::query()->create([
                'sequence_date' => $sequenceDate,
                'last_seq' => $seqValue,
            ]);

            return;
        }

        if ((int) $row->last_seq < $seqValue) {
            $row->last_seq = $seqValue;
            $row->save();
        }
    }

    public function recalcInvoice(array $items): array
    {
        $tax = $this->taxConfig();
        $tax1Rate = $tax['tax_1']['enabled'] ? $tax['tax_1']['rate_decimal'] : 0;
        $tax2Rate = $tax['tax_2']['enabled'] ? $tax['tax_2']['rate_decimal'] : 0;

        $normalized = [];
        $subtotal = 0;
        $tax1 = 0;
        $tax2 = 0;

        foreach (array_values($items) as $position => $item) {
            $qty = max(0, (float) ($item['qty'] ?? 0));
            $unitPriceCents = $this->centsFromNumber($item['unitPrice'] ?? 0);
            $taxable = ($item['taxable'] ?? true) !== false;

            $lineSubtotal = (int) round($qty * $unitPriceCents);
            $lineTax1 = $taxable ? (int) round($lineSubtotal * $tax1Rate) : 0;
            $lineTax2 = $taxable ? (int) round($lineSubtotal * $tax2Rate) : 0;
            $lineTotal = $lineSubtotal + $lineTax1 + $lineTax2;

            $subtotal += $lineSubtotal;
            $tax1 += $lineTax1;
            $tax2 += $lineTax2;

            $normalized[] = [
                'position' => $position,
                'description' => (string) ($item['description'] ?? ''),
                'qty' => $qty,
                'unit_price_cents' => $unitPriceCents,
                'taxable' => $taxable,
                'line_subtotal_cents' => $lineSubtotal,
                'gst_cents' => $lineTax1,
                'qst_cents' => $lineTax2,
                'line_total_cents' => $lineTotal,
            ];
        }

        return [
            'items' => $normalized,
            'subtotal_cents' => $subtotal,
            'gst_cents' => $tax1,
            'qst_cents' => $tax2,
            'total_cents' => $subtotal + $tax1 + $tax2,
        ];
    }

    public function taxConfig(?Setting $settings = null): array
    {
        $settings ??= Setting::query()->firstOrCreate(
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

        $tax1Label = trim((string) ($settings->tax_1_label ?: 'GST'));
        $tax2Label = trim((string) ($settings->tax_2_label ?: 'QST'));
        $tax1RatePercent = max(0, (float) ($settings->tax_1_rate ?? 5));
        $tax2RatePercent = max(0, (float) ($settings->tax_2_rate ?? 9.975));

        return [
            'tax_1' => [
                'label' => $tax1Label,
                'rate_percent' => $tax1RatePercent,
                'rate_decimal' => $tax1RatePercent / 100,
                'number' => (string) ($settings->tax_1_number ?: $settings->gst_number ?: ''),
                'enabled' => $tax1Label !== '' && $tax1RatePercent > 0,
            ],
            'tax_2' => [
                'label' => $tax2Label,
                'rate_percent' => $tax2RatePercent,
                'rate_decimal' => $tax2RatePercent / 100,
                'number' => (string) ($settings->tax_2_number ?: $settings->qst_number ?: ''),
                'enabled' => $tax2Label !== '' && $tax2RatePercent > 0,
            ],
        ];
    }

    public function centsFromNumber(mixed $value): int
    {
        $number = (float) $value;

        return (int) round($number * 100);
    }

    public function dollarsFromCents(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
