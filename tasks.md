# tasks.md - v1 tasks and acceptance criteria

This breakdown follows plan.md and architecture.md. Tasks are grouped to allow parallel work; dependencies are noted per task.

## Track A - App shell and UI framework

### A1. App shell layout (canvas-first)
Dependencies: none
Acceptance criteria:
- Central canvas dominates layout on desktop and mobile.
- Side panel and top bar exist per plan (Gallery, Color Studio, Timeline, Export, top actions).
- Canvas remains visible at all times; UI never visually dominates it.
- Layout is responsive and does not block rendering.

### A2. Design tokens + basic theming
Dependencies: A1
Acceptance criteria:
- CSS variables for colors, typography, spacing, radius, shadow, zIndex, motion.
- Light, modern, neutral palette with the fractal as visual focus.
- Tokens are used in at least one UI component to validate the system.

### A3. Icon buttons + tooltip system
Dependencies: A1
Acceptance criteria:
- Primary controls are icon-based.
- Every icon control has a short tooltip label (and optional 1-2 line hint).
- Tooltips are non-blocking and do not interfere with canvas interaction.

## Track B - State model and registry

### B1. Scene model + serialization
Dependencies: none
Acceptance criteria:
- Scene, Preset, Timeline types match architecture.md and are JSON-serializable.
- Scene is the single source of truth for rendering parameters.
- Scene can be exported/imported as JSON without custom transform logic.

### B2. Fractal registry
Dependencies: B1
Acceptance criteria:
- Registry supports adding a fractal with renderer, default params, and presets.
- UI can list available fractal types from the registry.
- Registry is the only way to add new fractals (no hard-coded UI lists).

### B3. App state store
Dependencies: B1
Acceptance criteria:
- Central store holds Scene, presets, timeline, and UI preferences.
- UI components read/write via the store; no render-affecting state local to UI.
- State updates trigger rendering through the scheduler (latest intent wins).

## Track C - Render scheduler and infrastructure

### C1. Render scheduler core
Dependencies: B1
Acceptance criteria:
- Each render job has a unique jobId with a global activeRenderJobId.
- New interactions cancel/ignore older jobs immediately.
- Progressive passes use tile sizes from Scene.render.progressive.
- Interactive vs final quality hints are honored per architecture.md.

### C2. Canvas integration + render loop
Dependencies: C1
Acceptance criteria:
- Scheduler drives actual canvas updates.
- Inactive/old jobs never commit pixels to the canvas.
- Debounced idle refinement (150-250 ms) triggers final-quality pass.

## Track D - WebGL2 escape-time (Mandelbrot/Julia)

### D1. WebGL2 pipeline and shader base
Dependencies: C1, B1
Acceptance criteria:
- WebGL2 context, fullscreen quad, and fragment shader render path.
- Shader computes escape-time per pixel.
- ColorProfile parameters are uniforms in shader.

### D2. Progressive WebGL2 rendering
Dependencies: D1, C1
Acceptance criteria:
- Progressive rendering from coarse to fine (tile sizes down to 1x1).
- Rendering can be interrupted between passes by jobId checks.
- Image is shown after each pass; no spinners or blocking loaders.

### D3. Mandelbrot + Julia parameterization
Dependencies: D1
Acceptance criteria:
- Mandelbrot uses maxIter and escapeRadius from Scene.params.
- Julia adds cRe/cIm and uses same rendering pipeline.
- Switching fractal type updates shader parameters immediately.

## Track E - CPU fractals (Sierpinski/Koch)

### E1. CPU renderers with progressive depth
Dependencies: C1, B1
Acceptance criteria:
- Sierpinski and Koch render on CPU to 2D canvas.
- Progressive depth rendering yields quick coarse image then refines.
- Rendering can be canceled between batches by jobId.

### E2. Optional worker offload
Dependencies: E1
Acceptance criteria:
- CPU rendering can run in a WebWorker without blocking UI.
- Results from old jobId are ignored.

## Track F - Interaction (pan, zoom, viewport)

### F1. Pan/zoom input handling
Dependencies: B3, C1
Acceptance criteria:
- Drag to pan, scroll/gesture to zoom.
- Updates Scene.viewport; no local rendering state.
- Every interaction restarts rendering with interactive quality.

### F2. Viewport math and stability
Dependencies: F1
Acceptance criteria:
- Zoom around cursor preserves focus.
- Scale is stored as units per pixel and updates consistently.
- Numeric stability is sufficient for deep but non-extreme zooms.

## Track G - Color Studio

### G1. Standard mode controls
Dependencies: B3, D1
Acceptance criteria:
- Gradient selection, smooth coloring toggle, gamma, levels (black/white).
- Changes update Scene.color and immediately re-render.
- Default gradients are provided.

### G2. Advanced mode controls
Dependencies: G1
Acceptance criteria:
- Edit gradient stops, hue shift, saturation, exposure, optional dither.
- Updates are serialized in Scene.color.
- No node-based editor is introduced.

## Track H - Presets and Gallery

### H1. Built-in presets
Dependencies: B1, B2
Acceptance criteria:
- Built-in presets load from JSON at startup.
- Preset selection updates Scene and triggers render.

### H2. User presets (CRUD)
Dependencies: H1, B3
Acceptance criteria:
- User can create, save, delete presets.
- Stored in IndexedDB; UI shows saved presets.
- Preset data is fully serializable (Scene only).

### H3. Preset import/export
Dependencies: H2
Acceptance criteria:
- Presets can be exported/imported as JSON.
- Version field exists for future migration.

## Track I - Timeline / zoom travel

### I1. Timeline data model and editor
Dependencies: B1, B3
Acceptance criteria:
- Keyframe list with viewport only.
- Add/remove keyframes and edit time.
- Serialization matches architecture.md.

### I2. Playback engine
Dependencies: I1, C1
Acceptance criteria:
- Playback interpolates center linearly and scale in log-space.
- During playback: interactive quality rendering.
- On pause: final-quality refinement after debounce.

## Track J - Export and persistence

### J1. Scene export/import
Dependencies: B1, B3
Acceptance criteria:
- Export current Scene as JSON.
- Import restores Scene and triggers render.

### J2. PNG export
Dependencies: C1, D1, E1
Acceptance criteria:
- Export current view to PNG from canvas.
- Optional hi-res export uses offscreen render.
- Export does not block UI interaction.

### J3. Persist UI preferences
Dependencies: A2, B3
Acceptance criteria:
- UI preferences saved in LocalStorage.
- Preferences restore on reload without affecting Scene integrity.

## Track K - UI polish and performance

### K1. Motion and transitions
Dependencies: A2, A3
Acceptance criteria:
- Subtle, purposeful motion for panel toggles and tooltips.
- No animation blocks rendering or input.

### K2. Performance pass
Dependencies: C1, D2, E1
Acceptance criteria:
- Rendering is always cancelable and responsive.
- No queued render jobs; latest intent wins.
- Progressive rendering visible and stable across interactions.

