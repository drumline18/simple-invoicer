# Simple Invoicer (Laravel + React)

Local-only invoicing app for CAD invoices with GST/QST calculations.

## Stack

- Laravel API backend
- React SPA frontend (Vite)
- SQLite database

## Core Behavior

- Currency is CAD only
- GST is 5% and QST is 9.975%
- Invoice numbering format is `YYYYMMDDXX` (sequence can extend beyond `99`)
- Client quick fill is optional and uses minimal saved client records
- Clients are archived/restored (not hard deleted)
- Export is browser-print HTML at `/print/invoice/{id}`
- Export language is selected per invoice (`en` or `fr`)

## Setup

1. Install PHP dependencies:

```bash
composer install
```

2. Install frontend dependencies:

```bash
npm install
```

3. Create environment file if needed:

```bash
copy .env.example .env
```

4. Generate app key:

```bash
php artisan key:generate
```

5. Ensure SQLite file exists:

```bash
type nul > database\\database.sqlite
```

6. Run migrations:

```bash
php artisan migrate
```

## Development

Run backend and frontend in separate terminals:

```bash
php artisan serve
```

```bash
npm run dev
```

Open the app at the Laravel URL shown by `php artisan serve`.

## Build / Test

```bash
npm run build
```

```bash
php artisan test
```
