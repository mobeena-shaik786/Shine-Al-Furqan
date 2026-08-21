# Mock vs Real Matrix

| Surface | Classification | Notes |
|---------|----------------|-------|
| Login | **Real** | Access JWT + HttpOnly refresh cookie |
| Session restore (`/me` + refresh) | **Real** | AuthContext; axios refresh on 401 |
| Logout | **Real** | Server revokes refresh; clears cookie |
| Forgot / reset password | **Real** | Email via mail transport; no prod token logs |
| Change password | **Real** | Profile page + API |
| Profile | **Real** | View + edit (name/phone/location) + change password via `/auth/me` |
| Admin / Coord / Ustad / Student dashboards | **Real** | Live aggregates; see `DASHBOARD_METRICS.md` |
| `GET /api/*/dashboard` | **Real** | Mongo counts / rates; auth + role gates |
| Header global search | **Unavailable (honest)** | Quick links only; no fake results |
| Admin / Coord / Ustad / Student management | **Real** | MongoDB via `/api/users`; deactivate (no hard delete) |
| Courses / modules / lessons / batches | **Real** | Course Master UI + topics catalog; Phases 7–8 |
| Topics / Syllabus catalog | **Real** | `/syllabus` UI + `/api/topics` CRUD; MongoDB seeded |
| Certificates | **Real** | `/certificates` Issued + Eligible tabs; issue for completed batches |
| Attendance | **Real** | `/attendance` Overview/Ustad/Student tabs + mark session details |
| Notifications inbox | **Real** | `/notifications` All/Unread/Read + search/type; read receipts |
| Enrollment / progress | **Real** | Phases 9–10 |
| Quizzes | **Real** | MCQ; answer keys server-only (Phase 11) |
| Attendance | **Real** | Batch+date sessions; Path A implemented (Phase 12) |
| Lesson file uploads | **Real** | Allowlisted MIME + auth download; local disk (Phase 14) |
| Batch detail roster | **Coming Soon** | |
| Lead Management | **Real** | `/leads` CRUD + filters/stats; detail route still Coming Soon |
| Lead / Fee dashboard widgets | **Deferred** | Pipeline cards on home still deferred |
| Salary Management | **Real** | Admin `/salaries`; ustad payroll from attendance (unique/fixed days); coordinator tab soon |
| System Settings | **Real** | Admin `/settings`: notifications send/history, salary rules, Jitsi; approvals/audit Soon |
| Coming Soon pages | **Placeholder** | Auth + **role-gated** |
| Health endpoint | **Real** | |

## Rule for agents

If a screen still uses mock data, keep it labeled in code and do not claim persistence. Academic HTTP/UI vertical slices start in Phase 7+.
