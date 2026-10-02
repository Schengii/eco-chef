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
- 📱 **QR-Code Rezept-Sharing:** Generiere hochauflösende Vektor-QR-Codes für jedes Rezept, um Gerichte sekundenschnell auf andere Smartphones zu übertragen.
- 🔍 **OpenFoodFacts EAN-Barcode-Scanner:** Scanne Barcodes von Lebensmittelverpackungen, um Name, Marke, Nutri-Score (A-E) und Haltbarkeit automatisch abzufragen und in die Reste-Kammer einzutragen.
- 🌾 **Regionalitäts- & Wochenmarkt-Finder:** Entdecke regionale Wochenmärkte, Hofläden & Unverpackt-Geschäfte in deiner Nähe inkl. Öffnungszeiten, Entfernung und Direktübernahme von Markt-Spezialitäten auf deine Einkaufsliste.
- 💰 **Monatsbudget-Tracker & Spar-Kalkulator:** Lege dein monatliches Lebensmittelbudget fest, verfolge deine Ausgaben und berechne deine Ersparnis durch Resteverwertung.
- 🚨 **MHD Ablauf-Erinnerungen & Warn-Banner:** Automatische Warnung auf dem Startbildschirm bei Zutaten mit Ablaufdatum in ≤ 2 Tagen inkl. 1-Klick-Rezeptverkochen.
- 📸 **Kühlschrank- & Kassenzettel-Scan:** Scanne deine Einkäufe oder deinen Kühlschrank per Kamera/Upload.
- 🍽️ **Dynamische Portionsskalierung:** Skaliere Mengenangaben & Nährwerte in Rezepten interaktiv von 1 bis 12 Personen in Echtzeit.
- 🛒 **Einkaufsliste ➔ Vorratskammer Übernahme:** Übernehme abgehakte Einkaufsartikel mit einem Klick in die Reste-Kammer mit automatischer Haltbarkeitsberechnung.
- ⏱️ **Kochmodus mit Sprachsteuerung & Custom-Timern:** Freihändiges Navigieren per Sprachbefehl, automatische Schritt-Timer sowie manuelle Schnell-Timer.
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

### 4. Tests ausführen
```bash
npm test
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
│   ├── gemini.ts               # Vercel Serverless Function – Gemini REST-API Proxy
│   └── tsconfig.json           # TypeScript-Konfiguration für Vercel Functions
├── CLAUDE.md                   # Richtlinien & Architektur für Claude Code
├── config.xml                  # Cordova-Konfiguration (Android, iOS, Plugins, CSP)
├── ui-src/                     # TypeScript Quellcode (Lit Web Components)
│   ├── api-config.ts           # API-Key Konfiguration (Webpack DefinePlugin)
│   ├── eco-chef.ts             # Zentraler Controller & App-State
│   ├── index.html              # HTML-Einstiegspunkt (CSP, SW-Registrierung)
│   ├── components/             # Modulare UI-Komponenten
│   │   ├── eco-chef-recipe-view.ts       # Rezeptansicht & Portionsskalierer
│   │   ├── eco-chef-cooking-mode.ts      # Kochmodus & Sprachsteuerung/Timer
│   │   ├── eco-chef-pantry.ts            # Vorratskammer & EAN Barcode / Bon-Scan
│   │   ├── eco-chef-regional-map.ts      # Regio-Markt & Unverpackt Finder
│   │   ├── eco-chef-shopping-list.ts     # Einkaufsliste & Budget-Tracker
│   │   ├── eco-chef-settings.ts          # Setup, Budget & Voll-Backup
│   │   ├── eco-chef-meal-planner.ts      # Wochenplaner
│   │   ├── eco-chef-toast.ts             # Toast/Snackbar Benachrichtigungs-System
│   │   └── eco-chef-achievements.ts      # Erfolge & SVG-Charts
│   ├── services/               # Gemini API, Barcode, QR, Storage, Speech Services
│   ├── models/                 # TypeScript Interfaces & gemeinsame Hilfsfunktionen
│   └── styles/                 # Design System & CSS Tokens
├── www/                        # Webpack Build-Output (Cordova-Root)
├── platforms/android/          # Generierter Android-Code (nicht manuell bearbeiten)
├── BENUTZERANLEITUNG.md        # Ausführliche Anleitung für Anwender
├── FACHLICHE_DOKUMENTATION.md  # Architektur- & Entwickler-Dokumentation
└── webpack.config.js           # Webpack Bündelungs-Konfiguration
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
  Android-App        →  absolute URL https://eco-chef-schengii.vercel.app/api/gemini
  iOS-App            →  absolute URL https://eco-chef-schengii.vercel.app/api/gemini
```

---

## 🤖 KI-Entwicklerunterstützung (Claude Code)

Das Projekt ist für den Einsatz von KI-Assistenten (insbesondere [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview)) vorkonfiguriert:

- **[`CLAUDE.md`](./CLAUDE.md):** Enthält Kontextinformationen, Architekturdetails, Tech-Stack, Skripte und Code-Konventionen.
- **[`.claudeignore`](./.claudeignore):** Schließt Build-Artefakte, Abhängigkeiten und Secrets aus.
- **[`.claude.json`](./.claude.json):** Definiert Berechtigungen für Entwicklungsbefehle.

---

## 📋 Changelog

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
