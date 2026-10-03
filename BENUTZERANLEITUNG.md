# EcoChef – Benutzeranleitung 🧑‍🍳

Willkommen bei **EcoChef**, deinem intelligenten KI-Rezept-Zauberer! Mit dieser App kannst du aus den Zutaten, die du bereits zu Hause hast, kreative, nachhaltige und leckere Gerichte zaubern.

Diese Anleitung führt dich Schritt für Schritt durch alle Funktionen der Anwendung.

---

## Inhaltsverzeichnis
1. [Plattformen & Systemvoraussetzungen](#1-plattformen--systemvoraussetzungen)
2. [Erster Start & Einstellungen](#2-erster-start--einstellungen)
3. [Zutaten eingeben & Kühlschrank-Scan](#3-zutaten-eingeben--kühlschrank-scan)
4. [Rezept-Generierung & Details](#4-rezept-generierung--details)
5. [Interaktiver Kochmodus & Sprachsteuerung](#5-interaktiver-kochmodus--sprachsteuerung)
6. [Einkaufsliste & Reste-Kammer](#6-einkaufsliste--reste-kammer)
7. [Meine Rezepte & System-Backups](#7-meine-rezepte--system-backups)
8. [Barcode-Scanner & Regio-Markt Finder](#8-barcode-scanner--regio-markt-finder)
9. [Barrierefreiheit & Lesehilfen](#9-barrierefreiheit--lesehilfen)
10. [Neue Zusatz-Features](#10-neue-zusatz-features)

---

## 1. Plattformen & Systemvoraussetzungen

EcoChef ist auf drei Wegen nutzbar:

| Plattform | URL / Installation | Besonderheiten |
|---|---|---|
| **Web-App (PWA)** | https://eco-chef-theta.vercel.app | Läuft im Browser, installierbar als PWA (Chrome → „Zum Startbildschirm hinzufügen") |
| **Android-App** | APK via `npx cordova build android` | Kamera-Zugriff über native Cordova-API |
| **iOS-App** | Xcode-Build auf macOS erforderlich | WKWebView, Inline-Medienwiedergabe |

> **Für Endnutzer:** Öffne einfach https://eco-chef-theta.vercel.app in deinem Smartphone-Browser und füge die Seite als App zum Startbildschirm hinzu – kein App-Store nötig.

**Gemini API-Key konfigurieren:**
Beim ersten Start ohne hinterlegten API-Key erscheint automatisch ein Hinweis. Gehe zu **⚙️ Einstellungen** und trage dort deinen [Gemini API-Key](https://aistudio.google.com/apikey) ein. Ohne API-Key oder Vercel-Proxy ist keine KI-Funktion verfügbar.

---

## 2. Erster Start & Einstellungen

Beim ersten Start der App wirst du vom **Willkommensbildschirm** begrüßt:
* **Datenschutz-Einwilligung (DSGVO):** Lies die Datenschutzerklärung und tippe auf **Zustimmen**, um fortzufahren.
* **Küche betreten:** Klicke auf den großen Button, um zur Hauptoberfläche zu gelangen.
* **Globale Menüs (oben rechts):**
  * **📚 Meine Rezepte:** Zeigt deine gespeicherte Rezeptsammlung.
  * **🛒 Einkaufsliste:** Öffnet deine Einkaufsliste.
  * **⚙️ Einstellungen:** Hier kannst du deine Vorratskammer pflegen, Allergene ausschließen, Tages-Ernährungsziele festlegen und deinen API-Key hinterlegen.

---

## 3. Zutaten eingeben & Kühlschrank-Scan

Du hast verschiedene Möglichkeiten, der KI mitzuteilen, welche Zutaten du verwenden möchtest:

### A. Text-Eingabe
Tippe den Namen einer Zutat in das Suchfeld ein und drücke **Enter** (oder trenne Zutaten mit einem Komma). Jede Zutat wird als „Chip" unter dem Feld angezeigt.

### B. Kühlschrank-Scan via Foto 📸
1. Tippe auf das **Kamera-Symbol 📸** rechts neben dem Eingabefeld.
2. Mache ein Foto von deinen Zutaten oder deinem geöffneten Kühlschrank.
3. Die KI analysiert das Foto und erkennt automatisch alle sichtbaren Zutaten.

> **Hinweis (Android):** Die App verwendet die native Gerätekamera über Cordova. Im Browser wird stattdessen die Web-Kamera-API genutzt.

### C. Resteverwerter-Modus (Dringend verbrauchen) 🚨
Hast du Zutaten, die bald ablaufen?
* Klicke bei einem Zutaten-Chip auf das **Warnsymbol (⚠️/🚨)**.
* Der Chip färbt sich rot – dies signalisiert der KI, dass diese Zutat **zwingend** im Rezept verwendet werden muss, um Lebensmittelverschwendung zu vermeiden.

---

## 4. Rezept-Generierung & Details

Bevor du auf **✨ Rezept Zaubern** klickst, kannst du die Generierung anpassen:
* **KI-Unterstützung:**
  * *🪄 KI darf Zutaten ergänzen (Standard):* Die KI fügt fehlende Kleinigkeiten hinzu.
  * *🛑 Streng (NUR meine Zutaten):* Die KI nutzt ausschließlich deine eingegebenen Zutaten sowie Wasser, Salz, Pfeffer und Öl.
* **Portionen:** Stelle mit den Plus- und Minus-Tasten die Personenanzahl (1–12) ein.
* **Ernährungsweise:** Wähle zwischen *Alles*, *Vegetarisch* oder *Vegan*.
* **Zeitaufwand:** Wähle *Egal*, *Schnell* (unter 25 Min.) oder *Aufwendig*.

Nach dem Klick auf **✨ Rezept Zaubern** erstellt Gemini 2.5 Flash ein maßgeschneidertes Rezept inklusive:
* **Nachhaltigkeits-Bewertung (Eco-Score):** Bewertung mit Blättern (🍃) und Erklärung.
* **Nährwertangaben & CO₂-Ersparnis:** Übersicht der Kalorien, Proteine, Kohlenhydrate, Fette sowie der geschätzten CO₂-Ersparnis gegenüber einem Fleischgericht.
* **Getränkeempfehlung & Aufbewahrungstipp:** Vorschläge für passende Getränke und Lagerungshinweise.
* **Dynamische Portionsskalierung (1–12 Personen):** Verändere direkt in der Rezeptansicht die Personenanzahl – alle Mengenangaben und Nährwerte werden in Echtzeit umgerechnet.

---

## 5. Interaktiver Kochmodus & Sprachsteuerung

Klicke im Rezept auf **Kochmodus starten**, um eine ablenkungsfreie Schritt-für-Schritt-Ansicht zu öffnen.

* **💡 Dauerhaft aktiver Bildschirm (Screen Wake Lock):** Während du im Kochmodus bist, verhindert die App automatisch, dass sich der Bildschirm deines Smartphones oder Tablets ausschaltet oder abdunkelt. So musst du das Display nicht mit mehligen oder nassen Händen berühren.
* **📳 Haptisches Feedback:** Bei Schrittwechseln, beim Starten von Schnell-Timern sowie beim Ablauf eines Timers gibt dein Smartphone sanftes Vibrations-Feedback.

### A. Der automatische & manuelle Timer ⏱️
Enthält ein Kochschritt eine Zeitangabe (z. B. „15 Minuten köcheln lassen"), erkennt die App dies automatisch.
* Tippe auf **Timer starten**, um den Countdown zu aktivieren.
* **Manuelle Schnell-Timer:** Über die Schnell-Buttons (+1 Min, +5 Min, +10 Min, Eigener Timer) kannst du jederzeit zusätzliche Timer starten.
* Sobald die Zeit abgelaufen ist, vibriert dein Handy und ein Alarmton ertönt.

### B. Sprachsteuerung (Freihändig kochen) 🎙️
1. Tippe im Kochmodus auf das **Mikrofon-Symbol**.
2. Erlaube der App den Mikrofonzugriff.
3. Sprich einen der folgenden Befehle deutlich auf Deutsch:
   * **„weiter"** oder **„nächster"** – Wechselt zum nächsten Schritt und liest ihn vor.
   * **„zurück"** oder **„vorheriger"** – Geht einen Schritt zurück.
   * **„vorlesen"** oder **„lies vor"** – Liest den aktuellen Schritt noch einmal vor.
   * **„stopp"** oder **„anhalten"** – Stoppt die Sprachausgabe oder den Timer-Alarm.
   * **„hilfe"** – Listet alle Befehle per Sprachausgabe auf.

> **Hinweis:** Die Sprachsteuerung nutzt die Web Speech API mit integrierter Loop- und Verbindungs-Absicherung. Falls sie auf deinem Gerät nicht verfügbar ist, wird ein Hinweis angezeigt und die manuelle Navigation bleibt vollständig nutzbar.

---

## 6. Einkaufsliste & Reste-Kammer Übernahme

Fehlen dir Zutaten für ein Rezept?
* Klicke im Rezept bei der Zutat auf **Einkaufsliste**. Die Zutat wird automatisch hinzugefügt und nach Kategorien (z. B. *Obst & Gemüse*, *Milchprodukte*) sortiert.
* **Manuell hinzufügen:** Auf der Einkaufslisten-Seite kannst du Artikel auch manuell eingeben.
* **Teilen-Funktion 📤:** Klicke auf **Teilen**, um deine Einkaufsliste per WhatsApp, E-Mail oder SMS zu verschicken.
* **Übernahme in Reste-Kammer 🥫:** Wenn du vom Einkaufen zurückkommst, klicke auf **„Abgehakte in Reste-Kammer übernehmen"**. Alle gekauften Zutaten wandern in deine Vorratskammer mit geschätztem Haltbarkeitsdatum.

---

## 7. Meine Rezepte & System-Backups

Jedes generierte Rezept kann dauerhaft gesichert werden:
* **Speichern:** Klicke nach dem Kochen auf das Schließen-Symbol (X) und wähle **💾 Speichern**. Du kannst dem Gericht eine Sternebewertung (1–5 ⭐) geben.
* **Rezeptbuch öffnen:** Über **📚 Meine Rezepte** im Hauptmenü kannst du alle Kreationen durchsuchen, nach Bewertung filtern oder löschen.
* **Voll-Backup (JSON) 📦:** In den **Einstellungen** kannst du dein gesamtes EcoChef-Profil (Rezepte, Vorratskammer, Einkäufe, Statistiken & Erfolge) als JSON exportieren und auf anderen Geräten wiederherstellen.
* **QR-Code Teilen 📱:** Tippe beim Verlassen eines Rezeptes auf **„📱 QR-Code anzeigen"**, um einen standardkonformen Vektor-QR-Code (ISO/IEC 18004) zu generieren. Dieser kann direkt mit jeder Smartphone-Kamera-App (iOS & Android) oder einem QR-Scanner gelesen werden.
* **🔐 Ende-zu-Ende verschlüsselte Cloud-Synchronisation:** In den **Einstellungen** kannst du einen 6-stelligen Sync-Code generieren. Deine Daten werden lokal mit **AES-GCM 256-Bit** verschlüsselt und sicher in die Cloud synchronisiert, sodass du deine Rezepte und Vorratskammer nahtlos auf mehreren Geräten nutzen kannst.

---

## 8. Barcode-Scanner & Regio-Markt Finder

* **EAN-Barcode Scanner 🔍:** In der Vorratskammer kannst du den 8- bis 14-stelligen Barcode von Lebensmittelverpackungen eingeben. Die App fragt automatisch Produktdaten, Nutri-Score (A-E) und geschätzte Haltbarkeit von OpenFoodFacts ab.
* **Kassenzettel-Scan 🧾:** Fotografiere deinen Einkaufsbon – die KI extrahiert alle Lebensmittel automatisch mit Mengen und Lagerort.
* **Regio-Markt Finder 🌾:** Wechsel im Hauptmenü auf **Regio Markt**, um Wochenmärkte, Hofläden und Unverpackt-Geschäfte in deiner Nähe zu entdecken. Mit einem Klick kannst du Frische-Spezialitäten direkt auf deine Einkaufsliste setzen.
* **Monatsbudget & Spar-Calculator 💰:** Trage in den Einstellungen dein gewünschtes Lebensmittelbudget ein. Auf der Einkaufsliste siehst du deinen Budget-Fortschritt sowie deine Ersparnis durch das Verwenden ablaufender Reste.

---

## 9. Barrierefreiheit & Lesehilfen

EcoChef wurde im Hinblick auf Barrierefreiheit (WCAG compliant) entwickelt. In den **Einstellungen** findest du folgende Werkzeuge:

* **Schriftgröße anpassen:** Vergrößere oder verkleinere die App-Texte stufenlos (von 80 % bis 200 %).
* **LRS-Modus (Lesehilfe) 👁️:** Speziell für Menschen mit Lese-Rechtschreib-Schwäche. Aktiviert die Schriftart *OpenDyslexic* sowie größere Zeilen- und Wortabstände.
* **Mobiles Leselineal (Reading Ruler) ↔️:** Legt einen farbigen Fokusbalken über den Text. Du kannst das Lineal mit dem Finger verschieben, um beim Lesen nicht in den Zeilen zu verrutschen.
* **Screenreader-Kompatibilität:** Vollständige Unterstützung von Android TalkBack und iOS VoiceOver durch strukturierte ARIA-Attribute.

---

## 10. Neue Zusatz-Features

* **📊 Nährwert- & Klimaschutz-Analytics:** Der Tab **📊 Analytics** visualisiert deine tägliche Kalorien- und Proteinaufnahme sowie Umwelt-Meilensteine (Autofahrt-Kilometer, gepflanzte Bäume, Handy-Ladungen) und einen 7-Tage-Verlauf.
* **⏱️ Globaler Mini-Timer (Floating Widget):** Wenn ein Koch-Timer läuft und du den Kochmodus verlässt, erscheint unten rechts ein schwebendes Timer-Widget. Es zeigt den Live-Countdown und lässt dich pausieren, um +1 Min. verlängern oder in den Kochmodus zurückspringen.
* **🎲 „Mystery Box" Restekiste:** Ein Klick auf **🎲 Restekiste Zaubern** in der Reste-Kammer wählt automatisch die 3 am schnellsten ablaufenden Zutaten aus und startet sofort ein 15-Minuten-Express-Rezept.
* **🥫 Vorratskammer-Sortierung & Ampel-System:** Filter nach Lagerort (*Kühlschrank, Vorratskammer, Gefrierfach, 🚨 Bald ablaufend*) und automatische MHD-Ampeln (Rot = abgelaufen/heute, Orange = 1–3 Tage, Grün = haltbar).
* **🔊 Synthetisierte Web-Audio Soundeffekte:** Akustisches Feedback bei geschafften Erfolgen, hinzugefügten Zutaten und beendeten Timern (in den Einstellungen ein-/ausschaltbar).
* **📅 Wochenplaner:** Generiere automatisch einen personalisierten Speiseplan (Mo–So) basierend auf deinen Vorräten, Ernährungsweise und Zeitaufwand. Unterstützt auch Meal-Prep-Optimierung.
