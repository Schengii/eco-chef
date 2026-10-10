# Sicherheitsrichtlinie (Security Policy)

Die Sicherheit von EcoChef und der Schutz von Nutzerdaten haben höchste Priorität.

---

## Unterstützte Versionen

| Version | Unterstützt |
| :--- | :--- |
| 1.0.x | :white_check_mark: |
| < 1.0 | :x: |

---

## Sicherheitsarchitektur von EcoChef

1. **Clientseitige E2E-Verschlüsselung:**
   - Haushaltsdaten (Vorratsliste, Einkaufszettel) werden clientseitig mit AES-GCM (256-Bit) verschlüsselt.
   - Der Sync-Code (80-Bit CSPRNG) dient als Ableitungsschlüssel.
   - Es werden keine unverschlüsselten Haushaltsdaten an externe Server übertragen.

2. **API-Schutz & Secrets:**
   - Der Google Gemini API Key darf niemals clientseitig im Code hartkodiert oder in Git eingecheckt werden.
   - Für Web/PWA-Bereitstellungen auf Vercel werden KI-Anfragen über die Serverless Function `/api/gemini` mit Validierung, CORS-Allowlist und Rate-Limiting geschleust.
   - In Mobile Builds (Cordova) wird der Schlüssel zur Build-Zeit via `api-config.ts` aus Umgebungsvariablen injiziert.

3. **Prompt-Injection-Schutz:**
   - Sämtliche Nutzerdaten (Zutaten, Vorräte, Notizen) werden in XML-Tags (`<nutzerdaten>`) gekapselt und vor der Weitergabe an das GenAI-Modell bereinigt (`prompt-safety.ts`).

---

## Melden einer Sicherheitslücke

Solltest du eine Sicherheitslücke oder ein Datenleck entdecken:

1. **Nicht öffentlich melden:** Bitte erstelle **kein** öffentliches GitHub Issue für Sicherheitslücken.
2. **Private Meldung:** Kontaktiere das Entwickler-Team über die GitHub Security Advisory-Funktion („Report a vulnerability“) im Repository.
3. **Inhalt der Meldung:**
   - Beschreibung des Problems und der potenziellen Auswirkung
   - Schritt-für-Schritt-Anleitung zur Reproduktion (Proof of Concept)
   - Betroffene Komponenten oder Endpunkte
4. **Reaktionszeit:** Wir bemühen uns, innerhalb von 48 Stunden auf Sicherheitsberichte zu reagieren und zeitnah Patches bereitzustellen.
