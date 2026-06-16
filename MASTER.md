# SELLER STRATEGY DASHBOARD — PROJECT MASTER

This is the single source of truth. Read this first every session. Update it as we go — decisions, problems, status.

---

## PRODUCT THESIS

Strategy visualization platform for listing agents and sellers. Not a CRM, not analytics, not MLS. The dashboard shows the seller: what's happening, why, what's done, what's next, how marketing is performing, and what decisions may be needed. Premium feel — Apple / Wealthfront / Linear / visionOS. Dark mode, frosted glass, motion with purpose.

---

## PHASE PLAN

- **Phase 1 (V1 — current)**: templates + manual strategy creation, animated roadmap, marketing plan with "why" reasoning, seller visibility controls, agent view + seller read-only view
- **Phase 2**: AI-generated strategy, expanded explanation engine, template save/reuse, manual performance stat entry
- **Phase 3**: real performance integrations (Zillow, Realtor.com, MLS, showings, social), trend analytics
- **Phase 4**: marketing asset generator, external framework imports
- **Phase 5**: template marketplace, brokerage libraries
- **Phase 6**: multi-agent/team accounts, expanded seller portal

---

## V1 USER JOURNEYS

### Agent journey
1. Sign in → dashboard of all listings/strategies
2. Create new strategy for a property
   - Choose: start from template, or build manually
   - Fill property basics (address, price, seller goals)
3. Build the roadmap: set stages (Preparation → Photography → Pre-Marketing → Launch → Exposure → Engagement → Market Review → Offer Stage → Under Contract → Closing), mark status (completed/active/upcoming)
4. Build marketing plan: add items (MLS, social, video, open house, reverse prospecting, outreach), each with objective, status, "why" reasoning, results
5. Set visibility: toggle per-section / per-item what the seller can see (hide internal notes, hide reasoning, hide analytics)
6. Share seller view link with client
7. Update over time as listing progresses (status changes, add results, add new "why" entries)

### Seller journey
1. Open shared link (no login required for V1, or simple magic-link auth)
2. View roadmap — see progress at a glance, what stage they're in
3. View marketing plan — see what's been done, what's active, what's planned, with plain-language "why" for each
4. Read-only — cannot edit anything
5. Only sees what agent has made visible

---

## V1 SCREENS

**Agent side**
- Login / signup
- Listings dashboard (list of all strategies/properties)
- New strategy flow (template picker → property form → roadmap setup → marketing plan setup)
- Strategy editor (single property): roadmap tab, marketing plan tab, visibility settings tab
- Template library (view/select starter templates)

**Seller side**
- Seller view (single page, read-only): roadmap + marketing plan, filtered by visibility settings

---

## V1 DATA MODEL (draft)

```
User (Agent)
- id, name, email, password_hash

Property
- id, agentId, address, price, sellerGoals, sellerName, shareToken (for seller view link)

Strategy
- id, propertyId, templateSource (nullable: which template it was built from)

RoadmapStage
- id, propertyId, name, order, status (completed | active | upcoming)

MarketingItem
- id, propertyId, type (mls | social | video | open_house | reverse_prospecting | outreach | other)
- objective, status, reasoning ("why"), results
- visibleToSeller (boolean)

Template
- id, agentId (nullable for global starter templates), name
- roadmapStages (JSON snapshot of stages)
- marketingItems (JSON snapshot of items)

VisibilitySettings (per Property)
- showRoadmap, showMarketingPlan, showReasoning, showAnalytics (future), hiddenMarketingItemIds[]
```

---

## STARTER TEMPLATES (Phase 1)

1. **Standard Listing** — balanced roadmap + marketing mix
2. **Luxury Listing** — heavier on photography/video, private showings, press
3. **Fast Sale** — compressed timeline, aggressive pricing strategy, open-house heavy
4. **New Construction** — builder-focused milestones, fewer open houses, more digital/reverse prospecting

---

## DECISION LOG

| Date | Decision | Why | Alternatives considered |
|------|----------|-----|--------------------------|
| 2026-06-14 | V1 excludes AI strategy generation | Reduce complexity/risk; templates establish "what good looks like" first | AI-first generation (deferred to Phase 2) |
| 2026-06-14 | V1 excludes live performance integrations | External API/auth complexity, not core to strategy-visualization thesis | Manual stat entry placeholder (Phase 2) |
| 2026-06-14 | Project scaffolded with Next.js 14 (App Router), TypeScript, Tailwind | Matches stack used across other active projects (HomeBase, eXp Hub) for consistency | — |
| 2026-06-14 | Seller view via shareToken link, no seller login for V1 | Simplest path to "seller sees the plan" without auth complexity | Magic-link auth (possible Phase 2 if needed) |
| 2026-06-15 | Downgraded Prisma 7 → Prisma 5 | Prisma 7 removed `url`/`directUrl` from schema datasource in favor of a config-driven adapter setup, which broke the standard PrismaClient() singleton pattern used across other projects (HomeBase, eXp Hub). Prisma 5 keeps `prisma/schema.prisma` as the single source of truth for the connection string. | Migrate to Prisma 7's adapter pattern (more setup, inconsistent with other projects) |
| 2026-06-15 | Supabase Postgres connections must use port 5432 (session pooler / direct) for `prisma db push` / migrations; port 6543 (pgbouncer transaction pooler) hangs indefinitely on schema changes | pgbouncer transaction mode doesn't support the advisory locks / prepared statements Prisma needs for schema sync | DATABASE_URL can still use 6543 for the app's normal query traffic; only schema commands need port 5432 |

---

## PROBLEM LOG

| Issue | Root Cause | Resolution | Prevention Rule |
|-------|-----------|------------|-----------------|
| `prisma migrate dev` / `db push` hung indefinitely against Supabase | Connected via pgbouncer transaction-mode pooler (port 6543), which Prisma's schema-sync commands can't use | Ran `prisma db push --accept-data-loss --url <port 5432 connection string>` | For any future schema changes, run `prisma db push`/`migrate` against port 5432, not 6543 |
| NextAuth `/api/auth/session` returned 500 (HTML error page) | `PrismaClient` constructor incompatibilities while testing Prisma 7's new config API | Downgraded to Prisma 5 with `url`/`directUrl` in `schema.prisma` and plain `new PrismaClient()` | Keep Prisma on v5.x for this project unless there's a strong reason to upgrade |
| "Visibility & Sharing" tab caused horizontal overflow on narrow viewports | Long tab label with no wrap/scroll handling | Added `overflow-x-auto` + `whitespace-nowrap` to tab bar | — |

---

## IMPLEMENTATION STATUS

- [x] Phase 0 — Product definition
- [x] Phase 1 — V1 built and verified end-to-end:
  - Agent auth (signup/login via credentials + NextAuth)
  - New strategy flow with 4 starter templates (Standard, Luxury, Fast Sale, New Construction) or manual/blank start
  - Roadmap editor: add/remove/reorder stages, cycle status (Upcoming → Active → Completed)
  - Marketing plan editor: add/remove items, edit objective/status/reasoning/results, per-item seller visibility toggle
  - Visibility & Sharing tab: show/hide roadmap, marketing plan, reasoning, analytics (analytics reserved for Phase 3); seller share link
  - Seller view (read-only, no login) at `/seller/[shareToken]`, respects all visibility settings
  - Dark glass/premium UI theme applied globally
  - Verified live in browser: signup → create strategy from template → edit roadmap & marketing → seller view renders correctly

**Next up for Phase 1 polish (not yet done):**
- Empty/error states beyond the basics (e.g. deleting all roadmap stages, very long content)
- Mobile responsiveness pass (spot-checked only)
- Editing property details (address/price/seller info) after creation — currently only set at creation

---

## TEST / DEMO ACCOUNTS

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin (Alyssa) | alyssaspechtre@gmail.com | AdminStrategy2026! | Primary owner account |
| Test agent | testagent@strategy.local | TestAgent123! | For trying agent-side flows without touching the admin account |
| "Client" / seller | N/A — no login | N/A | Sellers never get an account/password. They get a read-only link: `/seller/[shareToken]`, generated per-property in the "Visibility & Sharing" tab. To test the seller experience, log in as an agent, open a property, copy its share link from "Visibility & Sharing," and open it in a separate browser/incognito window. |

Sign-out/sign-in flow verified working 2026-06-15: sign out returns to landing page, sign in with credentials above redirects to `/dashboard`.
