# Known Limitations

Intentional or deferred gaps for Shine Al Furqan LMS `1.0.0-rc.1`:

1. **Uploads** — local disk (`UPLOAD_ROOT`); not multi-node safe. Use object storage for HA.
2. **Email** — SMTP required in production; console transport is for local demo only.
3. **Fee CRM / Approvals / Audit depth** — Fee widgets and System Settings Approvals/Audit tabs still deferred.
4. **Global search** — not implemented; header offers quick navigation only.
5. **Fee / Coordinator payroll depth** — Fee CRM widgets still deferred; coordinator salary tab marked Soon.
6. **Browser E2E** — no Playwright suite; API golden flows cover critical paths.
7. **Docker / CI templates** — not shipped; deploy is provider-agnostic (docs only).
8. **Access token storage** — Bearer JWT in `localStorage` (refresh remains HttpOnly cookie).
9. **react-router advisory** — RSC-mode CSRF (GHSA-qwww-vcr4-c8h2) accepted for this Vite SPA; track upgrades in `SECURITY.md`.
10. **Ustad course browse** — ustads may still view published course *metadata*; file downloads require assignment or enrollment.
