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
  - Fractal Gallery (presets)
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
"mandelbrot" | "julia" | "sierpinski" | "koch"

Viewport
{
  centerX: number
  centerY: number
  scale: number        // units per pixel
  rotation?: number
}

FractalParams
* Mandelbrot:
  * maxIter
  * escapeRadius
* Julia:
  * cRe
  * cIm
  * maxIter
  * escapeRadius
* Sierpinski:
  * depth
* Koch:
  * depth
  * variant?: "curve" | "snowflake"

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

Timeline
{
  durationMs: number
  keyframes: Keyframe[]
}

Keyframe
{
  t: number           // 0..1 eller ms
  viewport: Viewport
}

4. Renderingpipeline

4.1 Escape-time (Mandelbrot / Julia) – WebGL2
- Fragment shader beräknar iteration per pixel
- Smooth coloring i shader
- ColorProfile appliceras i shader
- Progressiv rendering
- Render till offscreen framebuffer i låg upplösning
- Skala upp till canvas
- Upprepa med mindre tileSize tills 1×1

4.2 Geometriska fraktaler – CPU + Canvas
- Sierpinski:
  * Triangelsubdivision
  * Progressiv depth
- Koch:
  * Segment-subdivision
  * Progressiv depth
- Kan köras i WebWorker för att inte blockera UI.

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
- Interpolering
  * Center: linjär
  * Scale: interpolera i log-space
  * Rotation (om stöd): kortaste väg
- Playback
  * Kör alltid i “interactive” kvalitet
  * Vid paus: automatisk förfining till “final”

8. Presets och galleri
- Built-in presets levereras som JSON
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
