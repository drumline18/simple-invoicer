# Simple Invoicer

Local-only invoicing app (Laravel API + React SPA) for CAD invoices with GST/QST.

## Stack

- Backend: Laravel 12
- Frontend: React 18 + Vite
- Database: SQLite

## Core Behavior

- Currency is CAD only
- Taxes: GST 5%, QST 9.975%
- Invoice number format: `YYYYMMDDXX` (supports `...100`, `...101`, etc.)
- Client quick-fill from saved clients
- Client records are archived/restored (not hard deleted)
- Export is browser print route: `/print/invoice/{id}`
- Export language is per-invoice (`en` / `fr`), app UI remains English
- Empty notes/terms are hidden in export/print view

## Setup

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
type nul > database\database.sqlite
php artisan migrate
```

## Run Locally

Use two terminals:

```bash
php artisan serve
```

```bash
npm run dev
```

Open the app at the URL shown by `php artisan serve`.

## Build and Test

```bash
npm run build
php artisan test
```

## Production Notes

- Web root must point to `public/`
- Run a production frontend build (`npm run build`)
- Ensure `storage/` and `bootstrap/cache/` are writable
- If React/Vite dev preamble errors appear, clear stale hot mode:

```bash
del public\hot
php artisan optimize:clear
```

## Key Paths

- API routes: `routes/api.php`
- Web routes: `routes/web.php`
- Invoice logic: `app/Services/InvoiceService.php`
- API controllers: `app/Http/Controllers/Api/`
- Print/export controller: `app/Http/Controllers/PrintInvoiceController.php`
- SPA entry: `resources/js/main.jsx`
