# Execution V3-0/V3-1 - 2026-05-11

## Reading checklist
- [x] docs/md/vertrex-os-v3-prd.md (sections 0, 2, 3, 8, 10)
- [x] docs/md/vertrex-os-v3-implementation-plan.md (V3-0 and V3-1)
- [x] docs/md/vertrex-os-v3-tasks-linear-spec.md (sections 2, 4, 6)
- [x] docs/md/vertrex-os-v3-gap-matrix.md
- [x] docs/md/vertrex-os-v3-ux-spec.md
- [x] docs/md/vertrex-os-v3-ux-implementation-plan.md

## Scope confirmed
- V3.0 + V3.1 (full V3 scope)

## Confirmed decisions
- Email provider: Resend
- Dependencies: resend and pdf-lib verified in package.json (V3-1 requirement); date-fns already present; no additional installs required
- Dependencies: dnd-kit will not be installed (no drag and drop in Kanban)
- PDF renderer: Playwright HTML->PDF is authoritative by explicit user instruction (overrides plan text). playwright is already present in package.json; no new install required. Keep pdf-lib dependency as required by V3-1 for any non-HTML use if needed
- Kanban: no drag and drop; use state menu
- OpenClaw: documented stub only (no implementation)
- Calendar sync: V3.0 remains read-only via GOOGLE_CALENDAR_PUBLIC_ICS; V3.1 uses Service Account + shared calendar for sync (bidirectional)
- Realtime SSE: V3.0 remains stub (heartbeat only); V3.1 implements in-memory SSE per instance
- PWA: basic baseline only (manifest + icons + SW shell cache), not the postponed optimized PWA
- Time tracking: manual per task only if implemented in V3.1; no automatic tracking
