# ANSWERS.md

## 1. How to Run

**Prerequisites:** 
Node.js 18 or higher. Verify with `node -v`.

```bash
git clone https://github.com/comrade70/naija-zone-split-bill-app.git

npm install

npm run dev

Open **http://localhost:5173**. No environment variables, no config.
```

To build for production:
```bash
npm run build

npm run preview   
```

**Deployment url is :**
https://naija-zone-split-bill-app.vercel.app/

---

## 2. Stack & Design Choices
**Stack:** 
React 18 + Vite + vanilla CSS. No UI library, no state library used for CSS.

React was the right call here because the entire app is one reactive surface. A framework makes that dependency graph clean. Vite is the obvious dev server in 2025: near-instant HMR and zero config for a project this size. I intentionally skipped a component library because 
- The CSS is small enough to hand-write well
- External component libraries carry interaction opinions that would fight against the custom validation UX I wanted.

**Visual decision 1 The per-person panel takes 100% of card width.**
The per-person amount is the *answer the user actually came for*. Everything above it is input. If I would put it in a small badge or inline with the other rows, it would compete with the supporting figures. Making it full-width and visually dominant means you can pass a phone around a dinner table and everyone sees their number very clearly.

**Visual decision 2 — Preset tip buttons use a 4-column grid, not a flex row.**
With four options (10/15/18/20) a flex row collapses awkwardly on 360px screens. A CSS grid with `grid-template-columns: repeat(4, 1fr)` keeps all four tap targets equal-width and readable down to the narrowest common viewport, while on desktop they feel proportionally generous. The grid also makes the "active" state visually obvious by contrast.

---

## 3. Responsive & Accessibility
**Responsive behaviour:**

- **360px phone:** 
Single-column layout, no horizontal scrolling. Padding tightens from `1.75rem` to `1.25rem`. The per-person amount font scales from `2.6rem` to `2.1rem`. Preset buttons shrink slightly but stay finger-tappable (≥44px tap target via padding). The `inputMode="decimal"` / `inputMode="numeric"` attributes summon the right mobile keyboard so the number pad appears instead of the full keyboard.

- **1440px laptop:** 
The card caps at `460px` wide and centres with generous breathing room. The layout doesn't spread into a two-column form because there's no benefit at this data density.

**Skip-nav link accessibility skipped **
A "skip to results" link that jumps keyboard focus past the inputs to the output panel would be useful for a keyboard user who wants to recheck the figure without tabbing through all fields. I didn't implement it because the tab order is already short (5 stops: bill → tip presets → custom tip → number of people → reset) and focus moves naturally. With more time I would add it.

---

## Honest Gap
**The custom tip input and the preset buttons can fall out of sync in a confusing way.**

If you type `18` in the custom box, then click the 18% preset, the active preset lights up but the custom input still shows `18`. If you then clear the custom input, the preset deactivates and tip reverts to 0. The two controls feel like they are on separate tracks when they really should not be.

With another day I would unify them under a single `tipValue` state and let the UI derive which button (if any) is active from that value, so clicking 18% sets value to 18 and clears the custom field, and typing 18 in the custom field un-highlights any preset but keeps the value flowing into the calculation seamlessly. 
