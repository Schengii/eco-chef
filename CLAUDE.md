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
  - `controllers/` - Lit `ReactiveController` (`sync.controller.ts`: verschlüsselter Haushalts-Sync; `timer.controller.ts`: Koch-Timer + Alarm; `shopping-list.controller.ts`: Einkaufsliste; `camera.controller.ts`: Cordova-/Web-Kamera). Neue Zustandslogik aus `eco-chef.ts` bevorzugt hier auslagern (Handler als Arrow-Properties, damit `this` im Template stimmt)
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
    - `sync.service.ts`: Sync-Code (80 Bit, CSPRNG) und Bucket-Hash; `backup.service.ts`, `recipe-filter.ts`: Backup/Import und Filter
    - `ai-json.ts`, `gemini-schemas.ts`, `prompt-safety.ts`: KI-JSON-Parsing, `responseSchema`s, Eingabe-Sanitizing (`<nutzerdaten>`)
    - `recipe-utils.ts`: reine Helfer (Nährwert-Parsing, CO₂-Fallback, Schrittdauer)
    - `recipe-image.service.ts`: lokaler SVG-Platzhalter für Rezeptbilder; `sw.service.ts`: Service-Worker-Registrierung + Update-Hinweis; `logger.ts`: Debug-Log nur in Dev
  - `models/` - TypeScript-Interfaces (`eco-chef.models.ts`) und zod-Schemas (`schemas.ts`) für KI-Antworten, Imports, Backups und Sync-Daten
  - `styles/` - Design Tokens, Themes, globale CSS-Variablen, Print-CSS
  - `api-config.ts` - Build-Time Injection des Gemini API Keys
- `api/` - Vercel Serverless Function (`gemini.ts`) mit Request-Validierung (`_validate.ts`), CORS-Allowlist, Modell-Whitelist und Rate Limiting (`_ratelimit.ts`: Upstash Redis falls konfiguriert, sonst In-Memory)
- `e2e/` - Playwright-Smoke-Tests (`npm run e2e`, KI-Proxy und kvdb gemockt)
- `www/` - Webpack Build-Output (Cordova Root)
- `platforms/` & `plugins/` - Cordova Native Artefakte (nicht manuell editieren)
- `*.spec.ts` - Jest Unit-Tests (Services, Controller, API, jsdom-Komponententests via `@jest-environment jsdom`); Coverage-Schwellen in `jest.config.js`

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
npm test              # Jest-Unit-Tests (ts-jest)
npm run test:coverage # inkl. Coverage-Schwellen (CI)
npm run e2e           # Playwright-Smoke-Tests (startet npm run dev)
```
Ein einzelner Test kann ausgeführt werden mit:
```bash
npx jest ui-src/services/crypto.service.spec.ts
```

---

## Code & Quality Guidelines

### 1. API Keys & Sicherheit
- **NIEMALS** API-Keys im Code committen oder hardcoden!
- `GEMINI_API_KEY` aus `.env` wird nur im Dev-Build injiziert; Produktions-Bundles enthalten keinen Key und nutzen den Proxy (`api/gemini.ts`) oder den vom Nutzer in den Einstellungen hinterlegten Key (Standard: nur Sitzung).
- Alle Daten von außen (KI-Antworten, Importe, QR, Sync) werden mit den zod-Schemas aus `models/schemas.ts` validiert; Nutzertext im Prompt immer über `prompt-safety.ts`.

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
