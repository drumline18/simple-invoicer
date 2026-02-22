<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoicesController extends Controller
{
    public function __construct(private readonly InvoiceService $service)
    {
    }

    public function nextNumber(Request $request): JsonResponse
    {
        $issueDate = $this->service->normalizeIssueDate($request->query('issueDate'));

        return response()->json([
            'invoiceNumber' => $this->service->previewInvoiceNumber($issueDate),
            'issueDate' => $issueDate,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));

        $rows = Invoice::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner
                        ->where('invoice_number', 'like', "%{$search}%")
                        ->orWhere('client_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('issue_date')
            ->orderByDesc('id')
            ->get([
                'id',
                'invoice_number',
                'issue_date',
                'due_date',
                'client_name',
                'total_cents',
                'created_at',
            ])
            ->map(fn (Invoice $invoice) => [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'issue_date' => $invoice->issue_date?->format('Y-m-d'),
                'due_date' => $invoice->due_date?->format('Y-m-d'),
                'client_name' => $invoice->client_name,
                'created_at' => $invoice->created_at,
                'total' => $this->service->dollarsFromCents((int) $invoice->total_cents),
            ]);

        return response()->json($rows);
    }

    public function show(int $id): JsonResponse
    {
        $invoice = Invoice::query()->with(['items' => fn ($query) => $query->orderBy('position')])->find($id);

        if (! $invoice) {
            return response()->json(['error' => 'Invoice not found.'], 404);
        }

        return response()->json($this->formatInvoice($invoice));
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $this->validateInvoicePayload($request);

        try {
            $invoice = DB::transaction(function () use ($payload) {
                $issueDate = $this->service->normalizeIssueDate($payload['issue_date'] ?? null);
                $totals = $this->service->recalcInvoice($payload['items']);
                $invoiceNumber = trim((string) ($payload['invoice_number'] ?? ''));
                if ($invoiceNumber === '') {
                    $invoiceNumber = $this->service->nextInvoiceNumber($issueDate);
                }

                $invoice = Invoice::query()->create([
                    'invoice_number' => $invoiceNumber,
                    'language' => $this->service->normalizeLanguage($payload['language'] ?? 'en'),
                    'issue_date' => $issueDate,
                    'due_date' => ($payload['due_date'] ?? null) ?: null,
                    'client_name' => (string) ($payload['client_name'] ?? ''),
                    'client_email' => (string) ($payload['client_email'] ?? ''),
                    'client_phone' => (string) ($payload['client_phone'] ?? ''),
                    'client_address' => (string) ($payload['client_address'] ?? ''),
                    'notes' => (string) ($payload['notes'] ?? ''),
                    'terms' => (string) ($payload['terms'] ?? ''),
                    'subtotal_cents' => $totals['subtotal_cents'],
                    'gst_cents' => $totals['gst_cents'],
                    'qst_cents' => $totals['qst_cents'],
                    'total_cents' => $totals['total_cents'],
                ]);

                foreach ($totals['items'] as $item) {
                    InvoiceItem::query()->create([
                        'invoice_id' => $invoice->id,
                        ...$item,
                    ]);
                }

                $this->service->syncSequenceFromInvoiceNumber($issueDate, $invoiceNumber);

                return $invoice->load(['items' => fn ($query) => $query->orderBy('position')]);
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $exception) {
            return response()->json(['error' => 'Invoice number already exists.'], 409);
        }

        return response()->json($this->formatInvoice($invoice), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $invoice = Invoice::query()->find($id);
        if (! $invoice) {
            return response()->json(['error' => 'Invoice not found.'], 404);
        }

        $payload = $this->validateInvoicePayload($request);

        try {
            $invoice = DB::transaction(function () use ($payload, $invoice) {
                $issueDate = $this->service->normalizeIssueDate($payload['issue_date'] ?? null);
                $totals = $this->service->recalcInvoice($payload['items']);

                $invoice->fill([
                    'invoice_number' => trim((string) ($payload['invoice_number'] ?? '')) ?: $invoice->invoice_number,
                    'language' => $this->service->normalizeLanguage($payload['language'] ?? 'en'),
                    'issue_date' => $issueDate,
                    'due_date' => ($payload['due_date'] ?? null) ?: null,
                    'client_name' => (string) ($payload['client_name'] ?? ''),
                    'client_email' => (string) ($payload['client_email'] ?? ''),
                    'client_phone' => (string) ($payload['client_phone'] ?? ''),
                    'client_address' => (string) ($payload['client_address'] ?? ''),
                    'notes' => (string) ($payload['notes'] ?? ''),
                    'terms' => (string) ($payload['terms'] ?? ''),
                    'subtotal_cents' => $totals['subtotal_cents'],
                    'gst_cents' => $totals['gst_cents'],
                    'qst_cents' => $totals['qst_cents'],
                    'total_cents' => $totals['total_cents'],
                ]);
                $invoice->save();

                InvoiceItem::query()->where('invoice_id', $invoice->id)->delete();
                foreach ($totals['items'] as $item) {
                    InvoiceItem::query()->create([
                        'invoice_id' => $invoice->id,
                        ...$item,
                    ]);
                }

                return $invoice->fresh()->load(['items' => fn ($query) => $query->orderBy('position')]);
            });
        } catch (\Illuminate\Database\UniqueConstraintViolationException $exception) {
            return response()->json(['error' => 'Invoice number already exists.'], 409);
        }

        return response()->json($this->formatInvoice($invoice));
    }

    private function validateInvoicePayload(Request $request): array
    {
        $data = $request->validate([
            'invoice_number' => ['nullable', 'string'],
            'language' => ['nullable', 'in:en,fr'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'client_name' => ['nullable', 'string'],
            'client_email' => ['nullable', 'string'],
            'client_phone' => ['nullable', 'string'],
            'client_address' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'terms' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.qty' => ['required', 'numeric', 'min:0'],
            'items.*.unitPrice' => ['required', 'numeric', 'min:0'],
            'items.*.taxable' => ['nullable', 'boolean'],
        ]);

        if (! is_array($data['items']) || count($data['items']) === 0) {
            throw ValidationException::withMessages(['items' => 'At least one line item is required.']);
        }

        return $data;
    }

    private function formatInvoice(Invoice $invoice): array
    {
        $invoice->loadMissing(['items' => fn ($query) => $query->orderBy('position')]);

        return [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'language' => $invoice->language,
            'issue_date' => $invoice->issue_date?->format('Y-m-d'),
            'due_date' => $invoice->due_date?->format('Y-m-d'),
            'client_name' => $invoice->client_name,
            'client_email' => $invoice->client_email,
            'client_phone' => $invoice->client_phone,
            'client_address' => $invoice->client_address,
            'notes' => $invoice->notes,
            'terms' => $invoice->terms,
            'items' => $invoice->items->map(function (InvoiceItem $item) {
                return [
                    'id' => $item->id,
                    'description' => $item->description,
                    'qty' => $item->qty,
                    'unitPrice' => $this->service->dollarsFromCents((int) $item->unit_price_cents),
                    'taxable' => (bool) $item->taxable,
                    'lineSubtotal' => $this->service->dollarsFromCents((int) $item->line_subtotal_cents),
                    'gst' => $this->service->dollarsFromCents((int) $item->gst_cents),
                    'qst' => $this->service->dollarsFromCents((int) $item->qst_cents),
                    'lineTotal' => $this->service->dollarsFromCents((int) $item->line_total_cents),
                ];
            })->values(),
            'subtotal' => $this->service->dollarsFromCents((int) $invoice->subtotal_cents),
            'gst' => $this->service->dollarsFromCents((int) $invoice->gst_cents),
            'qst' => $this->service->dollarsFromCents((int) $invoice->qst_cents),
            'total' => $this->service->dollarsFromCents((int) $invoice->total_cents),
        ];
    }
}
