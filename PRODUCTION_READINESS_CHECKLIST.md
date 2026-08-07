# Production Readiness Checklist

Use this checklist before deploying the CRM operations system to a real server.

## Backend Environment

- Copy `backend/.env.production.example` to the server as `backend/.env`.
- Set `DJANGO_SETTINGS_MODULE=config.settings_production`.
- Set `DEBUG=False`.
- Use a strong `SECRET_KEY` with at least 50 characters.
- Set `ALLOWED_HOSTS` to the backend domain and/or server IP.
- Set `CORS_ALLOWED_ORIGINS` to the frontend production origin only.
- Set `CSRF_TRUSTED_ORIGINS` to trusted HTTPS origins.
- Use a dedicated MySQL user with least required privileges.
- Keep database password, admin password, and secret key out of Git.

## Frontend Environment

- Copy `panel/.env.production.example` to the frontend build environment as `panel/.env.production`.
- Set `NEXT_PUBLIC_API_URL` to the production backend API root, for example `https://api.yourdomain.com/api/v1`.

## Backend Deployment Commands

Run from `backend`:

```powershell
.\.venv\Scripts\python.exe manage.py check --deploy --settings=config.settings_production
.\.venv\Scripts\python.exe manage.py migrate --settings=config.settings_production
.\.venv\Scripts\python.exe manage.py collectstatic --noinput --settings=config.settings_production
.\.venv\Scripts\python.exe manage.py seed_foundation --settings=config.settings_production
```

If `CRM_ADMIN_PASSWORD` is not set in the environment, pass it explicitly:

```powershell
.\.venv\Scripts\python.exe manage.py seed_foundation --settings=config.settings_production --admin-password "replace-with-strong-password"
```

## Frontend Deployment Commands

Run from `panel`:

```powershell
npm run build
npm run start
```

## Smoke Test

- Backend health/API root loads over HTTPS.
- Login works with the seeded super admin.
- Super admin sees all modules.
- Non-admin roles only see their allowed pages.
- Direct unauthorized API calls return `403` or object-scoped `404`.
- Finance overview loads for finance users.
- Support users only see scoped tickets.
- Employees can view own HRMS profile/payroll but cannot edit or approve.

## Final Checks

- `DEBUG=False` verified.
- HTTPS enabled through reverse proxy.
- Database backup configured.
- Error logs monitored.
- Static files served by the web server.
- Real domain added to `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and `CSRF_TRUSTED_ORIGINS`.
- `.env` files are not committed.
