# Forecast Futures Backlog

This file tracks the Forecast Futures backlog for the Dev & Donut topic. Keep work scoped to Forecast Futures only.

## Ready to Work

CARD-101 | Ready to Deploy | Create a trade-insight command center that wires backend metrics into the front end for big movers, outcome odds, and current opportunity score
AC:
1) The home surface shows a clear top summary with big movers, current odds, and an opportunity score.
2) The data shown comes from the same backend snapshot used by list/detail views.
3) The new hero/summary area remains readable on mobile and does not block other sections.

CARD-102 | Ready to Deploy | Connect live action buttons for list, detail, and trade surfaces so every primary control launches a real backend or UI handler
AC:
1) Every visible primary button has an explicit action and a working click handler.
2) Buttons either navigate, refresh, open detail, or launch the correct backend-linked action.
3) Buttons that are decorative or redundant are removed or demoted so the UI is not misleading.

CARD-103 | Ready to Deploy | Add historical calibration feedback showing how accurate estimated odds were versus resolved outcomes
AC:
1) The app shows a calibration summary comparing estimated odds versus actual resolved outcomes.
2) Historical accuracy is visible in a concise panel and can be reviewed from the detail or archive flow.
3) The copy clearly explains how accurate prior estimates were without exposing internal secrets.

CARD-104 | Ready to Deploy | Add adaptive odds adjustment feedback that updates opportunity ranking from successful forecast outcomes
AC:
1) Historical success and failure outcomes influence displayed ranking or confidence feedback.
2) The adjustment logic is deterministic and testable, not hidden in the renderer.
3) The app explains why an opportunity moved up or down in a way a user can understand.

CARD-105 | Ready to Deploy | Redesign the front end to reduce clutter, clarify button purpose, and keep sticky controls from blocking content
AC:
1) The primary surfaces are reorganized into a simpler hierarchy with fewer competing sections.
2) Sticky controls, overlays, and drawers do not cover core content on desktop or mobile.
3) Button labels are rewritten so users can tell what each action does before clicking.

CARD-106 | Deployed Done | Add saved compare sets and scenario board for side-by-side market review
AC:
1) Users can pin two or more markets into a saved compare set from list or detail surfaces.
2) Compare sets persist locally and restore after reload without breaking URL state.
3) The compare board stays readable on mobile and does not block the main list or detail flow.

CARD-107 | Deployed Done | Add trade journal notes and reason logging from detail and archive surfaces
AC:
1) Users can attach a short note and reason tags to a market from detail or archive.
2) Notes and timestamps persist locally and show up in the review flow.
3) The journal panel is compact, readable, and does not hide the main market controls.

CARD-108 | Deployed Done | Add watchlist pinning and section grouping so favorite markets stay at the top
AC:
1) Users can pin markets and see pinned items grouped above the rest of the watchlist.
2) Pin state persists after reload and survives list filtering and sorting.
3) Grouped rows remain touch-friendly and keep the existing row actions available.

CARD-109 | Deployed Done | Add export and share of the active opportunity screen with calibration and odds context
AC:
1) Share/export text includes the current market, odds, opportunity score, and calibration summary.
2) The export output stays consistent across list, detail, and archive surfaces.
3) Users can trigger the export from the active screen without losing their current selection.

CARD-110 | Deployed Done | Add a compact help drawer and action legend for keyboard, alerts, and trade actions
AC:
1) The help drawer explains the most important shortcuts, alerts, and trade actions in plain language.
2) The drawer is compact, opens from the hero or shortcut, and does not block core content.
3) Help content fits on mobile and keeps the main workflow reachable.

CARD-111 | Deployed Done | Add compare board management controls so saved compare sets can be renamed, deleted, and swapped quickly
AC:
1) Users can rename or delete saved compare sets from the compare board.
2) The active compare board can be swapped to a saved set without losing the current selection state.
3) Management controls stay compact and keep the compare board usable on mobile.

CARD-112 | Deployed Done | Add compare board snapshot saving so the active selection, note, and timestamp can be restored later
AC:
1) Users can save the current compare board as a named snapshot from the compare panel.
2) Saving preserves the selected market IDs, note text, and updated timestamp locally.
3) A restored snapshot reopens the same board without disturbing URL state or list filters.

CARD-113 | Deployed Done | Add undo for compare board clears and removals so accidental changes can be reversed quickly
AC:
1) Clearing or removing a compare item stores the previous board state for one-step undo.
2) Undo restores the prior compare IDs and re-renders the board immediately.
3) The undo control stays compact and does not block the compare panel on mobile.

CARD-114 | Deployed Done | Add watchlist pin ordering controls so favorite markets can be reordered and persisted
AC:
1) Pinned watchlist markets can move up or down within the pinned group.
2) The pinned order persists after reload and remains stable while filtering the watchlist.
3) Reordering keeps the existing watch, unwatch, and open-detail actions available.

CARD-115 | Deployed Done | Add edit and delete controls for trade journal entries from detail and archive surfaces
AC:
1) Journal entries can be edited in place or reopened from the detail/archive panels.
2) Deleting a journal entry removes only the note record and leaves the market surfaces intact.
3) Edited timestamps and tags persist locally and remain visible in review.

CARD-116 | Deployed Done | Add a compact overflow tray for share, export, and help actions on narrow layouts
AC:
1) Secondary actions collapse into an overflow tray when space is tight.
2) Share, export, and help launch the correct surface-specific handlers from the tray.
3) The tray remains keyboard accessible and does not cover the main market workspace.

CARD-117 | Deployed Done | Add rank and direction filter chips plus an active-filter summary in the list view
AC:
1) Users can filter the list by rank and direction using visible chips.
2) The active filter summary shows which chips are on and how to clear them.
3) The filter state survives reloads through URL or preset restore.

CARD-118 | Deployed Done | Extend scan presets so the current list filters save and restore together
AC:
1) Saving a preset captures search, sort, rank, direction, and watchlist state.
2) Restoring a preset re-applies the full filter state without losing the selected market.
3) The existing scan presets drawer can still save, restore, and clear filters.

CARD-119 | Deployed Done | Add journal search and tag chips so notes are easier to scan
AC:
1) Users can search journal entries by title, note text, or tags.
2) Top journal tags appear as quick filter chips in the journal panel.
3) Search and filter controls do not block editing or deleting notes.

CARD-120 | Deployed Done | Add a compact recent compare snapshot browser with preview and quick restore actions
AC:
1) Recent compare snapshots show the saved name, note, and timestamp.
2) Users can restore a snapshot directly from the preview row.
3) Snapshot previews stay compact on mobile and do not cover the compare board.

CARD-121 | Deployed Done | Add collapsible pinned and grouped watchlist sections so long lists can be compacted
AC:
1) Users can collapse pinned favorites or unpinned groups independently.
2) Collapsing sections preserves the underlying watchlist ordering and pin state.
3) Section toggles remain accessible and do not cover list content.

## Done

CARD-033 | Deployed Done | Add first-run onboarding guidance for list, detail, and trade actions
CARD-034 | Deployed Done | Add accessibility and keyboard navigation fixes for all primary surfaces
CARD-035 | Deployed Done | Improve feed performance for larger market sets
CARD-036 | Deployed Done | Add dismissible onboarding banner with local persistence
CARD-037 | Deployed Done | Add keyboard focus management and escape handling for modals
CARD-066 | Deployed Done | Surface server readiness and missing credential status in the UI
CARD-067 | Deployed Done | Add backend sync health, refresh, and retry status for data reads
CARD-068 | Deployed Done | Wire infrastructure guidance into onboarding and settings surfaces
CARD-069 | Deployed Done | Unblock sticky controls and overlay layers across list/detail/archive
CARD-070 | Deployed Done | Tighten responsive spacing and safe-area padding for mobile controls
CARD-071 | Deployed Done | Surface backend readiness panel and missing credential status in the app
CARD-072 | Deployed Done | Add refresh snapshot affordance for stateful UI screens
CARD-073 | Deployed Done | Add backend split guidance for Pages client and API host
CARD-074 | Deployed Done | Prevent fixed trade/nav controls from covering content on small screens
CARD-075 | Deployed Done | Add UI tests for readiness, guidance, refresh, and safe-area behavior
CARD-076 | Deployed Done | Show last snapshot refresh time and snapshot age in the backend card
CARD-077 | Deployed Done | Make snapshot refresh stateful and prevent duplicate reload taps
CARD-078 | Deployed Done | Surface backend env and deployment notes in a compact settings drawer
CARD-079 | Deployed Done | Harden ultra-narrow viewport spacing around sticky trade and nav controls
CARD-080 | Deployed Done | Add regression tests for snapshot metadata and safe-area layout behavior
CARD-081 | Deployed Done | Add snapshot provenance card for backend/import source and safe refresh copy
CARD-082 | Deployed Done | Add review export and share summary card that stays tied to backend review data
CARD-083 | Deployed Done | Connect morning brief, calibration, and archive review surfaces to one backend summary flow
CARD-084 | Deployed Done | Harden sticky trade and nav spacing so buttons do not block content sections
CARD-085 | Deployed Done | Verify backend-linked surfaces and layout fixes with regression tests
CARD-086 | Deployed Done | Redesign the home screen into a market command center with top status tiles, one primary signal block, and a tighter hierarchy for watchlists and scans.
CARD-087 | Deployed Done | Rebuild watchlist and scan result rows with compact symbols, change, freshness, and tiny sparklines plus quick actions.
CARD-088 | Deployed Done | Create a chart-centered market workspace with a contextual detail drawer that stays in place while users switch markets.
CARD-089 | Deployed Done | Add trust-first onboarding and status surfaces with plain-language guidance, clear state chips, and obvious next actions.
CARD-090 | Deployed Done | Remove overlay/button layouts that block sections and tighten mobile spacing, focus states, and safe-area behavior.
CARD-091 | Deployed Done | Add a command palette and keyboard shortcuts for switching between list, detail, trends, and archive views.
CARD-092 | Deployed Done | Restore the last selected market and selected view after reload while keeping URL state authoritative.
CARD-093 | Deployed Done | Add loading, empty, and error states for list, detail, and archive surfaces.
CARD-094 | Deployed Done | Add chart timeframe and compare-range controls in the detail workspace.
CARD-095 | Deployed Done | Add quick section anchors and mobile jump controls so users can reach every surface.
CARD-096 | Deployed Done | Connect remaining backend action rails to the list, detail, and archive surfaces
CARD-097 | Deployed Done | Surface backend fetch, retry, and error states without blocking the app
CARD-098 | Deployed Done | Add backend provenance and sync status to the compact settings drawer
CARD-099 | Deployed Done | Audit and remove any remaining overlay or sticky buttons that block content sections
CARD-100 | Deployed Done | Add regression tests for backend wiring, retry states, and blocker-free layout
CARD-147 | Deployed Done | Add a live Kalshi backend client that signs private-key requests and assembles the snapshot payload
CARD-148 | Deployed Done | Wire app bootstrap to load live backend data with demo fallback when credentials are missing
CARD-149 | Deployed Done | Update backend config, readiness reporting, and docs for Kalshi trade-api v2 and server-side auth
CARD-150 | Deployed Done | Add regression tests for request signing, live snapshot loading, and credential auto-detection
CARD-151 | Deployed Done | Keep generated demo output and Pages artifacts stable when the backend is unavailable
