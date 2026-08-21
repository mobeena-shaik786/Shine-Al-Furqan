# Frontend Architecture (Phases 16–17)

## State ownership

| Concern | Owner |
|---------|-------|
| Auth (user, tokens, login/logout/restore) | `AuthContext` |
| UI chrome (sidebar, theme, search open) | Redux `uiSlice` |
| Server data | Plain service modules + axios (`academicApi`, `usersApi`, …) |

Empty RTK Query `baseApi` and unused `authSlice` were removed in Phase 16.

## Shared UI

| Component | Use |
|-----------|-----|
| `components/ui/Modal.tsx` | Dialogs with focus trap, Escape, restore focus |
| `components/ui/FormField.tsx` | Labelled inputs with `aria-invalid` / `aria-describedby` |
| `pages/admin/UserRoleManagementPage.tsx` | Shared user CRUD table for admin/coord/ustad/student pages |

## Routing

- `app/router.tsx` lazy-loads dashboards, management, and academic pages behind `Suspense`.
- Auth screens stay eager for fast first paint.
- Unavailable product areas use `ComingSoonPage` with honest “not available yet” copy.

## Accessibility / UX (Phase 17)

- Skip link → `#main-content` in `DashboardLayout`.
- Mobile sidebar closes on Escape and route change.
- Tables use `overflow-x-auto` on small screens.
- Header “search” is **quick navigation** only (no mock search results).
