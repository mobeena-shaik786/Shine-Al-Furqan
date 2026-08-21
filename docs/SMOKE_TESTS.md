# Post-Deploy Smoke Tests

Run after every production or staging deploy. Mark pass/fail with timestamp.

## Shared

| # | Check | Pass? |
|---|-------|-------|
| 1 | `GET /api/health` → 200, `mongodb: up` | |
| 2 | SPA loads over HTTPS | |
| 3 | Login page reachable | |

## Admin

| # | Check | Pass? |
|---|-------|-------|
| 1 | Login | |
| 2 | Admin dashboard metrics load | |
| 3 | User list + open one user | |
| 4 | Open courses; open one course | |
| 5 | Logout | |

## Coordinator

| # | Check | Pass? |
|---|-------|-------|
| 1 | Login | |
| 2 | Coordinator dashboard | |
| 3 | Create or list enrollment / batch | |
| 4 | Attendance session list (scoped data only) | |

## Ustad

| # | Check | Pass? |
|---|-------|-------|
| 1 | Login | |
| 2 | Ustad dashboard | |
| 3 | See assigned batches only | |
| 4 | Open assigned course lesson; download resource if any | |

## Student

| # | Check | Pass? |
|---|-------|-------|
| 1 | Login | |
| 2 | Student dashboard | |
| 3 | Open enrolled course; mark lesson progress | |
| 4 | Take quiz attempt if available | |
| 5 | View own attendance | |

## Auth recovery

| # | Check | Pass? |
|---|-------|-------|
| 1 | Forgot password sends mail (SMTP) | |
| 2 | Refresh keeps session after access expiry | |
