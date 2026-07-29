# EcoChef 🧑‍🍳 - Dein intelligenter KI-Rezept-Zauberer

**EcoChef** ist eine moderne, nachhaltige Hybrid-Web- & Mobile-App, die aus deinen vorhandenen Kühlschrankzutaten kreative, klimaschonende und leckere Gerichte zaubert. Mit Fokus auf Resteverwertung, Barrierefreiheit (LRS-Modus, Leselineal, Screenreader), Sprachsteuerung, Wochenmärkte-Finder, OpenFoodFacts Barcode-Scanner und umfassendes Budget- & Umwelt-Tracking.

---

## 🌟 Kernfunktionen & Features

- 🪄 **KI-Rezept-Zauberer (Google Gemini 2.5/Flash & Imagen):** Generierung maßgeschneiderter Rezepte inkl. Nährwerten, Eco-Score, Wein-/Getränkeempfehlung & Gerichtsfoto.
- 📱 **QR-Code Rezept-Sharing:** Generiere hochauflösende Vektor-QR-Codes für jedes Rezept, um Gerichte sekundenschnell auf andere Smartphones zu übertragen.
- 🔍 **OpenFoodFacts EAN-Barcode-Scanner:** Scanne Barcodes von Lebensmittelverpackungen, um Name, Marke, Nutri-Score (A-E) und Haltbarkeit automatisch abzufragen und in die Reste-Kammer einzutragen.
- 🌾 **Regionalitäts- & Wochenmarkt-Finder (`eco-chef-regional-map`):** Entdecke regionale Wochenmärkte, Hofläden & Unverpackt-Geschäfte in deiner Nähe inkl. Öffnungszeiten, Entfernung und Direktübernahme von Markt-Spezialitäten auf deine Einkaufsliste.
- 💰 **Monatsbudget-Tracker & Spar-Kalkulator:** Lelege dein monatliches Lebensmittelbudget fest, verfolge deine Ausgaben und berechne deine Ersparnis durch Resteverwertung.
- 🚨 **MHD Ablauf-Erinnerungen & Warn-Banner:** Automatische Warnung auf dem Startbildschirm bei Zutaten mit Ablaufdatum in $\le 2$ Tagen inkl. 1-Klick-Rezeptverkochen.
- 📸 **Kühlschrank- & Kassenzettel-Scan:** Scanne deine Einkäufe oder deinen Kühlschrank per Kamera/Upload.
- 🍽️ **Dynamische Portionsskalierung:** Skaliere Mengenangaben & Nährwerte in Rezepten interaktiv von 1 bis 12 Personen in Echtzeit.
- 🛒 **Einkaufsliste ➔ Vorratskammer Übernahme:** Umschalten abgehakter Einkaufsartikel mit einem Klick in die Reste-Kammer mit automatischer Haltbarkeitsberechnung.
- ⏱️ **Kochmodus mit Sprachsteuerung & Custom-Timern:** Freihändiges Navigieren per Sprachbefehl, automatische Schritt-Timer sowie manuelle Schnell-Timer.
- 📦 **Vollständiges System-Backup (JSON):** Exportiere & Importiere dein gesamtes EcoChef-Profil (Rezepte, Vorratskammer, Einkäufe, Statistiken & Erfolge).
- 🏆 **Gamification & Umwelt-Tracking:** Erfolge freischalten (Retter-König, Klimaschützer, MHD-Retter) und CO₂-Ersparnis visualisieren.
- 👁️ **Barrierefreiheit (WCAG compliant & LRS-Modus):** OpenDyslexic-Schriftart, verschiebbares Leselineal, stufenlose Schriftvergrößerung, TalkBack / VoiceOver Support.

---

## 🚀 Quickstart & Befehle

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Entwicklungsserver starten
```bash
npm run dev
```
Rufe anschließend `http://localhost:4444` im Browser auf.

### 3. Tests ausführen
```bash
npm test
```

### 4. Production Web-Build
```bash
npm run build
```

### 5. Android APK bauen (Cordova)
```bash
cordova platform add android
npm run build
cordova run android
```

---

## ⚙️ Projektstruktur

```
EcoChef/
├── ui-src/                     # TypeScript Quellcode (Lit Web Components)
│   ├── eco-chef.ts             # Zentraler Controller & App-State
│   ├── components/             # Modulare UI-Komponenten
│   │   ├── eco-chef-recipe-view.ts       # Rezeptansicht & Portionsskalierer
│   │   ├── eco-chef-cooking-mode.ts      # Kochmodus & Sprachsteuerung/Timer
│   │   ├── eco-chef-pantry.ts            # Vorratskammer & EAN Barcode / Bon-Scan
│   │   ├── eco-chef-regional-map.ts      # Regio-Markt & Unverpackt Finder
│   │   ├── eco-chef-shopping-list.ts     # Einkaufsliste & Budget-Tracker
│   │   ├── eco-chef-settings.ts          # Setup, Budget & Voll-Backup
│   │   ├── eco-chef-meal-planner.ts      # Wochenplaner
│   │   └── eco-chef-achievements.ts     # Erfolge & SVG-Charts
│   ├── services/               # Gemini API, Barcode, QR, Storage, Speech Services
│   ├── models/                 # TypeScript Interfaces
│   └── styles/                 # Design System & CSS Tokens
├── BENUTZERANLEITUNG.md        # Ausführliche Anleitung für Anwender
├── FACHLICHE_DOKUMENTATION.md  # Architektur- & Entwickler-Dokumentation
└── webpack.config.js           # Webpack Bündelungs-Konfiguration
```

---

## 📄 Lizenz & Autor
- **Autor:** Max Schenk
- **Lizenz:** Apache-2.0
