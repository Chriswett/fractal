# Agents.md – Fraktaler

Detta projekt använder LLM-baserade agenter (t.ex. Codex) för att utveckla en webbaserad fraktalapplikation.
Detta dokument definierar **hur agenter ska arbeta**, **vilka filer som är auktoritativa**, och **vilka arkitektur- och designprinciper som inte får brytas**.

---

## 1. Auktoriativa dokument (MÅSTE följas)

Agenter ska alltid läsa och följa dessa filer i denna ordning:

1. `plan.md`  
   – Definierar mål, scope, UX-principer och icke-mål  
2. `architecture.md`  
   – Definierar arkitektur, rendering, responsivitet och datamodell  
3. `Agents.md` (detta dokument)

Om instruktioner eller kodförslag strider mot dessa dokument ska agenten:
- Stoppa
- Förklara konflikten
- Föreslå en lösning som **respekterar dokumenten**

---

## 2. Grundprinciper för agentarbete

### 2.1 Estetik är ett primärt mål
Detta är **inte** ett rent tekniskt projekt.

Agenter ska:
- Prioritera visuellt tilltalande resultat
- Föredra lösningar som ger snabb, progressiv visuell feedback
- Undvika “tekniskt korrekta men visuellt stela” implementationer

---

### 2.2 Responsivitet är ett hårt krav
Agenter får **aldrig** implementera lösningar där:

- UI blockeras av rendering
- Rendering måste “bli klar” innan ny interaktion
- Renderjobb köas istället för avbryts

**Princip:**  
> *Latest user intent always wins.*

---

### 2.3 Progressiv rendering är obligatorisk
Rendering ska alltid:
- Ge snabb grov bild
- Förfinas stegvis
- Kunna avbrytas när som helst

Spinners, blocking loaders eller “wait until done”-mönster är **förbjudna**.

---

## 3. Rendering- och beräkningsregler

### 3.1 Escape-time-fraktaler
- Ska renderas via WebGL2
- Beräkning sker i fragment shader
- Smooth coloring och färglogik ska ligga i shader där det är möjligt

### 3.2 CPU-beräkningar
- Geometriska fraktaler (Sierpinski, Koch) får använda CPU
- Långa beräkningar ska:
  - delas upp i batcher
  - eller köras i WebWorker
- Resultat från gamla jobb får **aldrig** appliceras

---

## 4. State och datamodell

### 4.1 Scene är sanningen
Allt som påverkar renderingen ska komma från `Scene`.

Agenter får inte:
- Lägga render-relevant state lokalt i UI-komponenter
- Ha “dolda” renderingseffekter som inte speglas i Scene

### 4.2 Serialiserbarhet
Allt i `Scene`, `Preset` och `Timeline` ska:
- Vara JSON-serialiserbart
- Kunna sparas, laddas och exporteras utan speciallogik

---

## 5. UI-regler

### 5.1 Canvas först
- Fraktalen är alltid huvudfokus
- UI får aldrig visuellt eller funktionellt dominera canvasen

### 5.2 Ikoner + tooltips
- Ikoner används som primär affordance
- Alla ikoner ska ha tooltip
- Tooltips ska vara:
  - korta
  - informativa
  - icke-påträngande

---

## 6. Förändringsregler

### 6.1 När agenten vill ändra arkitektur
Om en agent bedömer att arkitekturen bör ändras:

1. Förklara varför
2. Peka på exakt vilka delar av `architecture.md` som påverkas
3. Föreslå en alternativ formulering
4. Vänta på godkännande innan ändringen implementeras

---

### 6.2 Vad agenten INTE ska göra
Agenter får inte:
- Införa backend, inloggning eller moln i v1
- Införa nodbaserade shader-system
- Införa extrema numeriska lösningar utan uttrycklig instruktion
- “Optimera bort” progressiv rendering

---

## 7. Förväntat arbetssätt

Agenter förväntas:
- Arbeta inkrementellt
- Föreslå tydliga delsteg (MVP → förbättring)
- Kommentera kod där designbeslut tas
- Skriva kod som är lätt att bygga vidare på

När osäkerhet finns:
> **Ställ en fråga istället för att anta.**

---

## 8. Definition of Done (för kod bidrag)

Ett bidrag är klart när:
- Det följer `plan.md` och `architecture.md`
- UI är responsivt under beräkning
- Rendering är avbrytbar
- Inga regressions i estetik eller interaktion införts
- Kod är läsbar och modulär

---

## 9. Sammanfattning

Detta projekt prioriterar:
1. Estetik
2. Responsivitet
3. Progressiv visuell feedback
4. Tydlig arkitektur
5. Utbyggbarhet över tid

Teknisk komplexitet är endast motiverad om den **förbättrar upplevelsen**.
