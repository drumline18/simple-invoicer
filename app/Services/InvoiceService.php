<?php

namespace App\Services;

use App\Models\DailySequence;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public const GST_RATE = 0.05;
    public const QST_RATE = 0.09975;

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
        $normalized = [];
        $subtotal = 0;
        $gst = 0;
        $qst = 0;

        foreach (array_values($items) as $position => $item) {
            $qty = max(0, (float) ($item['qty'] ?? 0));
            $unitPriceCents = $this->centsFromNumber($item['unitPrice'] ?? 0);
            $taxable = ($item['taxable'] ?? true) !== false;

            $lineSubtotal = (int) round($qty * $unitPriceCents);
            $lineGst = $taxable ? (int) round($lineSubtotal * self::GST_RATE) : 0;
            $lineQst = $taxable ? (int) round($lineSubtotal * self::QST_RATE) : 0;
            $lineTotal = $lineSubtotal + $lineGst + $lineQst;

            $subtotal += $lineSubtotal;
            $gst += $lineGst;
            $qst += $lineQst;

            $normalized[] = [
                'position' => $position,
                'description' => (string) ($item['description'] ?? ''),
                'qty' => $qty,
                'unit_price_cents' => $unitPriceCents,
                'taxable' => $taxable,
                'line_subtotal_cents' => $lineSubtotal,
                'gst_cents' => $lineGst,
                'qst_cents' => $lineQst,
                'line_total_cents' => $lineTotal,
            ];
        }

        return [
            'items' => $normalized,
            'subtotal_cents' => $subtotal,
            'gst_cents' => $gst,
            'qst_cents' => $qst,
            'total_cents' => $subtotal + $gst + $qst,
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
