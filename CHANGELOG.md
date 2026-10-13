# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/lang/de/).

---

## [Unreleased]

### Fixed
- **A11y/E2E (Vorratskammer)**: Die `aria-label`s von „Manuell Hinzufügen“ und „EAN Abfragen“ enthielten den sichtbaren Text nicht mehr (WCAG 2.5.3 „Label in Name“) und ließen `e2e/pantry.e2e.ts` scheitern. Labels beginnen jetzt mit dem sichtbaren Text.

### Geplant
- Mehrsprachige Unterstützung (i18n) für Englisch und Französisch
- Erweiterte Barcode-Datenbank-Offline-Caches
- Direkte Integration lokaler Einkaufszettel-Dienste

---

## [1.1.0] - 2026-10-12

### Added
- Direkter Speichern-Button in der Rezept-Detailansicht (`eco-chef-recipe-view.ts`) mit direktem Feedback.
- Asynchroner Fallback-Restore aus IndexedDB beim App-Start in `RecipeBookController`.
- Visuelle Hervorhebung des aktiven Navigations-Tabs (`.saved-btn.active`).
- Barrierefreies Inline-Modal mit Tastatursteuerung (`Enter`/`Escape`) als Ersatz für blockierendes `window.prompt()` im Kochmodus.
- Härtung des Service-Worker-Install-Events via `Promise.allSettled`.
- Barrierefreiheit: Vollständige ARIA-Rollen und `<label for="...">`-Verknüpfungen in Einstellungen und Vorratskammer.
- Barrierefreiheit: Tastatur-Aktivierung (`Space`/`Enter`) für Vorrats- und Allergenchips.
- Härtung der Content-Security-Policy (CSP) in `index.html` (`media-src 'self' blob: data: content:`).
- Strikte Zod-Validierung in `CalendarService.generateIcs` und Schema-Typen-Export.
- Kapselung von Logging-Ausgaben über `Logger` in Production-Builds.
- Umfassende Unit-Test-Suiten für `CameraController` und `AchievementsController` sowie Download-Tests für `CalendarService`.
- Vollständiger E2E-Workflow für den Kochmodus und Timer in Playwright.
- ESLint Flat Config (`eslint.config.mjs`) mit TypeScript-Unterstützung und CI-Workflow-Integration.
- Webpack Bundle-Size-Budgets und Performance-Hints.
- Automatisierter Git Pre-Commit Hook (`.githooks/pre-commit` & `.githooks/check-secrets.js`) zur Erkennung und Blockierung von `.env`-Dateien und Secrets.
- CI-Secret-Scanning-Schritt in GitHub Actions (`npm run check:secrets`).

---

## [1.0.0] - 2026-10-10

### Initial Release: EcoChef – Der nachhaltige KI-Rezept-Zauberer

#### Added
- **KI-Rezept-Generierung & Assistenz:**
  - Multimodale KI-Integration mit dem Google GenAI SDK (`@google/genai` / Gemini Flash).
  - Intelligente Resteverwertung: Generierung von strukturierten Rezepten basierend auf verfügbaren Zutaten, Vorräten und Unverträglichkeiten.
  - Interaktiver Koch-Assistent & Nachfrage-Chat für Anpassungen, Ersatz-Zutaten und Zubereitungstipps.
  - Dynamische Portionsskalierung mit automatischer Mengenumrechnung.
  - KI-Sicherheitsfilter und Eingabe-Sanitizing (`<nutzerdaten>`) gegen Prompt-Injections.

- **Vorratskammer & Smarter Scanner:**
  - Offline-fähige Vorratskammer mit Mindesthaltbarkeitsdatum (MHD)-Überwachung und Ampelsystem.
  - Barcode-Scanner mit OpenFoodFacts-Anbindung zur automatischen Produkterkennung.
  - Kassenzettel- und Zutaten-Scanner via Kamera (Cordova & HTML5 Web Camera API).

- **Nachhaltigkeits-Dashboard & Gamification:**
  - Berechnung eingesparter CO₂- und Wasser-Äquivalente pro gekochtem Reste-Rezept.
  - Eco-Score-Bewertung und Metriken zur Vermeidung von Lebensmittelverschwendung.
  - Motivierendes Erfolgs- und Achievement-System mit Medaillen und Fortschrittsanzeige.

- **Haushalts-Synchronisation & Sicherheit:**
  - Clientseitige E2E-Verschlüsselung (AES-GCM 256-Bit) für geteilte Einkaufslisten und Vorräte.
  - Sichere Haushaltskopplung über 80-Bit-Sync-Codes (CSPRNG) und QR-Code-Pairing.
  - Keine Klartextdaten in der Cloud; vollständige Zero-Knowledge-Architektur.

- **Kochmodus, Audio & Barrierefreiheit:**
  - Geführter Vollbild-Kochmodus mit Screen Wake Lock API (verhindert Display-Abschalten beim Kochen).
  - Integrierter Timer mit akustischen Alarmsignalen (Web Audio API Synthesizer) und haptischem Feedback.
  - Sprachsteuerung über Web Speech API für freihändiges Bedienen beim Kochen.

- **Export & Konnektivität:**
  - RFC 5545 iCalendar-Export (`.ics`) für Rezept- und Wochenplan-Einträge im persönlichen Kalender.
  - PDF-Export und Druckansicht für Rezepte und Einkaufslisten.
  - Standardkonforme Vektor-QR-Codes zum Teilen von Rezepten.

- **Plattform, Architektur & Deployment:**
  - Responsive Web Components Architektur basierend auf Lit 3.x und modernem TypeScript.
  - PWA-Support mit Service Worker (`sw.js`) und Offline-First Dual-Storage (IndexedDB + LocalStorage).
  - Apache Cordova Android-Build-Pipeline für native Mobile-App-Bereitstellung.
  - Vercel Serverless Function Proxy (`/api/gemini`) mit CORS-Whitelist, Payload-Validierung und Upstash Redis Rate-Limiting.
  - Umfassende Test-Suite mit Jest (Unit- & Component-Tests) und Playwright (E2E-Smoke-Tests).
