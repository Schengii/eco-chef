# GEMINI.md - EcoChef Guidelines & Context

## Project Overview
**EcoChef** ist eine nachhaltige KI-Rezept- und Haushalts-App (Apache Cordova + TypeScript + Lit Web Components + Google GenAI SDK). Sie verwandelt vorhandene Kühlschrank- und Vorratsreste in strukturierte, klimaschonende Rezepte.

---

## Tech Stack & Architecture
- **UI & Framework:** Lit 3.x (Reaktive Web Components im Shadow DOM)
- **Language:** TypeScript 5.x (`strict: true`)
- **Native Wrapper:** Apache Cordova (Android / Browser)
- **AI Core:** `@google/genai` (Google GenAI SDK mit Gemini 3.5 Flash)
- **Build & Bundler:** Webpack 5 mit Code Splitting & Performance Budget
- **Linting:** ESLint 9 Flat Config (`eslint.config.mjs`) mit TypeScript-Support
- **Testing:** Jest + `ts-jest` (Unit Tests) & Playwright (E2E Smoke Tests)

---

## Toolchain & Befehle
- `npm run dev`: Entwicklungs-Server auf Port 4444 starten
- `npm run lint`: Code-Stil und TypeScript-Konventionen validieren
- `npm run type-check`: TypeScript Typ-Prüfung (`tsc --noEmit`)
- `npm test`: Jest Unit-Tests ausführen
- `npm run test:coverage`: Jest mit Code-Coverage-Schwellen ausführen
- `npm run e2e`: Playwright E2E-Tests ausführen
- `npm run build`: Produktions-Build bündeln nach `www/`
- `npm run check:secrets`: Staged Files auf Secrets prüfen

---

## Entwicklungsrichtlinien
- **Keine Secrets:** Niemals API-Keys, Credentials oder `.env`-Dateien committen.
- **Lazy Loading:** Größere Komponenten (`recipe-view`, `cooking-mode`, etc.) und SDKs (`@google/genai`) immer dynamisch nachladen.
- **Barrierefreiheit:** WCAG 2.1 Konformität bewahren (ARIA-Labels, Tastaturbedienbarkeit via `onActivate`, Screenreader-Unterstützung).
- **Strikte Typisierung & Validierung:** Alle externen Daten und KI-Ausgaben mittels `zod`-Schemas validieren.
