# CRM "Asignado a" Multi-Select Filter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a multi-select "Asignado a" filter on `/os/crm` to filter clients by which team member(s) are assigned as contactors (via the M2M `clientContactors` table), including a "Sin asignar" special option.

**Architecture:** URL searchParam `?contactor=<id1>,<id2>,<none>` (server-side Drizzle filter), new reusable `MultiSelect` component built on Radix Popover+Checkbox, integrated into the existing CRM `FiltersPanel` (desktop + mobile).

**Tech Stack:** Next.js 15 (App Router), React 19, Drizzle ORM, Radix UI (Popover, Checkbox), shadcn/ui-style components, Tailwind, sonner (toasts), lucide-react (icons).

**Spec:** `docs/superpowers/specs/2026-07-06-crm-contactor-filter-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/ui/multi-select.tsx` | **NEW.** Reusable multi-select dropdown over Radix Popover+Checkbox. Renders selected items as text in the trigger, full list with checkboxes in the popover. Used by CRM filter, designed to be reusable. |
| `src/app/os/crm/page.tsx` | **MODIFY.** Add `contactor` URL param parsing, change contactors `innerJoin` → `leftJoin`, add WHERE clause using `or(exists(...), notExists(...))`, pass `contactorOptions` prop to `CrmList`. |
| `src/app/os/crm/CrmList.tsx` | **MODIFY.** Accept `contactorOptions` prop. Read `?contactor=` from URL. Insert `<MultiSelect>` in desktop `FiltersPanel` and mobile filters panel. Wire `buildUrl` to serialize. |

No schema changes. No new server actions needed (existing `listTeamMembersAction` is reused).

---

## Task 1: Create reusable `MultiSelect` component

**Files:**
- Create: `src/components/ui/multi-select.tsx`

- [ ] **Step 1: Inspect existing UI primitives to match style**

Read `src/components/ui/select.tsx` and `src/components/ui/button.tsx` to copy the trigger styling, focus-ring classes, and shadcn-style props pattern used in the codebase. Also check `src/components/ui/dropdown-menu.tsx` for Radix wrapping conventions.

- [ ] **Step 2: Write the component**

Create `src/components/ui/multi-select.tsx` with the following API:

```tsx
"use client";
import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type MultiSelectOption = {
  id: string;
  label: string;
  sublabel?: string;
  dividerBefore?: boolean;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Tokens to treat as "clear all" in the footer button. */
  emptyLabel?: string;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleccionar",
  className,
  emptyLabel = "Todos",
}: MultiSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  const label = (() => {
    if (selected.length === 0) return emptyLabel;
    const opts = options.filter((o) => selected.includes(o.id));
    const names = opts.map((o) => o.label);
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} más`;
  })();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            "h-9 w-full justify-between font-normal",
            selected.length > 0 && "border-primary/40 bg-primary/5",
            className,
          )}
        >
          <span className="truncate text-left">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="max-h-72 overflow-y-auto py-1">
          {options.map((opt) => {
            const checked = selected.includes(opt.id);
            return (
              <React.Fragment key={opt.id}>
                {opt.dividerBefore && <div className="my-1 h-px bg-border" />}
                <button
                  type="button"
                  onClick={() => toggle(opt.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent",
                    opt.dividerBefore && "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background",
                    )}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="truncate text-xs text-muted-foreground">{opt.sublabel}</div>
                    )}
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => onChange([])}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Limpiar
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 3: Verify Popover component exists**

Confirm `src/components/ui/popover.tsx` exists. If not, create it (shadcn-style wrapper around Radix Popover):

```tsx
"use client";
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-md outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
```

- [ ] **Step 4: Verify `cn` utility exists**

Check `src/lib/utils.ts` exports `cn` (likely `import { clsx, type ClassValue } from "clsx"; import { twMerge } from "tailwind-merge"; export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }`). It should already exist — if not, create it.

- [ ] **Step 5: Verify the component compiles**

Run: `cd /mnt/datos/Proyectos/Web/Vertrex-Website && npx tsc --noEmit src/components/ui/multi-select.tsx 2>&1 | head -20`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/multi-select.tsx src/components/ui/popover.tsx src/lib/utils.ts
git commit -m "feat(ui): add reusable MultiSelect component (Radix Popover+Checkbox)"
```

---

## Task 2: Wire up the server-side filter in `page.tsx`

**Files:**
- Modify: `src/app/os/crm/page.tsx` (parser, join change, where clause, prop, and `count()` filter)

- [ ] **Step 1: Read current `page.tsx` thoroughly**

Confirm current shape (line numbers from spec are accurate as of the time of writing). Identify:
- The `whereConditions` builder (around line 41-101).
- The `innerJoin` for contactors (around line 155-159).
- The `count()` query (around line 138) and the paginated `select()` (around line 115).
- Where `CrmList` is rendered with props (around line 192-211).

- [ ] **Step 2: Add the parser helper**

Insert just below the `PAGE_SIZE` constant, before `CrmPage`:

```ts
type ContactorFilter = { userIds: string[]; includeUnassigned: boolean };

function parseContactorParam(raw: string | undefined): ContactorFilter {
  if (!raw) return { userIds: [], includeUnassigned: false };
  const tokens = raw.split(",").map((t) => t.trim()).filter(Boolean);
  const userIds = tokens.filter((t) => t && t !== "none");
  const includeUnassigned = tokens.includes("none");
  return { userIds, includeUnassigned };
}
```

- [ ] **Step 3: Read it from `searchParams` and add WHERE clause**

Inside `CrmPage` (after the existing destructuring of `searchParams` around line 25), add:

```ts
const contactor = parseContactorParam(searchParams.contactor);
```

Then, when building `whereConditions` (the array passed to `and(...)`), append the contactor clause at the end:

```ts
if (contactor.userIds.length > 0 || contactor.includeUnassigned) {
  const conds = [] as any[];
  if (contactor.userIds.length > 0) {
    conds.push(
      exists(
        db.select({ one: sql`1` })
          .from(clientContactors)
          .where(
            and(
              eq(clientContactors.clientId, clients.id),
              inArray(clientContactors.userId, contactor.userIds),
            ),
          ),
      ),
    );
  }
  if (contactor.includeUnassigned) {
    conds.push(
      notExists(
        db.select({ one: sql`1` })
          .from(clientContactors)
          .where(eq(clientContactors.clientId, clients.id)),
      ),
    );
  }
  conditions.push(or(...conds));
}
```

Add the necessary imports to the top of `page.tsx` (Drizzle helpers):

```ts
import { eq, sql, ilike, and, or, count, inArray, exists, notExists } from "drizzle-orm";
```

- [ ] **Step 4: Switch the contactors join to `leftJoin`**

Change the `innerJoin(clientContactors, ...)` (around line 155-159) to `leftJoin`. The mapping step that follows (around line 175-184) already defaults `contactors` to `[]` for clients without rows, so it will continue to work.

- [ ] **Step 5: Compute `contactorOptions` to pass to `CrmList`**

After the main `Promise.all` block, add (still inside the server component):

```ts
import { listTeamMembersAction } from "@/lib/db/actions/crm";

// after the main query block, before rendering CrmList:
const teamMembers = await listTeamMembersAction();
const orphanClients = await db
  .select({ id: clients.id })
  .from(clients)
  .leftJoin(clientContactors, eq(clientContactors.clientId, clients.id))
  .where(isNull(clientContactors.id))
  .limit(1);
const unassignedAvailable = orphanClients.length > 0;

const contactorOptions = [
  ...teamMembers.map((m) => ({ id: m.id, label: m.name, sublabel: m.email })),
  ...(unassignedAvailable
    ? [{ id: "none", label: "Sin asignar", sublabel: "Sin miembro asignado", dividerBefore: true }]
    : []),
];
```

Add `isNull` to the Drizzle imports.

- [ ] **Step 6: Pass `contactorOptions` as a prop to `<CrmList>`**

Update the `<CrmList ... />` JSX (around line 192-211) to include the new prop:

```tsx
<CrmList
  clients={clientsWithContactors}
  stats={stats}
  webPresenceStats={webPresenceStats}
  totalCount={totalCount}
  totalPages={totalPages}
  currentPage={currentPage}
  sectors={sectors}
  cities={cities}
  countries={countries}
  contactorOptions={contactorOptions}
/>
```

- [ ] **Step 7: Verify the page compiles**

Run: `cd /mnt/datos/Proyectos/Web/Vertrex-Website && npx tsc --noEmit 2>&1 | head -30`
Expected: no new errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/os/crm/page.tsx
git commit -m "feat(crm): add contactor URL filter (multi-select) at page.tsx level"
```

---

## Task 3: Integrate `MultiSelect` in `CrmList.tsx` (desktop + mobile)

**Files:**
- Modify: `src/app/os/crm/CrmList.tsx`

- [ ] **Step 1: Read `CrmList.tsx` filter sections**

Locate the `FiltersPanel` (around line 345-419) and the mobile filters panel (around line 561-658). Note the existing `Select` patterns used to match the style.

- [ ] **Step 2: Add the prop to `CrmListProps` and destructure**

At the top of the file, find the `CrmListProps` type (or the function signature) and add:

```ts
contactorOptions: Array<{ id: string; label: string; sublabel?: string; dividerBefore?: boolean }>;
```

Update the function signature accordingly. Default to `[]` if the prop is missing (for safety) — destructure with default in the function arg.

- [ ] **Step 3: Read and serialize `?contactor=`**

In the existing `searchParams` reads (around line 104-110), add:

```ts
const contactorFilter = (searchParams.get("contactor") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
```

- [ ] **Step 4: Add a setter that updates the URL**

```ts
const setContactorFilter = (next: string[]) => {
  router.push(buildUrl({ contactor: next.length > 0 ? next.join(",") : "" }));
};
```

(Use the existing `buildUrl` helper at line 112-124; it already strips empty values.)

- [ ] **Step 5: Insert the `MultiSelect` in the desktop `FiltersPanel`**

Inside the `FiltersPanel` JSX, alongside the existing `Select` filters, add:

```tsx
<div className="flex-1 min-w-[180px]">
  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
    Asignado a
  </label>
  <MultiSelect
    options={contactorOptions}
    selected={contactorFilter}
    onChange={setContactorFilter}
    emptyLabel="Todos los miembros"
  />
</div>
```

- [ ] **Step 6: Insert the `MultiSelect` in the mobile filters panel**

Mirror the same `<div>...</div>` block in the mobile filters panel (line 561-658), preserving the same label "Asignado a" and the same options. Match the visual style of the surrounding mobile filters.

- [ ] **Step 7: Import `MultiSelect`**

Add the import at the top of the file:

```ts
import { MultiSelect } from "@/components/ui/multi-select";
```

- [ ] **Step 8: Verify the page compiles**

Run: `cd /mnt/datos/Proyectos/Web/Vertrex-Website && npx tsc --noEmit 2>&1 | head -30`
Expected: no new errors.

- [ ] **Step 9: Manual end-to-end check**

Start the dev server (`npm run dev` on port 3050 if 3000 is busy). Log in. Navigate to `/os/crm`. Verify:
- The "Asignado a" filter appears in both the desktop filters panel and the mobile filters panel.
- Selecting one team member filters the list to only their clients.
- Selecting multiple works (OR semantics).
- "Sin asignar" appears only if there are clients without contactors.
- The URL updates accordingly.
- Pagination resets when the filter changes.

- [ ] **Step 10: Commit**

```bash
git add src/app/os/crm/CrmList.tsx
git commit -m "feat(crm): add Asignado a multi-select filter UI (desktop + mobile)"
```

---

## Task 4: Update docstrings / plan checklist

- [ ] **Step 1: Confirm spec file links to plan**

Open `docs/superpowers/specs/2026-07-06-crm-contactor-filter-design.md` and verify the "Spec" line is fine (it already says it's the design doc — no changes needed unless a test was added).

- [ ] **Step 2: Commit (only if there are doc edits)**

```bash
git add docs/superpowers/specs/2026-07-06-crm-contactor-filter-design.md
git diff --cached --quiet || git commit -m "docs: link to implementation plan"
```

---

## Self-Review

**Spec coverage:**
- Multi-select con badges → Task 1 (MultiSelect) + Task 3 (UI integration). ✓
- "Sin asignar" como opción especial → Task 1 (dividerBefore prop) + Task 2 (includeUnassigned branch) + Task 3 (passes it via contactorOptions). ✓
- Dentro del FiltersPanel existente → Task 3 step 5 + 6. ✓
- URL searchParam `?contactor=...` → Task 2 step 3 + Task 3 step 3/4. ✓
- leftJoin en contactors → Task 2 step 4. ✓
- EXISTS / NOT EXISTS en el WHERE → Task 2 step 3. ✓
- `contactorOptions` pasada como prop → Task 2 step 6 + Task 3 step 2. ✓
- Edge cases (vacío, usuario inactivo, page reset) → handled by buildUrl stripping + OR semantics + parser. ✓
- Testing → Task 3 step 9 (manual) — sufficient for this scope (no test infra was set up for CRM; spec lists manual checks).

**Placeholder scan:** No TBDs. Every step has concrete code or commands.

**Type consistency:** `MultiSelectOption` defined in Task 1 step 2 used in Task 3. `parseContactorParam` defined in Task 2 used in Task 2 only. Prop name `contactorOptions` used consistently. `searchParams.contactor` read once in Task 2 and once in Task 3 (page vs client component — both legit).

All clear. Proceed to execution.
