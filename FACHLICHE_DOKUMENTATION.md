# EcoChef – Fachliche & Technische Dokumentation ⚙️

Dieses Dokument bietet eine Übersicht über die technische Architektur, den Code-Aufbau, die Kommunikationsflüsse, Datenstrukturen und die Einbindung der Künstlichen Intelligenz (KI) in der **EcoChef** App.

---

## 1. Architektur und Code-Aufbau

EcoChef ist als **Multi-Plattform Hybrid-App** konzipiert. Sie verwendet Standard-Webtechnologien für die Logik und Benutzeroberfläche und wird mithilfe von **Apache Cordova** in native Android- und iOS-Apps verpackt. Die Web-Version wird über **Vercel** gehostet und nutzt eine Serverless Function als sicheren KI-Proxy.

### Technologieschnittstellen
1. **Frontend-Framework:** [Lit (LitElement)](https://lit.dev/) zur Erstellung leichtgewichtiger, wiederverwendbarer Web Components mit reaktivem State-Management im Shadow DOM.
2. **Programmiersprache:** TypeScript 5.x (`strict: true`) für vollständige Typsicherheit.
3. **Build-Tool:** Webpack 5 bündelt TypeScript, Stylesheets und HTML aus dem Quellordner (`ui-src/`) in den Ausgabeordner (`www/`) mit Content-Hash-Dateinamen für Cache-Busting.
4. **Hybrid-Wrapper:** Apache Cordova verpackt den `www/`-Ordner in ein natives Android-Projekt (`platforms/android/`) und iOS-Projekt (`platforms/ios/`) mit Zugriff auf native Hardware-Schnittstellen (Kamera).
5. **Web-Hosting & API-Proxy:** Vercel hostet die statischen Dateien und stellt die Serverless Function `api/gemini.ts` als HTTPS-Endpunkt bereit.

### Verzeichnisstruktur
```
EcoChef/
├── api/
│   ├── gemini.ts           # Vercel Serverless Function (Gemini REST-Proxy mit Rate-Limiting & Model-Whitelist)
│   └── tsconfig.json       # TypeScript für NodeNext-Modul-Resolution
├── ui-src/
│   ├── index.html          # HTML-Einstiegspunkt (CSP-Meta, SW-Registrierung)
│   ├── api-config.ts       # Build-Zeit API-Key-Injektion via Webpack DefinePlugin
│   ├── eco-chef.ts         # Hauptkomponente: zentraler Controller & App-State
│   ├── components/         # Modulare Lit-Komponenten (Views, Modals, Widgets)
│   │   └── eco-chef-saved-recipes.ts # Ausgelagerte Rezeptbuch-Verwaltung & Filter
│   ├── services/           # Geschäftslogik & externe APIs
│   │   ├── calendar.service.ts # RFC 5545 iCalendar-Export (.ics) für Wochenpläne
│   │   ├── crypto.service.ts # Clientseitige E2E-Verschlüsselung (AES-GCM 256-Bit)
│   │   ├── qr.service.ts   # Standardkonforme Vektor-QR-Codes (ISO/IEC 18004)
│   │   ├── storage.service.ts # Duales IndexedDB- & Quota-Storage mit Bild-Pruning
│   │   └── ...
│   ├── models/             # TypeScript-Interfaces & gemeinsame Hilfsfunktionen
│   └── styles/             # Design Tokens & CSS-Variablen
├── www/                    # Webpack Build-Output (Cordova-Root, Vercel-Static)
├── platforms/
│   ├── android/            # Generierter nativer Android-Code (Gradle)
│   └── ios/                # Generierter nativer iOS-Code (Xcode)
└── config.xml              # Zentrale Cordova-Konfiguration
```

---

## 2. Deployment-Architektur

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Web-Hosting)                     │
│  ┌────────────────────────────┐  ┌────────────────────────┐ │
│  │  Static Files (www/)       │  │  /api/gemini           │ │
│  │  - bundle.[hash].js        │  │  Serverless Function   │ │
│  │  - index.html              │  │  Node.js, REST-Proxy   │ │
│  │  - sw.js, manifest.json    │  └───────────┬────────────┘ │
│  └────────────────────────────┘              │               │
└──────────────────────────────────────────────│───────────────┘
                                               │
                                        GEMINI_API_KEY
                                        (Server-Env-Var)
                                               │
                                               ▼
                               ┌───────────────────────────┐
                               │  Google Gemini REST API   │
                               │  gemini-2.5-flash         │
                               │  generativelanguage.      │
                               │  googleapis.com/v1beta    │
                               └───────────────────────────┘

Clients → Proxy-Routing:
  Browser (Web/PWA)  →  relative URL /api/gemini
  Android (Cordova)  →  absolute https://eco-chef-theta.vercel.app/api/gemini
  iOS (Cordova)      →  absolute https://eco-chef-theta.vercel.app/api/gemini
```

### Warum ein Proxy?
Der Gemini API-Key darf nicht im Client-Bundle enthalten sein (Browser-DevTools sichtbar). Der Vercel-Proxy nimmt Anfragen ohne API-Key entgegen, ergänzt den Key serverseitig aus der Umgebungsvariable und leitet an die Gemini REST API weiter. Der Browser-Client erhält nur die fertige Antwort.

---

## 3. Kommunikation: Wer kommuniziert mit wem?

Die Anwendung folgt dem Prinzip **„Data down, Events up"**.

### Kommunikationsfluss
```
+-------------------------------------------------------------+
|                        eco-chef.ts                          |
|                  (Zentraler State-Controller)               |
+-----+----------------------+--------------------------+-----+
      |                      |                          |
      | (Daten/Properties)   | (Aufrufe)                | (Custom Events)
      v                      v                          v
+-----+----------------+  +---+-------------------+  +--+------------------+
|    UI-Komponenten    |  |       Services        |  |  Sub-Komponenten    |
| - Welcomescreen      |  | - GeminiService       |  | (Settings, Shopping |
| - Recipe View        |  | - StorageService      |  |  List, Cooking,     |
| - Cooking Mode       |  | - SpeechService       |  |  GDPR Banner)       |
+----------------------+  | - AudioService        |  +---------------------+
                          +-----------------------+
```

1. **Parent-to-Child (Datenfluss nach unten):**
   `eco-chef.ts` hält den Anwendungszustand (`recipe`, `ingredients`, `shoppingList`, `isDarkMode`, …) und reicht diese als Properties an Subkomponenten weiter.

2. **Child-to-Parent (Events nach oben):**
   Aktionen in Subkomponenten senden **Custom Events** nach oben (`this.dispatchEvent(new CustomEvent('start-cooking'))`). Die Hauptkomponente fängt diese ab, aktualisiert den State und löst Neu-Rendering aus.

3. **Services:**
   Zustandslose Singleton-Objekte für Datenzugriff (`StorageService`), Sprachausgabe (`SpeechService`), Alarme (`AudioService`) und KI-Anfragen (`GeminiService`).

---

## 4. KI-Einbindung: Wie wird die KI genutzt?

### A. Gemini Service (`gemini.service.ts`)

Der Service enthält zwei Ausführungspfade:

**Pfad 1 – Server-Proxy (Standard):**
Wenn kein direkter API-Key vorhanden ist (oder die App in Cordova läuft), sendet der Service HTTP-POST-Anfragen an den Vercel-Proxy.

```typescript
function getProxyUrl(): string {
    // Cordova-Erkennung: file:// oder content:// Protokoll, oder window.cordova
    if (window.location.protocol === 'file:' ||
        window.location.protocol === 'content:' ||
        (window as any).cordova) {
        return 'https://eco-chef-theta.vercel.app/api/gemini';
    }
    return '/api/gemini'; // relative URL im Web-Browser
}
```

**Pfad 2 – Direkter API-Key (optional):**
Falls der Nutzer in den Einstellungen einen eigenen Key eingetragen hat, ruft der Service die Gemini SDK direkt auf.

### B. Vercel Serverless Function (`api/gemini.ts`)

Die Function kommuniziert direkt mit der Gemini REST API – ohne das `@google/genai` SDK. Dies vermeidet den ESM/CJS-Konflikt (das SDK ist ESM-only, Vercel's `@vercel/node` kompiliert zu CommonJS).

**Sicherheits- & Härtungs-Maßnahmen:**
- **In-Memory Rate Limiting:** Sliding-Window Drosselung auf maximal 30 Anfragen pro Minute je Client-IP. Überschreitungen werden mit HTTP 429 beantwortet.
- **Modell-Whitelist (`ALLOWED_MODELS`):** Erlaubt ausschließlich verifizierte Modelle (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `imagen-3.0-generate-002`). Unzulässige Modellbezeichner werden mit HTTP 400 abgewiesen.
- **CORS-Restriktionen:** Zulassung der definierten Header `Content-Type` und `Authorization`.

```
POST /api/gemini
Body: {
  action: "generateContent",
  model: "gemini-2.5-flash",
  contents: [...],
  config: { responseMimeType: "application/json" }
}

→ Proxy ruft auf:
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=<SERVER_KEY>

→ Antwort:
{ text: "<KI-Antwort>" }
```

### C. KI-Anwendungsfälle

| Funktion | Modell | Eingabe | Ausgabe |
|---|---|---|---|
| **Rezeptgenerierung** | `gemini-2.5-flash` | Zutaten-Text + optionales Kühlschrankfoto (Base64) | JSON-Rezept mit Nährwerten, Eco-Score, Schritten |
| **Kassenzettel-Scan** | `gemini-2.5-flash` | Bon-Foto (Base64) + Prompt | JSON-Array mit erkannten Lebensmitteln |
| **Produkt-Scan** | `gemini-2.5-flash` | Produkt-Foto (Base64) + Prompt | JSON-Objekt (Name, Menge, MHD, Lagerort) |
| **Kochassistent (Live)** | `gemini-2.5-flash` | Nutzerfrage + Rezeptname als Text | Kurze Antwort (1–2 Sätze) |
| **Wochenplaner** | `gemini-2.5-flash` | Vorräte, Ernährungsweise, Aufwand, Personen | JSON-Objekt mit 7 Tageseinträgen |
| **Bild-Generierung** | `imagen-3.0-generate-002` | Rezepttitel (englisch) | JPEG Base64 |
| **Bild-Fallback** | lokal (`recipe-image.service.ts`) | Rezepttitel | SVG-Platzhalter (Emoji + Farbverlauf), keine externe Anfrage |

### D. Strukturierte JSON-Ausgabe

Alle Rezept-Anfragen setzen `responseMimeType: 'application/json'` in der `generationConfig`. Das zwingt Gemini, ausschließlich valides JSON zurückzugeben, das direkt in die Lit-Komponenten gerendert werden kann.

### E. Prompt-Kapselung & Typisierte Optionen

Zur Trennung von Präsentations- und Geschäftslogik kapselt `GeminiService.generateRecipeFromOptions(options: RecipeGenerationOptions)` das gesamte Prompt-Engineering. Die UI übergibt strukturierte Parameter (`ingredients`, `urgentIngredients`, `pantryItems`, `allergens`, `diet`, `time`, `servings`, `strictMode`, `imagePart`), während der Service den System-Prompt, Few-Shot-Anweisungen und JSON-Rückgabespezifikationen konsolidiert.

---

## 5. Cordova-Konfiguration (`config.xml`)

### Android-Konfiguration
```xml
<platform name="android">
    <preference name="android-minSdkVersion" value="24" />
    <preference name="android-targetSdkVersion" value="36" />
    <preference name="Scheme" value="https" />
    <preference name="Hostname" value="localhost" />
</platform>
```

Die Einstellungen `Scheme=https` + `Hostname=localhost` bewirken, dass die App intern unter `https://localhost/` statt `file:///` läuft. Dies erlaubt:
- Relative URL-Auflösung (kein `file://`-Protokoll-Problem)
- Service Worker Registrierung (nicht unterstützt auf `file://`)
- Same-Origin-Policy für localStorage/IndexedDB

> **Hinweis:** Da die Android-App intern `https://localhost` verwendet, erkennt `getProxyUrl()` dies als Web-Kontext und nutzt die relative URL `/api/gemini` – die jedoch auf `file://` verweisen würde. Daher prüft der Service zusätzlich `window.cordova` für eine zuverlässige Erkennung.

### Content Security Policy
Die CSP ist sowohl in `config.xml` als auch in `ui-src/index.html` definiert und erlaubt explizit:
- `https://generativelanguage.googleapis.com` – direkte Gemini API (bei eigenem Key)
- `https://eco-chef-theta.vercel.app` – Vercel-Proxy
- `https://world.openfoodfacts.org` – Barcode-Lookup
- `https://kvdb.io` – verschlüsselter Haushalts-Sync
- `https://fonts.googleapis.com` / `https://fonts.gstatic.com` – Google Fonts

### Eingabe-Härtung & Ausgabe-Escaping
Alle externen Daten (KI-Antworten, Importe, QR-Codes, Sync) werden per zod-Schema validiert. Zusätzlich werden Rezeptdaten vor der Ausgabe in das Druckfenster (`PdfService.generateCookbookHtml`) HTML-maskiert, da dieses Fenster dieselbe Origin wie die App nutzt und sonst Zugriff auf `localStorage` (inkl. eventuell gespeichertem Nutzer-Key) hätte. Die QR-SVG wird ausschließlich aus Zahlenwerten erzeugt.

### Lazy-Loading des Gemini-SDKs
`@google/genai` wird nur geladen, wenn ein eigener API-Key hinterlegt ist (`createClient()` in `gemini.service.ts`, dynamischer `import()`). Webpack legt das SDK dafür in einen eigenen asynchronen Chunk (`genai`). Der Standardweg läuft über den Serverless-Proxy ohne SDK im Client.

### Service Worker
```javascript
var isCordova = window.location.protocol === 'file:' ||
                window.location.protocol === 'content:' ||
                !!window.cordova;
if (!isCordova && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}
```
Service Worker werden in Cordova-Apps nicht registriert, da `file://`-Protokoll dies nicht unterstützt. Im Web-Browser ermöglichen sie Offline-Fähigkeit und PWA-Installation.

---

## 6. Schlüssel und Datenspeicher

### A. API-Schlüssel
* **`GEMINI_API_KEY`** (Vercel-Umgebungsvariable, server-seitig):
  Wird nie an den Client übertragen. Nur die Vercel Serverless Function hat Zugriff.
* **Nutzer-Key** (`ecoChef_geminiApiKey` in LocalStorage):
  Optional. Falls eingetragen, hat er Vorrang und der Client ruft Gemini direkt auf (ohne Proxy).

### B. LocalStorage-Schlüssel (StorageService)

| Schlüssel | Datentyp | Zweck |
| :--- | :--- | :--- |
| `ecoChef_gdprConsent` | `string` | DSGVO-Einwilligung |
| `ecoChef_theme` | `string` | Dark/Light-Mode |
| `ecoChef_lrsMode` | `string` | LRS/Dyslexie-Modus |
| `ecoChef_fontScale` | `string` | Schriftgrößen-Skalierung |
| `ecoChef_showRuler` | `string` | Leselineal anzeigen |
| `ecoChef_pantry` | `JSON-String` | Vorratskammer-Grundzutaten |
| `ecoChef_shoppingList` | `JSON-String` | Einkaufsliste |
| `ecoChef_allergens` | `JSON-String` | Ausgeschlossene Allergene |
| `ecoChef_stats` | `JSON-String` | Ernährungstagebuch (Datum → Kalorien/CO₂) |
| `ecoChef_ingredientChips` | `JSON-String` | Aktuelle Zutaten-Chips |
| `ecoChef_urgentIngredients` | `JSON-String` | Als „dringend" markierte Zutaten |
| `ecoChef_savedRecipes` | `JSON-String` | Gespeicherte Rezepte mit Bewertung |
| `ecoChef_calorieGoal` | `string` | Tägliches Kalorienziel |
| `ecoChef_proteinGoal` | `string` | Tägliches Proteinziel |
| `ecoChef_geminiApiKey` | `string` | Optionaler Nutzer-API-Key |

### C. Clientseitige Ende-zu-Ende-Verschlüsselung (`CryptoService`)
Zur sicheren geräteübergreifenden Synchronisation nutzt die App die native Web Crypto API (`window.crypto.subtle`):
- **Schlüsselableitung:** Der 6-stellige alphanumerische Sync-Code dient als Basis. Mittels PBKDF2 (100.000 Iterationen, SHA-256) und einem 16-Byte Salt wird ein 256-Bit symmetrischer AES-GCM-Schlüssel abgeleitet.
- **Payload-Verschlüsselung:** JSON-Payloads (Vorratskammer, Rezepte) werden mit AES-GCM (12-Byte random IV) verschlüsselt. Die Cloud speichert ausschließlich Base64-Chiffrate (`{ iv, salt, data }`). Ohne den Sync-Code ist die Entschlüsselung unmöglich (Zero-Knowledge-Prinzip).

### D. Speicher-Quota-Schutz & Bilddaten-Pruning
`StorageService.safeSetItem()` fängt `QuotaExceededError`-Ausnahmen bei vollem `localStorage` ab. In diesem Fall führt der Service eine Bereinigung historischer Rezepte durch, indem speicherintensive Base64-Bilddaten entfernt werden, während Kochanleitungen und Zutatenlisten erhalten bleiben. Anschließend wird der Schreibversuch erfolgreich wiederholt.

### E. Duales IndexedDB- & Quota-Speichersystem
Zusätzlich zum synchronen LocalStorage implementiert `StorageService` eine asynchrone Persistenzebene auf Basis von nativem IndexedDB (`ecoChef_db`, ObjectStore `recipes`).
- **Keine Größenbeschränkung:** Rezepte inklusive detaillierter Nährwerte, Zubereitungsschritte und hochauflösender Fotos werden in IndexedDB ohne die 5MB-Beschränkung des Browsers gesichert.
- **Automatisches Wiederherstellen:** Über `restoreRecipesFromIndexedDb()` können Rezepte bei versehentlich gelöschtem Browserspeicher oder nach Quota-Bereinigungen nahtlos wieder in die UI geladen werden.

---

## 7. Android-Build-Anleitung

### Voraussetzungen
- Java JDK 17+ (`JAVA_HOME` gesetzt)
- Android SDK mit folgenden Komponenten (via Android Studio SDK Manager):
  - `cmdline-tools` (latest)
  - `platform-tools`
  - `build-tools;36.0.0` (oder aktueller)
  - `platforms;android-36`
- Apache Cordova: `npm install -g cordova`

### Build-Schritte
```bash
# 1. Android-Plattform einmalig hinzufügen
npx cordova platform add android

# 2. Cordova-Anforderungen prüfen
npx cordova requirements android

# 3. Web-App bauen
npm run build

# 4. Debug-APK erzeugen
npx cordova build android

# APK-Pfad:
# platforms/android/app/build/outputs/apk/debug/app-debug.apk

# 5. Direkt auf angeschlossenes Gerät deployen (USB-Debugging aktiviert)
npx cordova run android

# 6. Release-APK (für Store-Veröffentlichung, erfordert Signierung)
npx cordova build android --release
```

### iOS-Build-Anleitung (nur macOS)
```bash
# Xcode und Command Line Tools installieren
xcode-select --install

# iOS-Plattform einmalig hinzufügen
npx cordova platform add ios

# Web-App bauen
npm run build

# iOS-Build erstellen
npx cordova build ios

# Auf Simulator deployen
npx cordova run ios --emulator
```

---

## 8. Eigenleistung im Projekt

Im Rahmen des Projekts wurden folgende Kernbereiche eigenständig konzipiert und implementiert:

1. **Multi-Plattform-Architektur (Web + Android + iOS):**
   Einheitliche Codebasis für alle drei Plattformen über Cordova mit plattformspezifischer Proxy-Erkennung und Service-Worker-Verwaltung.

2. **Vercel Serverless Proxy (ESM/CJS-Problem gelöst):**
   Da `@google/genai` v1.x ESM-only ist und Vercels `@vercel/node` CommonJS erzeugt, wurde der Proxy komplett ohne SDK als direkter REST-API-Aufruf (`fetch`) implementiert.

3. **Modulare Web-Component-Architektur:**
   Strukturierung als SPA auf Basis von Lit. 10 spezialisierte Unterkomponenten (inkl. ausgelagerter Rezeptverwaltung `eco-chef-saved-recipes`) für hohe Wartbarkeit und Wiederverwendbarkeit.

4. **Datenpersistenz & Sicherheit:**
   - `StorageService` mit automatischem LocalStorage Quota-Schutz und Pruning
   - Clientseitige Ende-zu-Ende-Verschlüsselung (`CryptoService`) via Web Crypto API (AES-GCM 256-Bit) für Cloud-Synchronisation
   - Vollständige Offline-Fähigkeit mit modernisierter Service Worker PWA-Strategie (Network-First für HTML, Stale-While-Revalidate für statische Assets)

5. **Kamera-Integration (Hybrid):**
   Native Gerätekamera über `cordova-plugin-camera` mit automatischem Fallback auf `navigator.mediaDevices.getUserMedia` im Browser.

6. **Kochmodus & Sprachsteuerung:**
   - Screen Wake Lock API: Verhindert automatisches Abschalten des Bildschirms beim Kochen mit nassen Händen
   - Haptisches Feedback via `navigator.vibrate` bei Navigation, Schnell-Timern und Alarmen
   - Web Speech API (`SpeechRecognition` / `SpeechSynthesis`) für freihändige Navigation mit 5-Retry Loop-Schutz und Backoff

7. **Erweiterte Lesehilfen:**
   LRS-Modus (OpenDyslexic-Schriftart, modifizierte Zeilenabstände) und Drag-&-Drop-Leselineal.

8. **Nachhaltigkeits- und Ernährungstracker:**
   CO₂-Ersparnis-Berechnung mit Fallback-Schätzung basierend auf Eco-Score und Ernährungsweise.

9. **Premium-UI/UX & Druckoptimierung:**
   HSL-basiertes, barrierefreies CSS-Designsystem mit Dark-Mode, Mikro-Animationen, Webpack Code-Splitting mit Content-Hashing und dediziertem Print-CSS (`@media print`) für sauberen DIN-A4-Rezeptdruck.

10. **Erweiterungen & Qualitätssicherung:**
    - Live-Kamera-Barcodescanner in `eco-chef-pantry` mit nativer `BarcodeDetector`-API, animierter Laserlinie und Audio/Haptik-Feedback
    - Standardkonforme Vektor-QR-Codes (ISO/IEC 18004) für Rezept-Sharing via beliebiger Kamera-App
    - RFC 5545 iCalendar-Export (`CalendarService`) für den Wochenplaner (.ics für Apple, Google & Outlook)
    - OpenFoodFacts Barcode API (`BarcodeService`) mit RFC-konformen User-Agent & Accept Headern
    - API-Proxy-Härtung mit Per-IP Rate Limiting (30 Req/Min) und Gemini Modell-Whitelist
    - Dynamische Portionsrekonstruktion (Echtzeit-Skalierung von Mengen und Nährwerten)
    - Regio-Markt Finder (`eco-chef-regional-map`)
    - Budget- & MHD-Ablauf-Tracking
    - Vollständiges JSON-Datensicherungs-System
    - Automatisierte Tests: 224 Jest-Unit-Tests (37 Suites, ca. 87 % Coverage) und 9 Playwright-E2E-Tests, alle bestanden
    - Lazy-Loading des Gemini-SDKs (nur bei eigenem Nutzer-Key), Start-Bundle 311 KiB
    - HTML-Escaping aller Rezeptfelder im Kochbuch-Druck (`escapeHtml` in `pdf.service.ts`)
    - Strikte TypeScript-Prüfung (`npm run type-check`) in lokaler Entwicklung und GitHub Actions CI
    - Nährwert- & Klimaschutz-Dashboard
    - Globales Floating-Timer-Widget
    - „Mystery Box" Restekiste-Algorithmus
    - Synthetisierte Web-Audio-Soundeffekte (Oszillator-basiert)
