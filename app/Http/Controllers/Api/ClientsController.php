<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ClientsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $includeArchived = $request->query('include_archived') === '1';

        $query = Client::query();

        if (! $includeArchived) {
            $query->where('is_archived', false);
        }

        if ($search !== '') {
            $query->where('name', 'like', '%'.$search.'%');
        }

        $limit = $includeArchived ? 200 : 100;
        $rows = $query->orderBy('is_archived')->orderByDesc('updated_at')->limit($limit)->get();

        return response()->json($rows);
    }

    public function show(int $id): JsonResponse
    {
        $client = Client::query()->find($id);

        if (! $client) {
            return response()->json(['error' => 'Client not found.'], 404);
        }

        return response()->json($client);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'email' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'overwrite' => ['nullable', 'boolean'],
        ]);

        $name = $this->normalizeName($data['name']);
        if ($name === '') {
            throw ValidationException::withMessages(['name' => 'Client name is required.']);
        }

        $overwrite = (bool) ($data['overwrite'] ?? false);
        $existing = Client::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();

        if ($existing?->is_archived) {
            return response()->json([
                'error' => sprintf('A client named "%s" is archived. Restore it from Clients page first.', $existing->name),
                'code' => 'CLIENT_ARCHIVED',
                'existing_client_id' => $existing->id,
                'existing_client_name' => $existing->name,
            ], 409);
        }

        $payload = [
            'name' => $name,
            'email' => trim((string) ($data['email'] ?? '')),
            'phone' => trim((string) ($data['phone'] ?? '')),
            'address' => trim((string) ($data['address'] ?? '')),
        ];

        if ($existing) {
            $same = $existing->email === $payload['email']
                && $existing->phone === $payload['phone']
                && $existing->address === $payload['address'];

            if ($same) {
                return response()->json($existing);
            }

            if (! $overwrite) {
                return response()->json([
                    'error' => sprintf('A client named "%s" already exists.', $existing->name),
                    'code' => 'CLIENT_EXISTS',
                    'existing_client_id' => $existing->id,
                    'existing_client_name' => $existing->name,
                ], 409);
            }

            $existing->fill($payload);
            $existing->save();

            return response()->json($existing->fresh());
        }

        $client = Client::query()->create($payload);

        return response()->json($client, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $client = Client::query()->find($id);
        if (! $client) {
            return response()->json(['error' => 'Client not found.'], 404);
        }

        $data = $request->validate([
            'name' => ['required', 'string', Rule::unique('clients', 'name')->ignore($id)],
            'email' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
        ]);

        $name = $this->normalizeName($data['name']);
        if ($name === '') {
            throw ValidationException::withMessages(['name' => 'Client name is required.']);
        }

        $conflict = Client::query()
            ->where('id', '!=', $id)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->first();

        if ($conflict) {
            $code = $conflict->is_archived ? 'CLIENT_ARCHIVED' : 'CLIENT_EXISTS';
            $message = $conflict->is_archived
                ? 'A client with this name exists in archived clients. Restore it first.'
                : 'A client with this name already exists.';

            return response()->json(['error' => $message, 'code' => $code], 409);
        }

        $client->fill([
            'name' => $name,
            'email' => trim((string) ($data['email'] ?? '')),
            'phone' => trim((string) ($data['phone'] ?? '')),
            'address' => trim((string) ($data['address'] ?? '')),
        ]);
        $client->save();

        return response()->json($client->fresh());
    }

    public function archive(int $id): JsonResponse
    {
        $client = Client::query()->find($id);
        if (! $client) {
            return response()->json(['error' => 'Client not found.'], 404);
        }

        if (! $client->is_archived) {
            $client->is_archived = true;
            $client->archived_at = now();
            $client->save();
        }

        return response()->json($client->fresh());
    }

    public function restore(int $id): JsonResponse
    {
        $client = Client::query()->find($id);
        if (! $client) {
            return response()->json(['error' => 'Client not found.'], 404);
        }

        if ($client->is_archived) {
            $nameConflict = Client::query()
                ->where('id', '!=', $id)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($client->name)])
                ->first();

            if ($nameConflict) {
                return response()->json(['error' => 'Cannot restore client because name is already in use.'], 409);
            }

            $client->is_archived = false;
            $client->archived_at = null;
            $client->save();
        }

        return response()->json($client->fresh());
    }

    private function normalizeName(string $name): string
    {
        return preg_replace('/\s+/', ' ', trim($name)) ?? '';
    }
}
