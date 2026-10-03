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
    - `eco-chef-saved-recipes.ts`: Ausgelagerte Rezeptbuch-Verwaltung & Filter
    - `eco-chef-cooking-mode.ts`: Kochmodus mit Screen Wake Lock & Haptik
  - `services/` - Geschäftslogik & externe APIs:
    - `calendar.service.ts`: RFC 5545 iCalendar-Export (.ics) für Wochenpläne
    - `crypto.service.ts`: Clientseitige AES-GCM 256-Bit E2E-Verschlüsselung für Cloud-Sync
    - `gemini.service.ts`: Anbindung an Gemini API (Prompt-Engineering, Structured JSON Output, Bild-/Multimodal-Erkennung)
    - `storage.service.ts`: Dualer Speicher (IndexedDB & LocalStorage) mit Quota-Schutz & Bild-Pruning
    - `barcode.service.ts` & `qr.service.ts`: Barcode- (OpenFoodFacts mit User-Agent) und standardkonformes Vektor-QR-Code-Scanning/Sharing
    - `speech.service.ts` & `audio.service.ts`: Web Speech API mit Loop-Schutz & Oszillator-Soundeffekte/Vibration
    - `pdf.service.ts`: Rezept-Export als PDF
    - `dashboard.service.ts`: Nachhaltigkeits-Metriken (CO₂, Food Waste)
  - `models/` - TypeScript-Interfaces & Datenmodelle (`recipe.model.ts`, etc.)
  - `styles/` - Design Tokens, Themes, globale CSS-Variablen, Print-CSS
  - `api-config.ts` - Build-Time Injection des Gemini API Keys
- `api/` - Vercel Serverless Function (`gemini.ts`) mit In-Memory Rate Limiting & Modell-Whitelist
- `www/` - Webpack Build-Output (Cordova Root)
- `platforms/` & `plugins/` - Cordova Native Artefakte (nicht manuell editieren)
- `tests/` bzw. `*.spec.ts` - Jest Unit-Tests (31 Tests über 9 Suites)

---

## Commands & Workflows

### Development
```bash
npm run dev
# Startet webpack-dev-server auf Port 4444 (killt eventuelle alte Prozesse davor)
```

### Type Checking
```bash
npm run type-check
# Führt strikte TypeScript-Typprüfung für Frontend und API aus (tsc --noEmit)
```

### Production Build
```bash
npm run build
# Bündelt via Webpack in www/ für Cordova und Web mit Code-Splitting
```

### Testing
```bash
npm test
# Führt Jest-Tests im Repo aus (ts-jest)
```
Ein einzelner Test kann ausgeführt werden mit:
```bash
npx jest ui-src/services/crypto.service.spec.ts
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
