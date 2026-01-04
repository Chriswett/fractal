# testplan.md

## Setup
- Build/run: `npm install`, `npm run dev`, open `http://localhost:5173` in Chrome/Edge with GPU acceleration on.
- Clean state: clear LocalStorage + IndexedDB for `fraktaler-db`, reload once.

## Functional
- TC1 App loads: topbar, side panel, and central canvas render; canvas is dominant on desktop and mobile.
- TC2 Progressive render: default Mandelbrot appears coarse first then refines; no spinner or blocking loader.
- TC3 Latest intent wins: pan/zoom during render; previous render stops; new render starts immediately.
- TC4 Preset switching: select Mandelbrot/Julia/Sierpinski/Koch presets; correct renderer is used and image changes.
- TC5 Color studio (standard): change gradient, smooth toggle, gamma, levels; immediate visual update.
- TC6 Color studio (advanced): add/remove stop, hue shift, saturation, exposure, dither; updates without errors.
- TC7 User presets: save current view; preset appears in “Your presets”; select loads; delete removes; persists after reload.
- TC8 Timeline: add keyframe, edit t, play; viewport animates; playback uses interactive quality; pause triggers final refinement.
- TC9 Export PNG: export current view; file downloads and opens.
- TC10 Export hi-res PNG: export hi-res at scale 2+; file resolution increases accordingly.
- TC11 Export JSON: export Scene/Presets; JSON contains version + data; import restores state and re-renders.
- TC12 Fullscreen: toggle fullscreen from topbar; canvas remains visible and interactive.

## Persistence
- TC13 UI prefs: active panel + advanced color toggle persist after reload.
- TC14 Last scene: reload app; last scene restores from IndexedDB.

## Responsiveness/Performance
- TC15 Interaction quality: during drag/zoom, quick feedback; idle triggers higher-quality refinement.
- TC16 CPU fractals: Sierpinski/Koch render progressively without blocking UI; interaction cancels old passes.
