# SkillForge UI Polish — Design Document

**Goal:** Visual polish pass on the existing SkillForge web UI — no functional changes, same component interfaces.

**Toolchain:** UI UX Pro Max (design direction) → Magic MCP (component generation)

---

## Visual Language

**Style:** Accessible & Ethical / Swiss Modernism 2.0 — structured, authoritative, human. Not decorative.

**Colors:**
- Primary: `#1B4F8A` (rich navy — Canadian gov trust signal)
- Accent/CTA: `#E8810A` (warm amber — opportunity)
- Background: `#F8F7F5` (warm white — replaces cold gray-50)
- Success: `#1A7A4A` (forest green)
- Cards: white with single soft shadow layer (no flat borders)

**Typography:**
- Keep Geist Sans — add weight contrast
- Headings: `font-extrabold`
- Labels: `font-semibold`
- Body: `font-normal`
- Match score (hero number): larger, prominent

**Spacing:**
- `rounded-xl` consistently throughout
- More breathing room inside cards

---

## Component Changes

### IntakeForm
- Resume drop zone: upload icon + animated dashed border on hover + clear state transitions (idle → spinner → checkmark)
- Priority group checkboxes → pill/chip toggles
- Section divider: more intentional visual break

### MatchReport
- Match score: circular progress ring (score is the hero)
- Skill transfer / demand / wage bars: thicker, labeled, color-coded end caps
- Demand badge: colored pill with directional icon (↑ ↑→ ↓)
- Card: navy left-border accent instead of flat card

### ReferralPackage
- Funding amount: own visual block with amber accent, large scannable number
- Checklist: icon + item layout
- Section headers: navy left-border rule
- PDF button: amber CTA, prominent

### Overall Shell
- Page background: `#F8F7F5`
- SkillForge wordmark/header (currently missing — just an h1 in the form)
- Consistent soft card shadows

---

## Scope Boundary

**Changes:** JSX markup and Tailwind classes only.

**Unchanged:** All business logic, API calls, state management, TypeScript types, 3-state page machine in `page.tsx`, all API routes.

---

## Implementation Approach

1. Install UI UX Pro Max Claude Code plugin
2. Configure Magic MCP (`~/.claude/mcp_servers.json`) with 21st.dev API key
3. Run UI UX Pro Max → generate SkillForge design tokens (Tailwind CSS variables)
4. Use Magic MCP `/ui` to regenerate components one at a time:
   - `IntakeForm.tsx`
   - `MatchReport.tsx`
   - `ReferralPackage.tsx`
   - `EngineStatus.tsx`
   - Page shell / header
5. Wire each back into Next.js app (props interface unchanged)
6. Deploy: rsync → `npm run build` → `systemctl restart skillforge-web`
