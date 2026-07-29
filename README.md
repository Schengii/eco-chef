# EcoChef 🧑‍🍳 - Dein intelligenter KI-Rezept-Zauberer

**EcoChef** ist eine moderne, nachhaltige Hybrid-Web- & Mobile-App, die aus deinen vorhandenen Kühlschrankzutaten kreative, klimaschonende und leckere Gerichte zaubert. Mit Fokus auf Resteverwertung, Barrierefreiheit (LRS-Modus, Leselineal, Screenreader), Sprachsteuerung und umfassendem Ernährungs- sowie CO₂-Tracking.

---

## 🌟 Kernfunktionen & Neuerungen

- 🪄 **KI-Rezept-Zauberer (Google Gemini 2.5/Flash & Imagen):** Generierung maßgeschneiderter Rezepte inkl. Nährwerten, Eco-Score, Wein-/Getränkeempfehlung & Gerichtsfoto.
- 📸 **Kühlschrank- & Kassenzettel-Scan:** Scanne deine Einkäufe oder deinen Kühlschrank per Kamera/Upload. Produkte und Mindesthaltbarkeitsdaten (MHD) werden automatisch erkannt.
- 🍽️ **Dynamische Portionsskalierung:** Skaliere Mengenangaben & Nährwerte in Rezepten interaktiv von 1 bis 12 Personen in Echtzeit.
- 🛒 **Einkaufsliste ➔ Vorratskammer Übernahme:** Umschalten abgehakter Einkaufsartikel mit einem Klick in die Reste-Kammer mit automatischer Haltbarkeitsberechnung.
- ⏱️ **Kochmodus mit Sprachsteuerung & Custom-Timern:** Freihändiges Navigieren per Sprachbefehl, automatische Schritt-Timer sowie manuelle Schnell-Timer (+1 Min, +5 Min, +10 Min, Eigener Timer).
- 📦 **Vollständiges System-Backup (JSON):** Exportiere & Importiere dein gesamtes EcoChef-Profil (Rezepte, Vorratskammer, Einkäufe, Statistiken & Erfolge).
- 📅 **AI-Wochenplaner & Meal Prep:** Erstellung automatisierter Speisepläne optimiert für Batch Cooking / Resteverwertung.
- 🏆 **Gamification & Umwelt-Tracking:** Erfolge freischalten (Retter-König, Klimaschützer, MHD-Retter) und CO₂-Ersparnis visualisieren.
- 👁️ **Barrierefreiheit (WCAG & LRS):** OpenDyslexic-Schriftart, verschiebbares Leselineal, stufenlose Schriftvergrößerung, TalkBack / VoiceOver Support.

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
│   │   ├── eco-chef-pantry.ts            # Vorratskammer & Kassenzettel-Scan
│   │   ├── eco-chef-shopping-list.ts     # Einkaufsliste & Übernahme
│   │   ├── eco-chef-settings.ts          # Setup & System-Backup
│   │   ├── eco-chef-meal-planner.ts      # Wochenplaner
│   │   └── eco-chef-achievements.ts     # Erfolge & SVG-Charts
│   ├── services/               # Gemini API, Storage, Speech, Audio Services
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
