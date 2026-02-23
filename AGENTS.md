# Agent Notes

This repo is a Laravel + React rewrite of a local invoicing app.

## Project Shape

- Backend API: Laravel (`routes/api.php`, controllers under `app/Http/Controllers/Api`)
- Frontend SPA: React (`resources/js`)
- Print export: server-rendered Blade at `/print/invoice/{id}`
- DB: SQLite (`database/database.sqlite`)

## Critical Business Rules

- CAD only
- Taxes are configurable via settings (`tax_1_*`, `tax_2_*`)
- Province presets are available (AB, BC, MB, NB, NL, NS, ON, PE, QC, SK) with manual override
- If tax label is blank or tax rate is 0, that tax line is treated as disabled/hidden
- Invoice numbering: `YYYYMMDDXX` and may exceed 2 digits after 99
- Daily sequence must stay in sync even when invoice number is explicitly provided
- Client name uniqueness is case-insensitive in active clients
- Archived client name conflicts return `CLIENT_ARCHIVED`
- Empty notes/terms are hidden in print view
- Business timezone is configurable and should drive default issue date behavior

## Dev Commands

```bash
composer install
npm install
php artisan migrate
php artisan serve
npm run dev
php artisan test
npm run build
```

## Frontend Conventions

- Keep icon usage consistent with `lucide-react`
- Use `.with-icon` for icon + text controls
- Keep desktop/mobile behavior intact (do not break responsive layout)
- Maintain toast notifications + inline notice behavior for invoice actions

## Existing UX Decisions

- New invoice flow shows bottom `CLEAR` button (not in edit flow)
- Status notice is inline with top form actions
- Taxable line-item control is a styled accessible switch

## Deployment Gotchas

- Web root must point to `public/`
- If Vite React preamble issues appear in production, remove `public/hot` and run `php artisan optimize:clear`
