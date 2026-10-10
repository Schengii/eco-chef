# Mitwirken an EcoChef (Contributing Guide)

Vielen Dank für dein Interesse, EcoChef besser und nachhaltiger zu machen! 🌱

Dieses Dokument beschreibt Best Practices für menschliche Entwickler sowie für KI-Assistenten (wie Claude Code oder Antigravity), um effizient und fehlerfrei zusammenzuarbeiten.

---

## 1. Entwicklungsumgebung & Setup

### Voraussetzungen
- Node.js Version 20+ (Empfohlen: Node 22 LTS)
- npm Version 10+
- Ein gültiger Google Gemini API Key (kostenlos unter [Google AI Studio](https://aistudio.google.com/app/apikey))

### Schnelleinrichtung
```bash
# 1. Repository klonen & Dependencies installieren
git clone https://github.com/<user>/eco-chef.git
npm ci

# 2. Umgebungsvariablen konfigurieren
cp .env.example .env
# Trage deinen GEMINI_API_KEY in .env ein

# 3. Lokalen Entwicklungsserver starten
npm run dev
# App erreichbar unter http://localhost:4444
```

---

## 2. Git & Branching-Workflow

1. **Hauptbranch:** `master` ist geschützt und repräsentiert den produktiven Zustand.
2. **Feature-Branches:** Erstelle Branches nach dem Schema:
   - `feature/name-des-features` (z.B. `feature/i18n-support`)
   - `fix/beschreibung-des-bugs` (z.B. `fix/pantry-mhd-calculation`)
   - `docs/beschreibung` (z.B. `docs/update-changelog`)
3. **Commit-Konventionen (Conventional Commits):**
   - `feat: Neue Funktion hinzugefügt`
   - `fix: Fehler im Modul X behoben`
   - `docs: Dokumentation oder CHANGELOG aktualisiert`
   - `refactor: Code umstrukturiert ohne Verhaltensänderung`
   - `test: Neue Tests hinzugefügt oder aktualisiert`
   - `chore: Build-Skripte oder Abhängigkeiten aktualisiert`

---

## 3. Qualitätssicherung & Pre-Commit Schutz

Vor jedem Commit oder PR müssen folgende Befehle erfolgreich durchlaufen (der integrierte Pre-Commit Hook prüft automatisch vor jedem `git commit` auf versehentliche Secrets):

```bash
# 0. Secret- & .env-Scan (wird auch automatisch vom Git Hook ausgeführt)
npm run check:secrets

# 1. Strikte Typprüfung für Frontend & Vercel API
npm run type-check

# 2. Unit-Tests mit Coverage-Prüfung
npm run test:coverage

# 3. Production-Build verifizieren
npm run build

# 4. Optional: E2E-Smoke-Tests (Playwright)
npm run e2e
```

---

## 4. Zusammenarbeit mit Claude & KI-Tools

- **Projektkontext:** Claude liest primär [CLAUDE.md](file:///c:/Users/sche-/Desktop/Programmieren%20Projekte/EcoChef/CLAUDE.md) als Wissensbasis.
- **Ausschlüsse:** Große Build-Ordner und sensitive Dateien sind in [.claudeignore](file:///c:/Users/sche-/Desktop/Programmieren%20Projekte/EcoChef/.claudeignore) definiert.
- **Secrets:** Niemals API-Keys in Prompts, Markdown-Dateien oder Commits einbetten. Verwende immer `.env` oder Umgebungsvariablen in Vercel.
- **Changelog:** Bei neuen Features oder Bugfixes den Eintrag in [CHANGELOG.md](file:///c:/Users/sche-/Desktop/Programmieren%20Projekte/EcoChef/CHANGELOG.md) unter `[Unreleased]` ergänzen.

---

## 5. Vercel & Deployment-Workflow

- **Preview Deployments:** Jeder Pull Request auf GitHub erzeugt automatisch ein isoliertes Preview-Deployment auf Vercel.
- **Produktion:** Merges in `master` deployen automatisch auf die Produktionsumgebung.
- **Umgebungsvariablen auf Vercel:**
  - `GEMINI_API_KEY`: Erforderlich im Vercel Dashboard für die Serverless Function `/api/gemini`.
  - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Optional für verteiltes Rate-Limiting.
- **Vercel Ignore:** [.vercelignore](file:///c:/Users/sche-/Desktop/Programmieren%20Projekte/EcoChef/.vercelignore) stellt sicher, dass Cordova-spezifische Ordner und Testdateien die Bereitstellung nicht verlangsamen.
