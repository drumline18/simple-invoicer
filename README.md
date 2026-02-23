# Simple Invoicer

Simple Invoicer is a self-hosted solution designed for fast, no-fuss invoicing—no account required, no unnecessary features, and no hidden costs. Create and export invoices with minimal friction, including the ability to generate a PDF from a blank invoice if you wish. While it may not replace dedicated accounting software, it makes sending invoices quick and straightforward. Built as a Laravel API with a React SPA, it features flexible Canadian sales tax options and puts you in control of your data.

## Stack

- Backend: Laravel 12
- Frontend: React 18 + Vite
- Database: SQLite

## Core Behavior

- Currency is CAD only
- Taxes are configurable (two tax lines with province presets + manual override)
- Invoice number format: `YYYYMMDDXX` (supports `...100`, `...101`, etc.)
- Client quick-fill from saved clients
- Client records are archived/restored (not hard deleted)
- Export is browser print route: `/print/invoice/{id}`
- Export language is per-invoice (`en` / `fr`), app UI remains English
- Empty notes/terms are hidden in export/print view
- Business timezone is configurable and used for default invoice dates

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
- Optional app lock is available via environment variables (see below)
- If React/Vite dev preamble errors appear, clear stale hot mode:

```bash
del public\hot
php artisan optimize:clear
```

## Optional App Password Lock

Simple Invoicer supports a single app-level password gate (no user accounts).

1. In `.env`, enable lock and set a password:

```bash
APP_LOCK_ENABLED=true
APP_LOCK_PASSWORD=your-strong-password
```

2. Clear cached config after changing environment values:

```bash
php artisan optimize:clear
```

3. Open the app and unlock at `/lock`.

Notes:
- The app uses one shared password and session-based unlock.
- API and print routes are also protected while locked.
- To disable the lock, set `APP_LOCK_ENABLED=false` and clear cache again.

## Key Paths

- API routes: `routes/api.php`
- Web routes: `routes/web.php`
- Invoice logic: `app/Services/InvoiceService.php`
- API controllers: `app/Http/Controllers/Api/`
- Print/export controller: `app/Http/Controllers/PrintInvoiceController.php`
- SPA entry: `resources/js/main.jsx`
