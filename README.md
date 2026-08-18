# EcoChef 🧑‍🍳 - Dein intelligenter KI-Rezept-Zauberer

**EcoChef** ist eine moderne, nachhaltige Hybrid-Web- & Mobile-App, die aus deinen vorhandenen Kühlschrankzutaten kreative, klimaschonende und leckere Gerichte zaubert. Mit Fokus auf Resteverwertung, Barrierefreiheit (LRS-Modus, Leselineal, Screenreader), Sprachsteuerung, Wochenmärkte-Finder, OpenFoodFacts Barcode-Scanner und umfassendes Budget- & Umwelt-Tracking.

---

## 🌟 Kernfunktionen & Features

- 🪄 **KI-Rezept-Zauberer (Google Gemini 2.5/Flash & Imagen):** Generierung maßgeschneiderter Rezepte inkl. Nährwerten, Eco-Score, Wein-/Getränkeempfehlung & Gerichtsfoto.
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
- 🍞 **Toast-Benachrichtigungen:** Professionelles In-App Benachrichtigungssystem (`eco-chef-toast`) mit Slide-In/Out-Animation, Auto-Dismiss und Aktions-Buttons statt blockierender Browserdialoge.

---

## 🔑 API-Key Konfiguration

### Entwicklungsumgebung (lokal)
Erstelle eine `.env`-Datei im Projektverzeichnis (ist git-ignored):

```bash
# Kopiere die Beispieldatei und füge deinen Key ein
cp .env.example .env
# Dann: Ersetze 'your_gemini_api_key_here' mit deinem echten Key
```

Inhalt der `.env`-Datei:
```
GEMINI_API_KEY=dein_api_key_hier
```

> **Tipp:** Der API-Key kann jederzeit auch direkt in den App-Einstellungen (⚙️) eingegeben werden. Dies hat immer Vorrang vor dem Build-Key.

> **Sicherheit:** Committe niemals einen echten API-Key in die Versionskontrolle. Die `.env`-Datei ist in `.gitignore` eingetragen.

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
```bash
cordova platform add android
npm run build
cordova run android
```

---

## ⚙️ Projektstruktur

```
EcoChef/
├── .env.example                # API-Key Konfigurationsvorlage (git-tracked)
├── .env                        # Lokaler API-Key (git-ignored!)
├── ui-src/                     # TypeScript Quellcode (Lit Web Components)
│   ├── api-config.ts           # API-Key Konfiguration (über .env / DefinePlugin)
│   ├── eco-chef.ts             # Zentraler Controller & App-State
│   ├── components/             # Modulare UI-Komponenten
│   │   ├── eco-chef-recipe-view.ts       # Rezeptansicht & Portionsskalierer
│   │   ├── eco-chef-cooking-mode.ts      # Kochmodus & Sprachsteuerung/Timer
│   │   ├── eco-chef-pantry.ts            # Vorratskammer & EAN Barcode / Bon-Scan
│   │   ├── eco-chef-regional-map.ts      # Regio-Markt & Unverpackt Finder
│   │   ├── eco-chef-shopping-list.ts     # Einkaufsliste & Budget-Tracker
│   │   ├── eco-chef-settings.ts          # Setup, Budget & Voll-Backup
│   │   ├── eco-chef-meal-planner.ts      # Wochenplaner
│   │   ├── eco-chef-toast.ts             # Toast/Snackbar Benachrichtigungs-System (NEU)
│   │   └── eco-chef-achievements.ts      # Erfolge & SVG-Charts
│   ├── services/               # Gemini API, Barcode, QR, Storage, Speech Services
│   ├── models/                 # TypeScript Interfaces & gemeinsame Hilfsfunktionen
│   └── styles/                 # Design System & CSS Tokens
├── BENUTZERANLEITUNG.md        # Ausführliche Anleitung für Anwender
├── FACHLICHE_DOKUMENTATION.md  # Architektur- & Entwickler-Dokumentation
└── webpack.config.js           # Webpack Bündelungs-Konfiguration
```

---

## 📋 Changelog

### v1.1.0 (2026-08-18) – Kritische Verbesserungen

#### ✅ Neu: Toast-Benachrichtigungs-System
- Neue Komponente `eco-chef-toast.ts` mit `success`, `error`, `warning`, `info` Varianten
- Slide-In/Out-Animationen mit Auto-Dismiss (3,5 Sekunden Standard)
- Optionaler Aktions-Button (z.B. „Rückgängig", „Bestätigen")
- Alle 35+ `alert()` und `confirm()` Aufrufe in der App ersetzt
- Asynchrones Confirm-Dialog-System (`showConfirmToast()`) für Aktionen wie „Alle Daten löschen"

#### ✅ Verbessert: CO₂-Tracking-Genauigkeit
- Fallback-Schätzung wenn Gemini API keinen `co2SavedKg`-Wert liefert
- Berechnung basiert auf Eco-Score (🍃-Anzahl) und Ernährungsweise (vegan × 1.3, vegetarisch × 1.1)
- Verhindert 0kg-Einträge in den Statistiken

#### ✅ Verbessert: Error-Handling bei Rezeptgenerierung
- Spezifische Fehlermeldungen je nach Fehlertyp:
  - **API-Key-Fehler** (403): „Ungültiger API-Key. Bitte in den Einstellungen prüfen."
  - **Rate-Limit** (429): „API-Limit erreicht. Bitte kurz warten."
  - **Timeout** (DEADLINE): „Zeitüberschreitung – bitte nochmal versuchen."
  - **Netzwerkfehler**: „Verbindungsfehler – Internetverbindung prüfen."
  - **Parse-Fehler**: „KI-Antwort konnte nicht verarbeitet werden."
- Neuer State `lastError` für spätere Retry-Logik

#### ✅ Verbessert: API-Key Sicherheit
- Webpack `DefinePlugin` injiziert den API-Key zur Build-Zeit aus einer `.env`-Datei
- `.env`-Datei ist git-ignored (niemals in Versionskontrolle)
- `.env.example`-Vorlage hinzugefügt
- `.gitignore` um `.env`, `.env.local` erweitert
- `api-config.ts` enthält keinen hartcodierten Key mehr

#### ✅ Behoben: Code-Duplikat `getGroupedShoppingList`
- Gemeinsame Hilfsfunktion `getGroupedShoppingList()` in `eco-chef.models.ts` ausgelagert
- Identische Implementierung aus `eco-chef.ts` und `eco-chef-shopping-list.ts` entfernt
- Beide Komponenten importieren jetzt die gemeinsame Funktion aus dem Models-Modul

#### ✅ Behoben: `SpeechService.startListening()` Alert
- Kein `alert()` mehr wenn Sprachsteuerung nicht unterstützt wird
- Stattdessen: `console.warn()` + `onStatusChange` Callback mit benutzerfreundlicher Meldung
- `eco-chef.ts` zeigt nun einen Toast wenn der Status „nicht unterstützt" enthält

---

## 📄 Lizenz & Autor
- **Autor:** Max Schenk
- **Lizenz:** Apache-2.0
