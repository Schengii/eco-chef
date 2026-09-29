# CLAUDE.md - EcoChef Guidelines & Context

## Project Overview
**EcoChef** ist eine KI-gestützte Rezept- und Nachhaltigkeits-App (Apache Cordova + TypeScript + Lit Web Components + Google GenAI SDK). Sie verwandelt Kühlschrankreste durch multimodale KI (Gemini 2.5 Flash) in strukturierte Rezepte, berechnet CO₂-/Wasser-Einsparungen und unterstützt Barcode-/Kamera-Scans sowie Sprachsteuerung.

---

## Architecture & Tech Stack
- **Framework & UI:** [Lit 3.x](https://lit.dev/) (Web Components mit reaktivem Shadow DOM)
- **Language:** TypeScript 5.x (`strict: true`)
- **App Wrapper:** Apache Cordova (Target: Android, Browser)
- **AI Core:** `@google/genai` (Google GenAI SDK)
- **Build System:** Webpack 5 + `ts-loader` + `webpack-dev-server`
- **Testing:** Jest + `ts-jest`

---

## Directory Structure
- `ui-src/` - Quellcode der Frontend-Applikation
  - `eco-chef.ts` - Haupt-App-Komponente (Routing, Navigation, State-Management)
  - `components/` - Wiederverwendbare Lit-Komponenten (Views, Modals, Badges, etc.)
  - `services/` - Geschäftslogik & externe APIs:
    - `gemini.service.ts`: Anbindung an Gemini API (Prompt-Engineering, Structured JSON Output, Bild-/Multimodal-Erkennung)
    - `storage.service.ts`: Lokaler Speicher (IndexedDB / LocalStorage) für Rezepte, Vorräte, Verlauf
    - `barcode.service.ts` & `qr.service.ts`: Barcode- und QR-Code-Scanning (OpenFoodFacts API Integration)
    - `speech.service.ts` & `audio.service.ts`: Web Speech API & Soundeffekte
    - `pdf.service.ts`: Rezept-Export als PDF
    - `dashboard.service.ts`: Nachhaltigkeits-Metriken (CO₂, Food Waste)
  - `models/` - TypeScript-Interfaces & Datenmodelle (`recipe.model.ts`, etc.)
  - `styles/` - Design Tokens, Themes, globale CSS-Variablen
  - `api-config.ts` - Build-Time Injection des Gemini API Keys
- `www/` - Webpack Build-Output (Cordova Root)
- `platforms/` & `plugins/` - Cordova Native Artefakte (nicht manuell editieren)
- `tests/` bzw. `*.spec.ts` - Jest Unit-Tests

---

## Commands & Workflows

### Development
```bash
npm run dev
# Startet webpack-dev-server auf Port 4444 (killt eventuelle alte Prozesse davor)
```

### Production Build
```bash
npm run build
# Bündelt via Webpack in www/ für Cordova und Web
```

### Testing
```bash
npm test
# Führt Jest-Tests im Repo aus (ts-jest)
```
Ein einzelner Test kann ausgeführt werden mit:
```bash
npx jest ui-src/services/storage.service.spec.ts
```

---

## Code & Quality Guidelines

### 1. API Keys & Sicherheit
- **NIEMALS** API-Keys im Code committen oder hardcoden!
- Der Gemini API-Key wird zur Build-Zeit via `.env` (`GEMINI_API_KEY`) injiziert oder dynamisch durch den Benutzer in den Einstellungen (`Settings`) hinterlegt.

### 2. Lit Components & TypeScript
- Verwende strikte Typisierung (`noImplicitAny`).
- Dekoriere Lit-Properties sauber (`@property`, `@state`).
- Styles immer in `static styles = css\`...\`` kapseln, um Shadow-DOM-Isolierung und Theme-Variablen zu wahren.
- Nutze responsive CSS (Mobile First, da primär Mobile/Cordova App).

### 3. AI & Prompt Engineering (`gemini.service.ts`)
- Nutze strukturierte JSON-Schemata (`responseSchema` / JSON-Mode) für Gemini-Antworten.
- Validiere und fange Parsing-Fehler robust ab (Fallback auf benutzerfreundliche Fehlermeldungen).
- Behalte Temperatur und Token-Limits für Rezepterzeugung im Auge.

### 4. Git & Commits
- Konventionelle Commit-Messages bevorzugen (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
- Keine generierten Dateien (`dist/`, `www/`, `node_modules/`, `platforms/`) committen.
