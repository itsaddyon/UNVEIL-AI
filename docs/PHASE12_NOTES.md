# Phase 12 — Final Polish

## What this phase targeted
Not new features — eliminating the specific tells that make a project read
as "thrown together" rather than built with care: default browser chrome,
silent failures, abrupt pop-in, dead hover states, and a generic landing page.

## What was fixed

**App shell**
- Real favicon (an inline SVG node-and-edge mark matching the product,
  not the default Vite logo) and a proper `<title>`/meta description
- Global `:focus-visible` styling (steel/amber ring) replacing the default
  bright-blue browser outline everywhere in the app
- Custom dark scrollbars matching the theme instead of the OS default
- Consistent text-selection color

**Connection reliability**
- `ConnectionStatus.tsx` — a real, designed banner that appears only when
  the backend genuinely isn't reachable, with the exact command to fix it.
  Previously a dead backend meant silent blank screens everywhere.

**Cases page (the first thing anyone sees)**
- Full rebuild: proper Editorial-register header, a real loading skeleton
  (not blank/spinner), a distinct error state vs. an empty state (these
  were previously indistinguishable — a fetch failure looked identical to
  "0 cases"), and case rows redesigned as Paper-register cards with a
  deliberate hover motion (accent bar shifts steel→thread, arrow appears)

**Investigation canvas**
- Real loading/error states for the graph data (was a silent blank canvas)
- `Escape` key closes whichever panel is open
- Fixed a raw-ID leak: the instrument rail said "focused: persona 3" —
  now shows the actual handle
- Consistent focus/hover states on the search input, platform filter,
  investigate button, and history/export controls (some had zero visual
  feedback before, which reads as broken, not restrained)

**Inspector panels**
- Replaced bare "computing…" text and abrupt pop-in with shape-matched
  skeleton placeholders (a small reusable `Skeleton` component) for DNA,
  infrastructure, and attribution sections — loading now looks intentional
- Close button and notes textarea/button now have real hover/focus states

## Verification checklist
1. Check the browser tab — favicon should be a small dark square with a
   node/edge mark, title "UNVEIL AI — Investigation Workspace"
2. Tab through the Cases page and canvas with keyboard only — every
   focusable element should show a visible steel/amber ring, never the
   browser-default blue
3. Stop the backend, reload the app → a visible banner appears at the top
   ("Backend not reachable…") instead of a blank page; restart the backend
   → banner disappears within ~8 seconds without a manual reload
4. Load the Cases page on a fresh/slow connection → briefly see pulsing
   skeleton rows, not a blank page
5. Click a persona → DNA/infrastructure sections show pulsing skeletons
   for a moment before the real content appears, not a sudden pop-in
6. Click a relationship → confidence shows a skeleton block, then the real
   percentage — never "computing…" as bare text
7. Press `Escape` while any panel is open → it closes
8. Hover every button/link in the header (investigate, history, export,
   platform filter) and the notes "add note" button → each has a visible
   state change
9. Instrument rail after selecting a persona reads "focused: ShadowFox …",
   never "focused: persona 3"
10. Scrollbars throughout the app are dark/thin, not the OS default

## Known, disclosed remaining gaps
- No dedicated mobile/narrow-viewport layout — this is an investigator
  desktop workspace by design (Concept D), not a responsive consumer app
- No screen-reader/ARIA pass beyond native semantic HTML and focus order —
  keyboard navigation and focus visibility are covered, full accessibility
  audit would be a further pass
- Presentation screenshots aren't produced here (no browser available in
  this environment) — capture these from a live run using the Phase 11
  demo script as the shot list

**Status: Phase 12 complete. All 12 phases of the roadmap are now built.**
