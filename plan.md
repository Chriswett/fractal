# plan.md – Fraktal-webbapp (Fraktaler)

## 1. Syfte och mål
Bygga en webbaserad applikation där användare på ett estetiskt och intuitivt sätt kan:
- Generera och utforska klassiska fraktaler
- Zooma relativt djupt med numerisk stabilitet
- Arbeta kreativt med färg och estetik (huvudsyfte)
- Skapa och spela upp fördefinierade “zoomresor” (parameterresor)

Applikationen ska fungera helt utan inloggning och köras lokalt i webbläsaren.

---

## 2. Scope – Version 1 (v1)

### Fraktaltyper
Följande fyra fraktaltyper ingår i v1:
1. Mandelbrot
2. Julia
3. Sierpinski
4. Koch (curve / snowflake)

Varje fraktaltyp ska ha:
- Fördefinierade presets
- Möjlighet för användaren att spara egna presets

---

## 3. Användarupplevelse (UX)

### Visuell stil
- Modern, minimalistisk och ljus design
- Neutral men estetisk färgpalett
- Fraktalen är alltid det visuella fokuset

### Layout
- Stor central canvas
- Sidopanel för:
  - Fractal Gallery
  - Color Studio
  - Timeline
  - Export
- Topbar för globala actions (reset, fullscreen, export)

### Interaktion
- Pan: drag
- Zoom: scroll / gesture
- Omedelbar visuell feedback
- Pågående rendering avbryts alltid vid ny interaktion

### Ikoner och hjälp
- Ikonbaserat UI
- Tooltips på hover:
  - Kort label
  - Vid behov kort förklaring

---

## 4. Rendering

### Progressiv rendering
- Blockvis rendering (t.ex. 16×16 → 8×8 → 4×4 → 2×2 → 1×1)
- Snabb grov bild → gradvis förfining
- Rendering avbryts omedelbart vid ny användarinteraktion

### Prestandaprincip
- Upplevd respons prioriteras framför perfekt FPS
- Progressiv bild ersätter laddindikatorer

---

## 5. Numerisk stabilitet
- Tillräcklig stabilitet för relativt djupa zoomar
- Ingen extremprecision i v1
- Arkitektur förberedd för framtida förbättringar

---

## 6. Färgläggning och estetik

### Color Studio

**Standardläge**
- Enkla, intuitiva kontroller
- Fördefinierade gradienter
- Smooth coloring
- Gamma
- Levels (black/white)

**Avancerat läge**
- Redigering av gradientstopp
- Hue shift
- Saturation
- Exposure
- (Valfritt) dither

Ingen nodbaserad färgeditor i v1.

---

## 7. Zoomresor / inspelning

### Modell
- Keyframe-baserad tidslinje
- Endast viewport-parametrar förändras:
  - Center
  - Zoom (scale)
  - Ev. rotation

### Avgränsningar
- Färg och fraktalparametrar är statiska under resan
- Fokus på estetisk, cinematisk resa

---

## 8. Presets
- Inbyggda presets levereras med appen
- Användaren kan:
  - Skapa
  - Spara
  - Importera
  - Exportera presets
- Presets lagras lokalt

---

## 9. Export och persistens

### Export
- PNG (stillbild)
- JSON (Scene / Presets)

### Persistens
- IndexedDB: presets och scener
- LocalStorage: UI-inställningar

---

## 10. Teknisk grund (översikt)
- Frontend: TypeScript + React
- Rendering:
  - WebGL2 (Mandelbrot / Julia)
  - CPU + Canvas (Sierpinski / Koch)
- Avbrytbar rendering med prioritet på senaste användaravsikt

---

## 11. Milstolpar
1. App shell + canvas
2. Mandelbrot med progressiv rendering
3. Preset-galleri
4. Julia-stöd
5. Sierpinski + Koch
6. Color Studio (standard + avancerat)
7. Timeline + playback
8. Export (PNG / JSON)
9. UI-polish och prestanda

---

## 12. Icke-mål (v1)
- Inloggning / konton
- Backend / moln
- Nodbaserad shader-editor
- Dynamiska färgändringar under zoomresa
- Extrem numerisk precision

---

## 13. Designprinciper
- Estetik före teknisk maximalism
- Alltid något vackert på skärmen
- Senaste användaravsikt styr alltid
- Enkel kärna, avancerat djup
