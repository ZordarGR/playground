# ⛏️ DEEPVEIN — an idle mining saga

A mining-themed idle/clicker game in pure HTML/CSS/JS — no build step, no dependencies,
no server. The economy, scaling and prestige system are copied faithfully from Orteil's
*Cookie Clicker*; the theme, art and writing are all original (gold-rush ledger meets
lantern-lit cavern — and deliberately **not** blocky).

## Play it

Open `index.html` in any modern browser. That's it.

Or build **`deepvein-standalone.html`** with `node tools/bundle.js` — the entire game
(styles, code, every sprite) inlined into one single file. Upload that one file
anywhere and it just works.

## Deploying

Any static host works:

- **GitHub Pages** — push this folder, enable Pages on the repo.
- **itch.io** — zip the folder (or just the standalone file, renamed `index.html`), upload as an HTML game.
- **Neocities / Netlify / Cloudflare Pages** — drag and drop.

## The economy (Cookie Clicker–faithful)

| Mechanic | Implementation |
| --- | --- |
| Building prices | `ceil(base × 1.15^owned)`, sell-back at 25% |
| 16 buildings | Base costs/CPS are Cookie Clicker's 16 buildings, verbatim (15 ore Pickaxe → 310 quadrillion Singularity Drill) |
| Tier upgrades | Unlock at 1/5/25/50/100/150/200 owned, cost base×{10, 50, 500, 50k, 5M, 500M, 50B}, each doubles the building |
| Pickaxe line | The cursor line: two doublers, then "Thousand Sparks" (+0.1/non-pickaxe building) with ×5/×10/×20/×20/×20 multipliers |
| Click scaling | "Mouse" upgrades: clicking gains +1% of CPS each |
| Kittens | Canaries: multiplier scales with morale (milk) = 4% per feat (achievement) |
| Golden cookies | Golden nuggets: Frenzy ×7 (77s), Lucky (+min(15% bank, 900×CPS)+13), Click Frenzy ×777 (13s) |
| Prestige | **Descend**: prestige level = ⌊∛(total forfeited ÷ 1 trillion)⌋; +1% CPS per level; diamonds = heavenly chips, spent on permanent Vault relics (including the 5%→100% effectiveness chain) |

Saves live in `localStorage`, autosaving every 30s, with export/import codes in the
Office tab. The hero boulder evolves through nine strata as your haul grows.

## Files

```
index.html                 game shell (hero boulder SVG lives inline here)
style.css                  all styling
game.js                    engine: economy, prestige, saves, rendering
assets/sprites/*.svg       18 hand-cut vector sprites
tools/bundle.js            node tools/bundle.js → builds deepvein-standalone.html
                           (the whole game in one file; generated, not committed)
```
