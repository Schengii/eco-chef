# EcoChef 🧑‍🍳 - Dein intelligenter KI-Rezept-Zauberer

> **In short (EN):** AI kitchen assistant that turns leftover ingredients into recipes with Google Gemini. Includes barcode scanning (OpenFoodFacts), expiry alerts, a voice-controlled cooking mode, budget tracking and WCAG-oriented accessibility features. Runs as a web app and as an Android app via Cordova.
> **Stack:** TypeScript · Lit Web Components · Google GenAI SDK (Gemini 2.5 Flash) · Webpack · Jest · Apache Cordova · Vercel
> **Live demo:** [eco-chef-theta.vercel.app](https://eco-chef-theta.vercel.app)

<!-- Screenshot: Datei unter docs/screenshots/rezept.png ablegen und die nächste Zeile einkommentieren -->
<!-- ![Rezeptgenerierung aus Kühlschrankresten](docs/screenshots/rezept.png) -->


**EcoChef** ist eine moderne, nachhaltige Hybrid-Web- & Mobile-App, die aus deinen vorhandenen Kühlschrankzutaten kreative, klimaschonende und leckere Gerichte zaubert. Mit Fokus auf Resteverwertung, Barrierefreiheit (LRS-Modus, Leselineal, Screenreader), Sprachsteuerung, Wochenmärkte-Finder, OpenFoodFacts Barcode-Scanner und umfassendem Budget- & Umwelt-Tracking.

---

## 🌟 Kernfunktionen & Features

- 🪄 **KI-Rezept-Zauberer (Google Gemini 2.5 Flash & Imagen):** Generierung maßgeschneiderter Rezepte inkl. Nährwerten, Eco-Score, Wein-/Getränkeempfehlung & Gerichtsfoto.
- 📷 **Live-Kamera-Barcodescanner & EAN-Lookup:** Erkennt Barcodes (EAN-13, EAN-8, UPC) direkt live im Kamerasucher via nativer `BarcodeDetector`-API und importiert Produktdaten und Nutri-Score von OpenFoodFacts.
- 📅 **Wochenplan Kalender-Export (.ics):** Generiere einen personalisierten Wochenplan und exportiere ihn mit einem Klick als standardkonforme iCalendar-Datei (.ics) für Google Kalender, Apple Kalender oder Outlook.
- 🖨️ **Print-CSS für Einzelrezepte:** Perfekt formatiertes DIN-A4-Drucklayout für jedes Rezept auf Knopfdruck (blendet Navigation, Chat und Buttons aus).
- 🗄️ **Duales IndexedDB & Quota-Speichersystem:** Asynchrone, unbegrenzte Persistenz via IndexedDB (`ecoChef_db`) mit synchronem Fallback und Quota-Management in LocalStorage.
- 📱 **QR-Code Rezept-Sharing:** Generiere hochauflösende, fehlerkorrigierte Vektor-QR-Codes (ISO/IEC 18004) für jedes Rezept, direkt mit jeder Smartphone-Kamera scannbar.
- 🔐 **Ende-zu-Ende verschlüsselte Cloud-Synchronisation:** Nahtlose Übertragung aller Rezepte und Vorräte zwischen Geräten via AES-GCM 256-Bit Verschlüsselung mit individuellem Sync-Code.
- 🌾 **Regionalitäts- & Wochenmarkt-Finder:** Entdecke regionale Wochenmärkte, Hofläden & Unverpackt-Geschäfte in deiner Nähe inkl. Öffnungszeiten, Entfernung und Direktübernahme von Markt-Spezialitäten auf deine Einkaufsliste.
- 💰 **Monatsbudget-Tracker & Spar-Kalkulator:** Lege dein monatliches Lebensmittelbudget fest, verfolge deine Ausgaben und berechne deine Ersparnis durch Resteverwertung.
- 🚨 **MHD Ablauf-Erinnerungen & Warn-Banner:** Automatische Warnung auf dem Startbildschirm bei Zutaten mit Ablaufdatum in ≤ 2 Tagen inkl. 1-Klick-Rezeptverkochen.
- 📸 **Kühlschrank- & Kassenzettel-Scan:** Scanne deine Einkäufe oder deinen Kühlschrank per Kamera/Upload.
- 🍽️ **Dynamische Portionsskalierung:** Skaliere Mengenangaben & Nährwerte in Rezepten interaktiv von 1 bis 12 Personen in Echtzeit.
- 🛒 **Einkaufsliste ➔ Vorratskammer Übernahme:** Übernehme abgehakte Einkaufsartikel mit einem Klick in die Reste-Kammer mit automatischer Haltbarkeitsberechnung.
- ⏱️ **Kochmodus mit Screen Wake Lock & Haptik:** Das Display bleibt während des Kochens automatisch aktiv (Screen Wake Lock API), freihändiges Navigieren per Sprachsteuerung, haptisches Feedback & Timer-Alarme.
- 📦 **Vollständiges System-Backup (JSON):** Exportiere & Importiere dein gesamtes EcoChef-Profil (Rezepte, Vorratskammer, Einkäufe, Statistiken & Erfolge).
- 🏆 **Gamification & Umwelt-Tracking:** Erfolge freischalten (Retter-König, Klimaschützer, MHD-Retter) und CO₂-Ersparnis visualisieren.
- 👁️ **Barrierefreiheit (WCAG compliant & LRS-Modus):** OpenDyslexic-Schriftart, verschiebbares Leselineal, stufenlose Schriftvergrößerung, TalkBack / VoiceOver Support.
- 🍞 **Toast-Benachrichtigungen:** Professionelles In-App-Benachrichtigungssystem mit Slide-In/Out-Animation, Auto-Dismiss und Aktions-Buttons.

---

## 🌐 Live-App

Die Web-App ist unter folgendem Link verfügbar:
**https://eco-chef-theta.vercel.app**

---

## 🔑 API-Key Konfiguration

### Option 1: In-App Einstellungen (empfohlen für Endnutzer)
Öffne die App → ⚙️ Einstellungen → Gemini API-Key eingeben. Dieser Wert hat immer Vorrang.

### Option 2: Entwicklungsumgebung (lokaler Build)
Erstelle eine `.env`-Datei im Projektverzeichnis:

```bash
cp .env.example .env
# Ersetze 'your_gemini_api_key_here' mit deinem echten Key
```

Inhalt der `.env`-Datei:
```
GEMINI_API_KEY=dein_api_key_hier
```

### Option 3: Vercel (Serverless-Proxy)
Der API-Key ist als Umgebungsvariable `GEMINI_API_KEY` auf Vercel hinterlegt. Die Web-App und alle mobilen Apps nutzen diesen sicheren Server-Proxy (`/api/gemini`) automatisch.

> **Sicherheit:** Committe niemals einen echten API-Key in die Versionskontrolle.

---

## 🚀 Quickstart & Befehle

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. API-Key konfigurieren
```bash
cp .env.example .env
# Füge deinen Gemini API-Key in .env ein
```

### 3. Entwicklungsserver starten
```bash
npm run dev
```
Rufe anschließend `http://localhost:4444` im Browser auf.

### 4. Tests & Typprüfung ausführen
```bash
# Unit-Tests mit Jest
npm test

# Strikte TypeScript-Prüfung (Frontend & Vercel Functions)
npm run type-check
```

### 5. Production Web-Build
```bash
npm run build
```

### 6. Android APK bauen (Cordova)

**Voraussetzungen:**
- Java JDK 17+ (bereits vorhanden)
- Android SDK mit Build-Tools und Platform-Tools (via Android Studio installierbar)

```bash
# Einmalig: Android-Plattform hinzufügen
npx cordova platform add android

# App-Bundle in www/ erstellen
npm run build

# APK bauen
npx cordova build android

# APK liegt dann in:
# platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

Um direkt auf ein verbundenes Gerät oder Emulator zu deployen:
```bash
npx cordova run android
```

### 7. iOS App bauen (nur macOS + Xcode)

```bash
npx cordova platform add ios
npm run build
npx cordova build ios
```

> **Hinweis:** iOS-Builds sind ausschließlich auf macOS mit installiertem Xcode möglich (Apple-Plattformbeschränkung).

---

## ⚙️ Projektstruktur

```
EcoChef/
├── .env.example                # API-Key Konfigurationsvorlage (git-tracked)
├── .env                        # Lokaler API-Key (git-ignored!)
├── api/
│   ├── gemini.ts               # Vercel Serverless Function – Gemini REST-Proxy mit Rate-Limit & Whitelist
│   └── tsconfig.json           # TypeScript-Konfiguration für Vercel Functions
├── CLAUDE.md                   # Richtlinien & Architektur für Claude Code
├── config.xml                  # Cordova-Konfiguration (Android, iOS, Plugins, CSP)
├── ui-src/                     # TypeScript Quellcode (Lit Web Components)
│   ├── api-config.ts           # API-Key Konfiguration (Webpack DefinePlugin)
│   ├── eco-chef.ts             # Zentraler Controller & App-State
│   ├── index.html              # HTML-Einstiegspunkt (CSP, SW-Registrierung)
│   ├── components/             # Modulare UI-Komponenten
│   │   ├── eco-chef-recipe-view.ts       # Rezeptansicht & Portionsskalierer
│   │   ├── eco-chef-saved-recipes.ts     # Ausgelagerte Rezeptbuch-Verwaltung & Suche
│   │   ├── eco-chef-cooking-mode.ts      # Kochmodus mit Wake Lock, Sprachsteuerung & Timer
│   │   ├── eco-chef-pantry.ts            # Vorratskammer & EAN Barcode / Bon-Scan
│   │   ├── eco-chef-regional-map.ts      # Regio-Markt & Unverpackt Finder
│   │   ├── eco-chef-shopping-list.ts     # Einkaufsliste & Budget-Tracker
│   │   ├── eco-chef-settings.ts          # Setup, Budget & Voll-Backup
│   │   ├── eco-chef-meal-planner.ts      # Wochenplaner
│   │   ├── eco-chef-toast.ts             # Toast/Snackbar Benachrichtigungs-System
│   │   └── eco-chef-achievements.ts      # Erfolge & SVG-Charts
│   ├── services/               # Gemini API, Calendar, Crypto, Barcode, QR, Storage, Speech Services
│   │   ├── calendar.service.ts # RFC 5545 iCalendar-Export (.ics) für Wochenpläne
│   │   ├── crypto.service.ts   # Clientseitige AES-GCM 256-Bit E2E-Verschlüsselung für Sync
│   │   ├── qr.service.ts       # Standardkonforme Vektor-QR-Code-Generierung
│   │   ├── storage.service.ts  # Duales IndexedDB- & Quota-Storage mit Bilddaten-Pruning
│   │   ├── barcode.service.ts  # OpenFoodFacts API mit RFC-konformem User-Agent
│   │   ├── gemini.service.ts   # Strukturierte Prompts & Proxy-Routing
│   │   ├── speech.service.ts   # Sprachsteuerung mit Loop-Schutz & Backoff
│   │   └── audio.service.ts    # Haptik & synthetisierte Alarme
│   ├── models/                 # TypeScript Interfaces & gemeinsame Hilfsfunktionen
│   └── styles/                 # Design System & CSS Tokens inkl. Print-CSS
├── www/                        # Webpack Build-Output (Cordova-Root)
├── platforms/android/          # Generierter Android-Code (nicht manuell bearbeiten)
├── BENUTZERANLEITUNG.md        # Ausführliche Anleitung für Anwender
├── FACHLICHE_DOKUMENTATION.md  # Architektur- & Entwickler-Dokumentation
└── webpack.config.js           # Webpack Bündelungs-Konfiguration mit Code-Splitting & Hashing
```

---

## 🏗️ Deployment-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Web-Hosting)                     │
│  ┌────────────────────────────┐  ┌────────────────────────┐ │
│  │  Static Files (www/)       │  │  /api/gemini           │ │
│  │  - bundle.[hash].js        │  │  Serverless Function   │ │
│  │  - index.html              │  │  (Node.js, REST-Proxy) │ │
│  │  - sw.js, manifest.json    │  └───────────┬────────────┘ │
│  └────────────────────────────┘              │               │
└──────────────────────────────────────────────│───────────────┘
                                               │
                                               ▼
                               ┌───────────────────────────┐
                               │  Google Gemini REST API   │
                               │  gemini-2.5-flash         │
                               └───────────────────────────┘

Clients:
  Browser (Web-PWA)  →  relative URL /api/gemini
  Android-App        →  absolute URL https://eco-chef-theta.vercel.app/api/gemini
  iOS-App            →  absolute URL https://eco-chef-theta.vercel.app/api/gemini
```

---

## 🤖 KI-Entwicklerunterstützung (Claude Code)

Das Projekt ist für den Einsatz von KI-Assistenten (insbesondere [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)) vorkonfiguriert:

- **[`CLAUDE.md`](./CLAUDE.md):** Enthält Kontextinformationen, Architekturdetails, Tech-Stack, Skripte und Code-Konventionen.
- **[`.claudeignore`](./.claudeignore):** Schließt Build-Artefakte, Abhängigkeiten und Secrets aus.
- **[`.claude.json`](./.claude.json):** Definiert Berechtigungen für Entwicklungsbefehle.

---

## 📋 Changelog

### v1.3.1 (2026-10-03) – Pro Features & Full Verification

#### ✅ Neu: Live-Kamera-Barcodescanner (BarcodeDetector API)
- Hardware-beschleunigter Live-Sucher mit animierter Laser-Scanlinie in `eco-chef-pantry.ts`
- Automatische Erkennung von EAN-13, EAN-8 und UPC mit akustischem Chime und haptischer Vibration
- Direktes automatisches Nachschlagen bei OpenFoodFacts

#### ✅ Neu: Wochenplan Kalender-Export (.ics)
- Neuer `CalendarService` (`calendar.service.ts`) zur Generierung von RFC 5545 iCalendar-Dateien
- Erzeugt Termine für geplante Gerichte mit Rezeptdetails, Kochzeit und CO₂-Ersparnis
- 1-Klick-Export für Google Kalender, Apple Kalender und Microsoft Outlook (inkl. 4 Unit-Tests)

#### ✅ Neu: Professionelles Print-CSS für Einzelrezepte
- Schaltfläche „🖨️ Rezept drucken" in `eco-chef-recipe-view.ts`
- Umfassendes `@media print`-Stylesheet in `eco-chef.styles.ts`: blendet Header, Navigation, Chat und Buttons aus und erzeugt ein sauberes DIN-A4-Rezeptblatt

#### ✅ Neu: Duales IndexedDB- & Quota-Speichersystem
- Asynchrone Persistierung aller Rezepte in IndexedDB (`ecoChef_db`) ohne Größenbeschränkungen
- Nahtlose Kombination mit synchronem LocalStorage-Cache und automatischem Bilddaten-Pruning

### v1.3.0 (2026-10-03) – Security, Quality & Architecture Optimizations

#### ✅ Neu: Echte Vektor-QR-Codes (ISO/IEC 18004)
- Echtes SVG-Generierungsmodul via `qrcode-generator` in `qr.service.ts` implementiert (Ersetzt Fake-SVG)
- Automatische Wahl der optimalen QR-Code-Version (1–40) mit Error-Correction-Level L
- Unmittelbar mit allen nativen Smartphone-Kameras (iOS & Android) sowie QR-Scannern lesbar

#### ✅ Neu: Screen Wake Lock & Haptik im Kochmodus
- Integration der `navigator.wakeLock` API in `eco-chef-cooking-mode.ts`: Display bleibt während des Kochens dauerhaft eingeschaltet (kein lästiges Display-Sperren mit nassen Händen)
- Automatischer Re-Acquire bei Tab-Wechsel (`visibilitychange`) und sauberes Release beim Beenden
- Haptisches Feedback via `navigator.vibrate` bei Schrittnavigation, Schnell-Timern und Alarmen

#### ✅ Neu: Client-seitige E2E-Verschlüsselung für Cloud-Sync
- Neuer `CryptoService` (`crypto.service.ts`) auf Basis der Web Crypto API
- Verschlüsselt Rezept- und Vorratskammerdaten vor dem Cloud-Push mit **AES-GCM 256-Bit** und PBKDF2-abgeleitetem Schlüssel aus dem Sync-Code
- Entschlüsselt Daten beim Sync-Pull sicher im Browser des Zielgeräts

#### ✅ Neu: LocalStorage Quota-Schutz & Bild-Pruning
- Robuste Speicherung via `safeSetItem` in `storage.service.ts`
- Erkennt `QuotaExceededError` automatisch und entfernt speicherintensive historische Base64-Vorschaubilder, um Datenverlust von Rezepten und Vorräten zu verhindern

#### ✅ Neu: Vercel Proxy-Härtung & Rate-Limiting
- Per-IP Rate Limiting (In-Memory Sliding Window, max. 30 Req/Min) in `api/gemini.ts`
- Whitelist für erlaubte Gemini-Modelle (`ALLOWED_MODELS`), um Missbrauch und Denial-of-Service abzuwehren

#### ✅ Neu: Modernisierte PWA Caching-Strategie
- Service Worker `eco-chef-v3`:
  - **Network-First** für HTML/Navigation (stets aktuelle App-Version)
  - **Stale-While-Revalidate** für statische JS/CSS/Font-Assets (blitzschneller Offline-Start)
  - Vollständiger Cache-Bypass für API-Routen (`/api/`)

#### ✅ Neu: Webpack Code-Splitting & Hashing
- `splitChunks: { chunks: 'all' }` und `runtimeChunk: 'single'` in `webpack.config.js`
- Bessere Bündelgrößen und optimiertes Browser-Caching durch `[name].[contenthash:8].js`

#### ✅ Verbessert: OpenFoodFacts API-Compliance
- Konformer `User-Agent: EcoChef/1.2.0 (https://github.com/Schengii/eco-chef; support@eco-chef.app)` und `Accept: application/json` Header in allen Barcode-Anfragen

#### ✅ Verbessert: Speech Recognition Loop-Schutz
- Failsafe-Wiederanlaufschutz mit 600ms Throttling, maximal 5 Wiederholungsversuchen und automatischem Reset bei Nutzerinteraktion

#### ✅ Refactoring & Modularisierung
- Auslagerung der Rezeptsammlung in eine eigenständige Lit-Komponente `eco-chef-saved-recipes.ts`
- Strukturierte Optionen `generateRecipeFromOptions` in `gemini.service.ts`
- Typ-Sicherheits-Check via `npm run type-check` und CI-Integration via GitHub Actions

### v1.2.0 (2026-09-29) – Mobile & Deployment

#### ✅ Neu: Vercel Serverless Proxy
- Neue Datei `api/gemini.ts`: Serverless Function die direkt die Gemini REST API aufruft (kein `@google/genai` SDK – löst ESM/CJS-Konflikt auf Vercel)
- `GEMINI_API_KEY` wird sicher als Server-seitige Umgebungsvariable verwaltet
- Unterstützt `generateContent` (Text & Multimodal) mit Fallback-Antwort für `generateImages`

#### ✅ Neu: Android + iOS Cordova-Unterstützung
- `config.xml` vollständig überarbeitet:
  - Android: `minSdkVersion=24`, `targetSdkVersion=36`, `Scheme=https`, `Hostname=localhost` (verhindert `file://`-Einschränkungen)
  - iOS: `WKWebViewOnly`, `EnableViewportScale`, Inline-Medienwiedergabe
  - Content Security Policy erlaubt Vercel-Proxy, Gemini-API, OpenFoodFacts, Google Fonts
  - Plugin `cordova-plugin-network-information` hinzugefügt
- `gemini.service.ts`: `getProxyUrl()` erkennt Cordova-Umgebung (`file://`/`content://` Protokoll oder `window.cordova`) und leitet automatisch an die absolute Vercel-URL weiter

#### ✅ Neu: Sichere Service Worker Registrierung
- `index.html`: Service Worker wird nur im Web-Kontext registriert; in Cordova (`file://`) übersprungen, da dort nicht unterstützt

#### ✅ Behoben: Gemini-Modellname
- Alle 6 Vorkommen von `gemini-flash-latest` (veraltet/überlastet) auf `gemini-2.5-flash` aktualisiert

### v1.1.0 (2026-08-18) – Kritische Verbesserungen

#### ✅ Neu: Toast-Benachrichtigungs-System
- Neue Komponente `eco-chef-toast.ts` mit `success`, `error`, `warning`, `info` Varianten
- Slide-In/Out-Animationen mit Auto-Dismiss (3,5 Sekunden Standard)
- Alle 35+ `alert()` und `confirm()` Aufrufe in der App ersetzt

#### ✅ Verbessert: CO₂-Tracking-Genauigkeit
- Fallback-Schätzung wenn Gemini API keinen `co2SavedKg`-Wert liefert
- Verhindert 0kg-Einträge in den Statistiken

#### ✅ Verbessert: Error-Handling bei Rezeptgenerierung
- Spezifische Fehlermeldungen je nach Fehlertyp (403, 429, Timeout, Netzwerk)

#### ✅ Verbessert: API-Key Sicherheit
- Webpack `DefinePlugin` injiziert den API-Key zur Build-Zeit aus `.env`
- `.env.example`-Vorlage hinzugefügt

---

## 📄 Lizenz & Autor
- **Autor:** Max Schenk
- **Lizenz:** Apache-2.0
