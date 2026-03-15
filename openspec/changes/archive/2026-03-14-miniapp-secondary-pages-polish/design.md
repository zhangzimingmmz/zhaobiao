## Context

After the primary shell direction changed, the remaining non-tab pages now stand out even more sharply. Login, register, and audit-status still use a blue-header structure that does not match the intended miniapp page family, while bid detail and info detail still rely on generic field sections and loosely defined top-bar actions.

These pages do not need the same shell as the primary-tab surfaces, but they do need a coherent secondary-page family so the app no longer feels like two unrelated products stitched together.

## Goals / Non-Goals

**Goals:**
- Define a coherent secondary-page family for form pages, status pages, and content/detail pages.
- Replace the older blue hero-like shells with a lighter miniapp-appropriate pattern.
- Clarify which actions belong to detail pages locally versus globally.
- Keep bid-detail favorites compatible with the shared favorites storage model.

**Non-Goals:**
- This change does not redefine first-level navigation.
- This change does not redesign the home, favorites, or profile tab surfaces.
- This change does not require server-side auth or favorites redesign beyond what the page family needs.

## Decisions

### 1. Form pages and content pages share a family, not a visual clone
- **Decision:** Login/register and detail pages SHALL belong to the same secondary-page family, but they SHALL use different content treatments beneath a shared back-navigation header pattern.
- **Why:** They need a common page identity without pretending forms and details are the same surface.
- **Alternative considered:** Give every secondary page a bespoke shell. Rejected because it would recreate the current inconsistency.

### 2. The older blue hero shell is retired for secondary pages
- **Decision:** Login, register, and audit-status SHALL no longer depend on the older blue hero-style header shell.
- **Why:** The user explicitly called out that this style is no longer the right fit for the evolved miniapp.
- **Alternative considered:** Keep the blue shell and just retune spacing. Rejected because the structure itself is now the problem.

### 3. Audit-status is a state page, not a form page
- **Decision:** Audit-status SHALL use explicit state-card treatment with next actions, rather than reusing login/register form layout or the older hero shell.
- **Why:** Its main job is to communicate progress and outcome, not collect input.
- **Alternative considered:** Treat audit-status as a minor variant of register. Rejected because its user task is different.

### 4. Detail-page actions are local to the content page
- **Decision:** Favorite, share, and original-link actions SHALL remain local to detail pages and SHALL NOT be promoted into the primary shell.
- **Why:** These actions operate on the currently viewed notice, not on app-level navigation.
- **Alternative considered:** Keep using shell-level shortcuts for these actions. Rejected because it blurs global navigation and content actions.

## Risks / Trade-offs

- **Secondary pages may still diverge if content blocks are redesigned independently** → Keep the shared header and spacing rules explicit.
- **Detail pages depend on favorites behavior that is defined elsewhere** → Treat the favorites storage model as an integration contract, not an implementation detail.
- **Auth and audit pages may still need product copy changes later** → Stabilize layout and interaction first, then tune copy.

## Migration Plan

1. Lock the new primary-shell model first so secondary pages can assume they are not first-level destinations.
2. Replace the old blue shell with the shared secondary-page family.
3. Rebuild login/register, audit-status, and detail pages against that family.
4. Validate local detail actions against the shared favorites/storage assumptions.

## Open Questions

- Should login and register share identical top spacing, or should login feel lighter than register?
- Does information detail need a dedicated share action, or is a generic “view original” pattern enough?

## Applied Notes

- The shared `secondary` top-bar variant was converted to a light header with back navigation and optional page-local action slots; the older blue hero shell is no longer used by login, register, audit-status, detail, or info-detail.
- Login and register now share the same compact intro plus white-card form family, but register keeps an extra explanatory tip block because enterprise certification needs stronger pre-submit guidance.
- Bid detail keeps only directly supported structured rows and never parses additional rows out of raw notice HTML.
- Information detail keeps share behavior page-local by copying the origin link when available, or the title when no origin link exists yet.
