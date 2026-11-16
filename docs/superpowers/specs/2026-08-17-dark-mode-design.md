# Dark mode

## Goal

Add a user-toggleable dark theme across the whole site (customer pages + admin dashboard), consistent with the existing Suzuki brand (red `#E60012` accent, Tailwind `zinc` grays).

## Architecture

Tailwind v4's default `dark:` variant follows `prefers-color-scheme` only. To support a user override (not just OS setting), switch it to class-based:

- `app/globals.css`: add `@custom-variant dark (&:where(.dark, .dark *));` — makes `dark:` respond to a `.dark` class on an ancestor instead of the media query.
- `components/ThemeProvider.tsx` (client component): holds `theme: 'light' | 'dark'` state, exposes a `useTheme()` hook with a `toggle()` function. On change, sets/removes the `dark` class on `document.documentElement` and writes the choice to `localStorage` (`key: theme`).
- `app/layout.tsx`: wrap children in `ThemeProvider`. Add an inline blocking `<script>` in `<head>` that runs before hydration — reads `localStorage.theme`, falls back to `window.matchMedia('(prefers-color-scheme: dark)')`, and sets the `dark` class on `<html>` immediately. This prevents a light-mode flash on load.
- `components/ThemeToggle.tsx`: sun/moon icon button (lucide-react `Sun`/`Moon`), calls `useTheme().toggle()`. Added to `Navbar.tsx` next to Login/Register.

## Color tokens

No new palette — mirror the existing Tailwind `zinc` scale already used throughout the codebase, one-to-one:

| Light | Dark |
|---|---|
| `bg-white` | `dark:bg-zinc-900` |
| `bg-zinc-50` | `dark:bg-zinc-950` |
| `text-zinc-900` (headings) | `dark:text-zinc-100` |
| `text-zinc-600` (body) | `dark:text-zinc-400` |
| `text-zinc-500` (muted) | `dark:text-zinc-500` |
| `border-zinc-200` | `dark:border-zinc-800` |
| `border-zinc-100` | `dark:border-zinc-800` |

Accent `#E60012` (buttons, active tab state, price text) stays identical in both themes — already passes contrast against both white and zinc-900.

`bg-zinc-100` (e.g. tab list backgrounds) → `dark:bg-zinc-800`.

## Component rollout

~28 files reference `zinc-`/`bg-white`/`#E60012` classes and need `dark:` pairs added (list captured via `grep -rln "recharts\|#E60012" components app`). Convert in two phases:

1. **Reference pass** (done by hand, sets the pattern): `Navbar.tsx` and `app/(site)/page.tsx` (homepage) — includes the new `ThemeProvider`/`ThemeToggle` wiring plus the first real dark-mode class conversions to validate the token table above actually reads well.
2. **Bulk pass** (parallel subagents once phase 1 is verified in-browser): remaining ~26 files, each subagent handles a small batch (2-4 files), applying the same class-pairing table mechanically. No new components, no restructuring — additive `dark:` classes only.

**Special case — `app/(site)/admin/analytics/page.tsx`**: uses `recharts`. Chart stroke/fill/grid colors are set via component props, not Tailwind classes, and need explicit light/dark values (read from the `useTheme()` hook) rather than a `dark:` class pair.

## Testing

- Existing Vitest suite shouldn't need changes — no tests assert on Tailwind class names.
- Manual verification in browser: toggle dark mode on home, bikes, cart, checkout, and one admin page (analytics, to confirm chart legibility); confirm no light-flash on hard reload; confirm choice persists across navigation and reload.

## Out of scope

- No new color palette / rebrand.
- No per-component theme customization beyond the light/dark pair.
- No system-preference-only mode without override (toggle always wins once set).
