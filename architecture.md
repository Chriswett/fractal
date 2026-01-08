# architecture.md – Fraktal-webbapp (Fraktaler)

## 1. Översikt
Applikationen är en ren frontend-webapp (ingen backend i v1) som låter användaren utforska, färgsätta och animera fraktaler i en central canvas.

Arkitekturen är byggd för:
- WebGL2 som primär renderingsmotor
- Progressiv, avbrytbar rendering för hög responsivitet
- En tydlig och serialiserbar Scene-modell
- Estetik som förstaklass-medborgare
- Modulär struktur så nya fraktaltyper enkelt kan läggas till i kod senare

All funktionalitet körs lokalt i webbläsaren.

---

## 2. Huvudlager och ansvar

### 2.1 UI-lager (React + TypeScript)
Ansvarar för presentation och användarinteraktion.

**Huvudkomponenter**
- App Shell (layout, routing)
- Central Canvas (fraktalrendering)
- Sidopanel:
  - Fractal Gallery (parameter + presets)
  - Color Studio
  - Timeline (zoomresor)
  - Export
- Topbar:
  - Reset view
  - Fullscreen
  - Export

**UI-principer**
- Fraktalen är alltid i centrum
- Ikonbaserade kontroller
- Tooltips på hover:
  - Kort label
  - Vid behov: 1–2 rader förklaring
- UI-state (hover, paneler, tooltips) får **aldrig** blockera rendering

---

### 2.2 UI Design System (Design tokens)
Ett lättviktigt designsystem används för konsekvens och estetik.

**Designmål**
- Modern, minimalistisk, ljus UI
- Neutral men estetisk färgpalett
- Fraktalen ska visuellt dominera

**Tokens**
- `colors` (neutral bas + accent)
- `typography` (font stack, storlekar, vikter)
- `spacing` (4/8-baserad skala)
- `radius`
- `shadow`
- `zIndex`
- `motion` (standard easing + durations)

Tokens implementeras via CSS variables.

---

### 2.3 State-lager (App State)
All rendering styrs av ett centralt, serialiserbart state.

**Principer**
- Allt som påverkar bilden finns i `Scene`
- Renderern är deterministisk givet `Scene`
- State kan sparas/laddas/exporteras som JSON

Rekommenderad implementation:
- Zustand / Redux Toolkit / egen reducer (valfritt)

---

### 2.4 Fractal Engine (beräkningslager)
Ett gemensamt motorlager för alla fraktaltyper.

**Ansvar**
- Beräkna fraktaldata
- Rendera till canvas / framebuffer
- Vara helt avbrytbar

Alla fraktaltyper implementerar ett gemensamt interface:
- `IFractalRenderer`

---

### 2.5 Render Scheduler (progressiv rendering)
Central komponent som styr **när**, **hur** och **om** rendering sker.

Ansvarar för:
- Start/avbrott av rendering
- Progressiva pass (blockstorlekar)
- Kvalitetsnivåer (interactive vs final)
- Prioritering av senaste användaravsikt

---

### 2.6 Persistens och export
- IndexedDB:
  - Användarens presets
  - Sparade zoomresor (journeys)
  - Sparade scener
- LocalStorage:
  - UI-preferenser
  - Senast valda preset
- Export:
  - PNG (canvas snapshot, ev. hi-res)
  - JSON (Scene / Presets)

---

## 3. Datamodell

### 3.1 Kärntyper

#### `FractalType`
```ts
"mandelbrot" | "multibrot3" | "tricorn" | "burning-ship"
| "julia" | "tricorn-julia" | "burning-ship-julia"
| "newton-z3" | "halley-z3" | "newton-sin"

Viewport
{
  centerX: number
  centerY: number
  scale: number        // units per pixel
  rotation?: number
}

FractalParams
* Mandelbrot / Multibrot / Tricorn / Burning Ship:
  * maxIter
  * escapeRadius
  * parameter (number)
    - Mandelbrot/Multibrot: phase (grader)
    - Tricorn: conjugation blend (0..1)
    - Burning Ship: fold blend (0..1)
* Julia / Tricorn-Julia / Burning Ship-Julia:
  * cRe
  * cIm
  * maxIter
  * escapeRadius
  * parameter (number)
    - C angle (grader)
* Newton (z^3-1):
  * maxIter
  * tolerance
  * parameter (number)
    - phase (grader)
* Halley (z^3-1):
  * maxIter
  * tolerance
  * parameter (number)
    - phase (grader)
* Newton (sin z):
  * maxIter
  * tolerance
  * parameter (number)
    - phase (grader)

ColorProfile
{
  gradientStops: { t: number; color: RGBA }[]
  smoothColoring: boolean
  gamma: number
  levels: { black: number; white: number }
  hueShift: number
  saturation: number
  exposure?: number
}

RenderSettings
{
  resolutionScale: number
  progressive: { enabled: boolean; tileSizes: number[] }
  qualityHint: "interactive" | "final"
  dither?: boolean
}

Scene
{
  id: string
  fractalType: FractalType
  params: FractalParams
  viewport: Viewport
  color: ColorProfile
  render: RenderSettings
}

Preset
{
  id: string
  name: string
  kind: "builtin" | "user"
  scene: Scene
  tags?: string[]
  thumbnail?: string
}

Journey
{
  id: string
  name: string
  kind: "user"
  scene: Scene
  timeline: Timeline
}

Timeline
{
  durationMs: number
  keyframes: Keyframe[]
}

Keyframe
{
  t: number           // ms
  viewport: Viewport
}

4. Renderingpipeline

4.1 Escape-time (Mandelbrot / Multibrot / Tricorn / Burning Ship + Julia-varianter) ? WebGL2
- Fragment shader ber?knar iteration per pixel
- Smooth coloring i shader
- ColorProfile appliceras i shader
- Progressiv rendering
- Render till offscreen framebuffer i l?g uppl?sning
- Skala upp till canvas
- Upprepa med mindre tileSize tills 1x1

4.2 Newton/Halley (z^3-1, sin z) ? WebGL2
- Fragment shader itererar Newton/Halley per pixel
- Konvergens styrs av tolerance
- Root-baserad f?rgning (rot-id + iterationsbaserad shading)
- Progressiv rendering

5. Responsiveness och avbruten rendering (KRITISKT KRAV)
- Grundprincip
  * Användargränssnittet ska alltid vara responsivt.
  * Ny pan/zoom/scroll avbryter omedelbart pågående rendering
  * Endast den senaste användaravsikten renderas
  * Rendering får aldrig blockera UI

- Render-prioritering: “latest intent wins”
  * Varje render tilldelas ett renderJobId
  * En global activeRenderJobId hålls av Render Scheduler
  * Vid ny interaktion:
    - activeRenderJobId uppdateras
    - Alla äldre jobb ignoreras eller avbryts
    - Ny rendering startar direkt (grov kvalitet)
  * Renderern får aldrig committa ett resultat från ett inaktuellt jobb.

- Interaktionslägen
  * Aktiv interaktion
    - qualityHint = "interactive"
    - Lägre iterations
    - Större tileSize
    - Lägre upplösning
    - Mål: omedelbar feedback
  * Idle efter interaktion
    - Trigger efter debounce (≈150–250 ms)
    - qualityHint = "final"
    - Full progressiv rendering till maximal kvalitet

- Avbrott per renderingstyp
  * WebGL2
    - Varje pass kontrollerar jobId === activeRenderJobId
    - Gamla framebuffers skrivs aldrig till canvas
  * CPU / WebWorker
    - Worker får jobId
    - Avbryts via cancel-message eller ignorerar resultat

- Explicit icke-beteende
  ❌ Köa renderingar
  ❌ Låsa UI
  ❌ Vänta på “klar rendering”
  ❌ Visa spinner i stället för progressiv bild
  * Den progressiva bilden är laddindikatorn.

6. Color Studio – arkitektur
- Standardläge
  * Gradient-val
  * Smooth coloring toggle
  * Gamma
  * Levels (black/white)
- Avancerat läge
  * Redigera gradientstopp
  * Hue shift
  * Saturation
  * Exposure
  * Dither (valfritt)
- Ingen nodbaserad shader i v1.

7. Timeline / Zoomresor
- Modell
  * Keyframe-baserad
  * Endast Viewport förändras över tid
  * Journeys: sparad Scene + Timeline (hel resa)
- Interpolering
  * Center: linjär
  * Scale: interpolera i log-space
  * Rotation (om stöd): kortaste väg
- Playback
  * Kör alltid i “interactive” kvalitet
  * Vid paus: automatisk förfining till “final”

8. Presets och galleri
- Built-in presets levereras som JSON
- Gallery visar parameterreglage per fraktaltyp (range + input) och uppdaterar endast vid release.
- User presets lagras i IndexedDB
- Användaren kan:
  * Skapa
  * Spara
  * Exportera
  * Importera presets
- Thumbnails genereras vid save eller lazy.

9. Export
- PNG
  * Aktuell vy
  * Valfritt hi-res via offscreen render
- JSON
  * Scene
  * Presets
  * Versionsfält för framtida migrering

10. Utbyggbarhet (nya fraktaltyper)
- Ny fraktal läggs till genom:
  * Ny renderer
  * Param-schema
  * Default-presets
- Registreras via:
  * FractalRegistry.register(...)
- UI byggs dynamiskt från registry.

11. Föreslagen filstruktur
src/
  app/
  state/
  engine/
    registry.ts
    scheduler/
    webgl/
    cpu/
  ui/
    Gallery/
    Canvas/
    ColorStudio/
    Timeline/
    Export/
  persistence/
  utils/

12. Fastslagna arkitekturbeslut
- WebGL2
- Progressiv, avbrytbar rendering
- Responsivt UI är ett hårt krav
- Enkel kärna + avancerade flikar
- Ingen backend, ingen inloggning
- Estetik som primärt mål

---
