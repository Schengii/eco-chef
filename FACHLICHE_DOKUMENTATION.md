# EcoChef – Fachliche & Technische Dokumentation ⚙️

Dieses Dokument bietet eine Übersicht über die technische Architektur, den Code-Aufbau, die Kommunikationsflüsse, Datenstrukturen und die Einbindung der Künstlichen Intelligenz (KI) in der **EcoChef** App.

---

## 1. Architektur und Code-Aufbau

EcoChef ist als **Hybrid-App** konzipiert. Sie verwendet Standard-Webtechnologien für die Logik und Benutzeroberfläche und wird mithilfe von **Apache Cordova** in eine native Android-App verpackt.

### Technologieschnittstellen
1. **Frontend-Framework:** [Lit (LitElement)](https://lit.dev/) zur Erstellung leichtgewichtiger, wiederverwendbarer Web Components mit reaktivem State-Management.
2. **Programmiersprache:** TypeScript zur Erhöhung der Typsicherheit und Code-Qualität.
3. **Build-Tool:** Webpack bündelt TypeScript, Stylesheets und HTML aus dem Quellordner (`ui-src/`) in den Ausgabeordner (`www/`).
4. **Hybrid-Wrapper:** Apache Cordova verpackt den `www/`-Ordner in ein natives Android-Projekt (`platforms/android/`) und bietet Zugriff auf native Hardware-Schnittstellen (Kamera).

### Verzeichnisstruktur
* `/ui-src/` – Quellcode der Webanwendung.
  * `index.html` – Einstiegspunkt, lädt Cordova und die gebündelten Web Components.
  * `index.ts` – Importiert und initialisiert die App.
  * `eco-chef.ts` – Hauptkomponente (Parent Component), fungiert als zentraler Controller/State Manager.
  * `/components/` – Modulare UI-Komponenten (Welcome, Settings, Recipe View, Cooking Mode, etc.).
  * `/services/` – Geschäftslogik und API-Dienste (Audio, Speech, Storage, Gemini).
  * `/styles/` – Gemeinsames CSS-Design-System (`eco-chef.styles.ts`).
  * `/models/` – TypeScript-Interfaces (`eco-chef.models.ts`).
* `/www/` – Distribuierbarer Build-Ordner (wird von Cordova in die APK verpackt).
* `/platforms/android/` – Generierter nativer Android-Code für Gradle.
* `config.xml` – Zentrale Cordova-Konfigurationsdatei (Paket-ID, Name, Plugin-Deklarationen).

---

## 2. Kommunikation: Wer kommuniziert mit wem?

Die Anwendung folgt dem Prinzip **„Data down, Events up“**.

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
   Die Hauptkomponente `eco-chef.ts` hält den Anwendungszustand (z. B. `recipe`, `ingredients`, `shoppingList`, `isDarkMode`) und reicht diese Daten als Properties (`.property`) an die Subkomponenten weiter (z. B. `<eco-chef-recipe-view .recipe="${this.recipe}">`).

2. **Child-to-Parent (Events nach oben):**
   Aktionen in Subkomponenten (z. B. Klick auf „Kochmodus starten“ in `recipe-view` oder Umschalten der Lesehilfe in `settings`) senden standardisierte **Custom Events** nach oben (z. B. `this.dispatchEvent(new CustomEvent('start-cooking'))`).
   Die Hauptkomponente fängt diese Events ab, aktualisiert den State und veranlasst das Neu-Rendern der UI.

3. **Services (Hilfsdienste):**
   Services sind zustandslose Singleton-Klassen/Objekte, die von der Hauptkomponente aufgerufen werden, um Daten zu laden/speichern (`StorageService`), Text vorzulesen (`SpeechService`), Alarme abzuspielen (`AudioService`) oder die KI anzufragen (`GeminiService`).

---

## 3. Schlüssel und Datenspeicher: Welcher Schlüssel ist wofür?

### A. API-Schlüssel
* **`GEMINI_API_KEY`** (in `ui-src/api-config.ts`):
  Der Authentifizierungsschlüssel für die Google Gen AI API. Ermöglicht der Anwendung die Autorisierung und Nutzung der Gemini- und Imagen-Modelle.

### B. LocalStorage-Schlüssel (StorageService)
Die App speichert alle Einstellungen und Daten lokal auf dem Smartphone. Folgende Schlüssel werden verwendet:

| Schlüssel | Datentyp | Zweck |
| :--- | :--- | :--- |
| `ecoChef_gdprConsent` | `string` (`'true'`/`'false'`) | Speichert, ob der Nutzer der Datenschutzerklärung (DSGVO) zugestimmt hat. |
| `ecoChef_theme` | `string` (`'dark'`/`'light'`) | Speichert das gewählte Design-Farbschema. |
| `ecoChef_lrsMode` | `string` (`'true'`/`'false'`) | Aktiviert/Deaktiviert die Lese-Rechtschreib-Schreibhilfe (Dyslexie-Modus). |
| `ecoChef_fontScale` | `string` (Zahl z.B. `'1.2'`) | Skalierungsfaktor für die Textgröße in der App. |
| `ecoChef_showRuler` | `string` (`'true'`/`'false'`) | Steuert, ob das verschiebbare Leselineal angezeigt wird. |
| `ecoChef_pantry` | `JSON-String` (Objekt) | Vorhandene Grundzutaten in der Vorratskammer (z.B. Salz, Pfeffer, Öl). |
| `ecoChef_shoppingList` | `JSON-String` (Array) | Alle Artikel auf der Einkaufsliste inklusive Status (erledigt/offen). |
| `ecoChef_allergens` | `JSON-String` (Objekt) | Liste der aktiven Allergene, die im Rezept ausgeschlossen werden müssen. |
| `ecoChef_stats` | `JSON-String` (Objekt) | Ernährungstagebuch (Kalorien, Proteine, CO2-Einsparung) gruppiert nach Datum. |
| `ecoChef_ingredientChips` | `JSON-String` (Array) | Die aktuell eingetippten Zutaten auf der Hauptseite. |
| `ecoChef_urgentIngredients` | `JSON-String` (Objekt) | Zutaten, die als „dringend zu verbrauchen“ markiert sind. |
| `ecoChef_savedRecipes` | `JSON-String` (Array) | Sammlung der vom Benutzer permanent gespeicherten Rezepte inkl. Bewertung. |
| `ecoChef_calorieGoal` | `string` (Zahl) | Tägliches Ziel für die Kalorienzufuhr. |
| `ecoChef_proteinGoal` | `string` (Zahl) | Tägliches Ziel für die Proteinzufuhr. |

---

## 4. KI-Einbindung: Wie wird die KI genutzt?

Die App nutzt die offizielle Google Gen AI SDK (`@google/genai`) zur Kommunikation mit den Google Vertex/Gemini APIs.

### A. Rezeptgenerierung
* **Modell:** `gemini-flash-latest` (optimiert für schnelle, kostengünstige und strukturierte Antworten).
* **Funktionsweise:**
  Die App sendet einen kombinierten Multimodal-Prompt. Dieser enthält:
  1. Die Zutatenliste als Text.
  2. Falls vorhanden, das Kühlschrankfoto als Base64-kodierte Bilddaten (`inlineData`).
  3. Die Vorratskammer-Basiszutaten (um unnötige Einkäufe zu vermeiden).
  4. Die Allergen-Filter (um unverträgliche Zutaten explizit auszuschließen).
  5. Ernährungsweise (vegetarisch/vegan), Portionsgrößen und Zubereitungszeit.
* **Strukturierte Ausgabe:**
  Der System-Prompt zwingt Gemini über eine strikte Anweisung, **ausschließlich ein valides JSON-Objekt** zurückzugeben. Dieses JSON wird im Frontend geparst und direkt in die Lit-Komponenten gerendert.

### B. Rezeptbild-Generierung
* **Modell:** `imagen-4.0-generate-001`
* **Funktionsweise:**
  Sobald das Rezept generiert wurde, fragt die App Imagen mit dem Rezepttitel an (z. B. *"A beautiful, clean food photography of Pasta mit Tomatensauce..."*).
* **Fallback-Strategie:**
  Schlägt die Bildgenerierung fehl (z. B. durch API-Limits), bittet die App Gemini kurz darum, den deutschen Rezepttitel in 1–3 englische Suchbegriffe zu übersetzen. Daraus wird eine Bild-URL des öffentlichen Dienstes `loremflickr.com` generiert (z. B. `https://loremflickr.com/600/400/food,pasta,tomato/all`), um dem Nutzer in jedem Fall ein Bild anzuzeigen.

---

## 5. Eigenleistung im Projekt

Im Rahmen des Projekts wurden folgende Kernbereiche eigenständig konzipiert und implementiert:

1. **Modulare Web-Component-Architektur:** 
   Strukturierung der App als Single Page Application (SPA) auf Basis von Lit. Aufteilung der App in 9 spezialisierte Unterkomponenten für hohe Wartbarkeit und Wiederverwendbarkeit.
2. **Datenpersistenz:** 
   Implementierung des `StorageService` zur lokalen Datenhaltung, wodurch die App auch offline (ohne Internetverbindung) voll funktionsfähig bleibt (außer bei der Rezeptgenerierung).
3. **Kamera-Integration (Hybrid/Web Hybrid):** 
   Integration der nativen Gerätekamera über das `cordova-plugin-camera` mit einem automatischen Fallback auf die Web-Kamera-API (`navigator.mediaDevices.getUserMedia`) bei Ausführung in einem Standardbrowser.
4. **Sprachsteuerung & Barrierefreiheit (Voice Assistant):** 
   Implementierung einer Sprachsteuerung mit der Web Speech API (`SpeechRecognition` / `SpeechSynthesis`). Die App kann Sprachbefehle auf Deutsch verarbeiten, um freihändig zu navigieren, und liest Schritte laut vor.
5. **Erweiterte Lesehilfen:** 
   Entwicklung des LRS-Modus (Dyslexie-Schriftart, modifizierte Zeilenabstände) sowie eines per Drag-&-Drop verschiebbaren Leselineals (`reading-ruler`) zur Unterstützung sehbehinderter oder lesebeeinträchtigter Nutzer.
6. **Nachhaltigkeits- und Ernährungstracker:** 
   Einbindung eines Tracking-Systems für verbrauchte Kalorien/Proteine sowie Berechnung einer CO2-Ersparnis-Bilanz.
7. **Premium-UI/UX (Styling & Animationen):** 
   Erstellung eines HSL-basierten, barrierefreien CSS-Designsystems mit flüssigen Übergängen, ansprechendem Dark-Mode und Mikro-Animationen (z. B. pulsierender Mikrofon-Status, schwebende Icons).
8. **Erweiterungen & Qualitätssicherung:**
   - **Dynamische Portionsrekonstruktion:** Mathematisches Skalieren von Rezeptmengen und Nährwertparametern in Echtzeit.
   - **Shopping ➔ Pantry Überführung:** Nahtloses Übertragen abgehakter Einkaufslisten-Objekte in den erweiterten Vorratsspeicher (`PantryItemAdvanced`).
   - **OpenFoodFacts Barcode API (`BarcodeService`):** EAN-13 Produktabfrage zur automatischen Erfassung von Marken, Produkttiteln und Nutri-Scores (A-E).
   - **Vektor QR-Code Sharing (`QrService`):** Vektor-basierte QR-Code Generierung zur Rezeptübertragung ohne externe Bibliotheken.
   - **Regio-Markt Finder (`eco-chef-regional-map`):** Interaktive Web-Komponente für Wochenmärkte, Hofläden und Unverpackt-Geschäfte.
   - **Budget & MHD-Ablauf-Tracking:** Visualisierung von Monatsbudgets, Spar-Kalkulation und automatischen MHD-Warnbannern ($\le 2$ Tage).
   - **Lokales Datums-Handling (`getLocalDateString`):** Behebung von Zeitzonen-Offsets bei der Datumsgenerierung (`toISOString`).
   - **Vollständiges Datensicherungs-System:** JSON-basiertes Komplett-Backup und Restore von Einstellungen, Rezepten, Vorräten und Erfolgen.
   - **Automatisierte Unit-Test-Abdeckung:** Erweiterte Jest-Testsuite (`storage.service.spec.ts`, `barcode.service.spec.ts`, `qr.service.spec.ts`, `audio.service.spec.ts`, `pdf.service.spec.ts`, `dashboard.service.spec.ts`) mit 22 automatisierten Tests und 100 % Erfolgsquote.
   - **Nährwert- & Klimaschutz-Analytics (`eco-chef-dashboard`):** Eigenständige Dashboard-Komponente zur Visualisierung von Makronährstoffzielen, Umwelt-Meilensteinen (Autofahrten, Bäume, Handy-Ladungen) und 7-Tage-Historien.
   - **Globales Floating-Timer-Widget:** Permanenter, schwebender Countdown mit Pausierungs- und Schnellverlängerungs-Funktionalität.
   - **"Mystery Box" Restekiste:** Algorithmus zur automatischen Selektion der am schnellsten ablaufenden Zutaten für 15-Minuten-Express-Rezepte.
   - **Synthetisierte Web-Audio-Soundeffekte (`audio.service`):** Oszillator-basierte Akustiksignale für Erfolge, Timer und Zutateneingaben ohne externe Audio-Assets.

