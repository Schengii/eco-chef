# Umsetzungsplan EcoChef

## 1. Ist-Zustand
EcoChef ist eine hybride Cordova/Web-PWA auf Basis von Lit 3, TypeScript 5 (strict), Webpack 5 und Google GenAI.
Die Core-Workflows (KI-Rezepte via Gemini 3.5 Flash / Serverless-Proxy, Vorratskammer, E2E-Sync mit AES-GCM, Barcode-/Kamerascans, Timer, Sprachsteuerung) sind funktional implementiert und erreichen mit 37 Test-Suites (232 Tests) 87.6 % Statement- sowie 78.3 % Branch-Coverage.
TypeScript-Type-Check (`npm run type-check`), Jest-Tests (`npm test`) und Produktions-Build (`npm run build`) laufen fehlerfrei durch.
Refaktorisierungsbedarf besteht bei der Vereinheitlichung der Rezept-Speicherung (direktes Speichern im Recipe-View), der Header-Navigation (visueller Aktiv-Status), unvollständiger Testabdeckung in `camera.controller.ts` (0 %) und `calendar.service.ts` sowie der Optimierung von Barrierefreiheit und Service-Worker-Asset-Caching.

---

## 2. Maßnahmen

### Phase 1: Architektur, Datenintegrität & Kernfunktionen (P1)
- [x] P1-01 | Direkten Speichern-Button in Rezept-Detailansicht integrieren | P1 | M | ui-src/components/eco-chef-recipe-view.ts, ui-src/eco-chef.ts | ui-src/components/eco-chef-recipe-view.ts:308 | Fertig wenn: Rezeptansicht bietet Button "💾 Rezept speichern", löst Event aus und Rezept landet ohne Umweg über Verlassen-Dialog im Kochbuch
- [ ] P1-02 | IndexedDB-Restore in RecipeBookController beim Start integrieren | P1 | M | ui-src/controllers/recipe-book.controller.ts, ui-src/services/storage.service.ts | ui-src/services/storage.service.ts:236 | Fertig wenn: `RecipeBookController.load()` oder App-Start ruft `StorageService.restoreRecipesFromIndexedDb()` asynchron auf, falls LocalStorage leer oder korrupt ist
- [x] P1-03 | Aktiven Tab im Header visuell hervorheben (.saved-btn.active Style definieren) | P1 | S | ui-src/styles/eco-chef.styles.ts, ui-src/eco-chef.ts | ui-src/styles/eco-chef.styles.ts:371, ui-src/eco-chef.ts:817 | Fertig wenn: `.saved-btn.active` eine kontraststarke Hervorhebung (Hintergrund var(--primary), Schrift weiß, Border var(--primary-dark)) besitzt und der gewählte Tab sofort erkennbar ist
- [ ] P1-04 | Native Prompt-Eingabe im Kochmodus durch barrierefreies Inline-Modal ersetzen | P1 | M | ui-src/components/eco-chef-cooking-mode.ts | ui-src/components/eco-chef-cooking-mode.ts:298 | Fertig wenn: `_promptCustomTimer` kein natives blockierendes `window.prompt()` mehr nutzt, sondern ein formatiertes Dialog-Overlay mit Tastaturnavigation
- [ ] P1-05 | Service Worker Cache-Versionierung und Asset-Liste für Offline-Betrieb härten | P1 | M | ui-src/sw.js, ui-src/services/sw.service.ts | ui-src/sw.js:1 | Fertig wenn: Alle Webpack-generierten Kern-Chunks (inkl. dynamischer Lazy-Chunks) im Service Worker fehlerfrei offline verfügbar sind und Stale-Caches gelöscht werden

### Phase 2: Barrierefreiheit, Sicherheit & Codequalität (P2)
- [ ] P2-01 | ARIA-Attribute und Rollen in Einstellungen und Vorratskammer vervollständigen | P2 | S | ui-src/components/eco-chef-settings.ts, ui-src/components/eco-chef-pantry.ts | ui-src/components/eco-chef-settings.ts:452, ui-src/components/eco-chef-pantry.ts:60 | Fertig wenn: Alle Schalter und Checkboxen haben verknüpfte `<label>`-Elemente mit `for`/`id` und Screenreader kündigen Zustandsänderungen zuverlässig an
- [ ] P2-02 | CSP-Header in index.html auditieren und auf minimale Berechtigungen einschränken | P2 | M | ui-src/index.html | ui-src/index.html:12 | Fertig wenn: CSP erlaubt keine unnötigen Wildcards (z.B. `media-src *` auf verifizierte Quellen eingeschränkt) und alle externen Domains sind explizit dokumentiert
- [ ] P2-03 | Strikte Zod-Validierung für Kalender-Export und Tagesstatistiken ergänzen | P2 | M | ui-src/models/schemas.ts, ui-src/services/calendar.service.ts | ui-src/services/calendar.service.ts:32 | Fertig wenn: `MealPlan`-Objekte vor ICS-Generierung per Schema validiert werden und ungültige Datumsangaben abgefangen werden
- [ ] P2-04 | Logging in Production-Builds strikt über logger.ts kapseln | P2 | S | ui-src/controllers/camera.controller.ts, ui-src/components/eco-chef-cooking-mode.ts, ui-src/services/logger.ts | ui-src/controllers/camera.controller.ts:33, ui-src/services/logger.ts:1 | Fertig wenn: Rohe `console.warn` und `console.error` Aufrufe in Controllern/Komponenten durch `Logger` ersetzt sind und in Produktion keine sensiblen Stacktraces leaken
- [ ] P2-05 | Allergie- und Vorrats-Filterchips um Keyboard-Aktivierung (Enter/Space) erweitern | P2 | S | ui-src/components/eco-chef-settings.ts, ui-src/services/a11y.ts | ui-src/components/eco-chef-settings.ts:365, ui-src/components/eco-chef-settings.ts:384 | Fertig wenn: Alle Filter- und Vorrats-Items per Tab erreichbar sind und mit Space/Enter zuverlässig getoggelt werden können

### Phase 3: Tests, CI & Developer Experience (P2/P3)
- [ ] P3-01 | Unit-Tests für CameraController erstellen (100% Mock-Abdeckung für Cordova & Web) | P2 | M | ui-src/controllers/camera.controller.ts, ui-src/controllers/camera.controller.spec.ts | ui-src/controllers/camera.controller.ts:10 | Fertig wenn: Jest-Test-Suite für `CameraController` existiert und Coverage von 0 % auf über 85 % steigt
- [ ] P3-02 | Unit-Tests für AchievementsController erstellen | P2 | S | ui-src/controllers/achievements.controller.ts, ui-src/controllers/achievements.controller.spec.ts | ui-src/controllers/achievements.controller.ts:7 | Fertig wenn: `achievements.controller.spec.ts` vorhanden ist und alle Methoden (`increment`, `unlock`, `onRecipeCooked`) abgedeckt sind
- [ ] P3-03 | Unit-Tests für CalendarService Download-Logik ergänzen | P3 | S | ui-src/services/calendar.service.spec.ts, ui-src/services/calendar.service.ts | ui-src/services/calendar.service.ts:100 | Fertig wenn: `downloadIcsFile` für Erfolgs- und Fehlerfälle getestet ist und Branch-Coverage von `calendar.service.ts` > 80 % erreicht
- [ ] P3-04 | E2E-Test für vollständigen Kochmodus und Timer-Ablauf ergänzen | P3 | M | e2e/recipe-flow.e2e.ts | e2e/recipe-flow.e2e.ts:25 | Fertig wenn: Playwright-Test den Start des Kochmodus, Schrittwechsel und Timer-Start automatisiert verifiziert
- [ ] P3-05 | ESLint / Linter in Build-Toolchain und CI-Pipeline verankern | P3 | M | package.json, .github/workflows/ci.yml | package.json:6, .github/workflows/ci.yml:18 | Fertig wenn: `npm run lint` existiert, Code-Stil automatisiert prüft und im CI-Workflow vor `type-check` ausgeführt wird
- [ ] P3-06 | Bundle-Size-Budget und Monitoring in Webpack konfigurieren | P3 | S | webpack.config.js, package.json | webpack.config.js:25 | Fertig wenn: Webpack Performance-Hints bei Chunks > 350 KiB warnt und im CI-Lauf fehlschlägt, falls unbemerkt schwere Abhängigkeiten statisch importiert werden

---

## 3. Vorgehen je Phase

### Phase 1: Architektur, Datenintegrität & Kernfunktionen
1. **Reihenfolge**:
   1. P1-03: Styling für aktiven Tab-Button umsetzen, um Navigation sofort transparent zu machen.
   2. P1-01: Speichern-Button und direktes Event-Handling in `eco-chef-recipe-view.ts` einbauen.
   3. P1-02: Asynchrone Initialisierung von `restoreRecipesFromIndexedDb()` im Startup-Flow absichern.
   4. P1-04: Modalen Ersatz für `prompt()` im Kochmodus implementieren.
   5. P1-05: Service-Worker-Caching und Asset-Manifest für Offline-Nutzung nachschärfen.
2. **Test nach Phase 1**:
   - `npm run type-check`
   - `npm test`
   - Manueller Test: Rezept generieren, direkt speichern, in Kochbuch prüfen, Tabs durchklicken.
3. **Rollback**:
   - Git Revert des entsprechenden Feature-Commits (`git revert HEAD`). Keine Datenbank-Migrationen erforderlich (lokale Speicherdaten bleiben rückwärtskompatibel).

### Phase 2: Barrierefreiheit, Sicherheit & Codequalität
1. **Reihenfolge**:
   1. P2-01: Formular-Labels und ARIA-Zustände in Settings und Pantry überarbeiten.
   2. P2-05: Tastatur-Events (`onActivate`) auf allen benutzerdefinierten Schaltern sicherstellen.
   3. P2-02: Content-Security-Policy auditieren und Restriktionen härten.
   4. P2-03: Schemavalidierung in `calendar.service.ts` integrieren.
   5. P2-04: Konsolen-Ausgaben auf `logger.ts` vereinheitlichen.
2. **Test nach Phase 2**:
   - `npm run type-check`
   - `npm test`
   - Screenreader-Navigation (NVDA / Windows Narrator) und Tab-Navigation prüfen.
3. **Rollback**:
   - Isoliertes Revertieren der A11y-/Sicherheits-Patches per Git.

### Phase 3: Tests, CI & Developer Experience
1. **Reihenfolge**:
   1. P3-01 & P3-02: Controller-Unit-Tests (`camera.controller.spec.ts`, `achievements.controller.spec.ts`) schreiben.
   2. P3-03: Calendar-Service-Tests ausbauen.
   3. P3-04: Playwright-E2E-Flow erweitern.
   4. P3-05: Linting-Skript und CI-Step hinzufügen.
   5. P3-06: Webpack Performance-Budgets aktivieren.
2. **Test nach Phase 3**:
   - `npm run test:coverage` (Sicherstellen, dass Gesamtabdeckung > 85 % bleibt und Controller-Gaps geschlossen sind).
   - `npm run e2e` (Playwright-Suite komplett grün).
   - `npm run build` (Budget-Prüfung ohne Fehler).
3. **Rollback**:
   - CI-Konfiguration und Test-Specs können ohne Einfluss auf den Produktionscode zurückgesetzt werden.

---

## 4. Risiken und offene Fragen
- **Risiko: Asynchroner Startup-Lag durch IndexedDB**: Wenn `restoreRecipesFromIndexedDb()` beim Initialisieren der App aufgerufen wird, darf die UI nicht blockieren oder flackern. *Lösung*: Asynchrones Nachladen mit Fallback auf LocalStorage im Speicher-Controller.
- **Risiko: Playwright-Timing in E2E-Tests**: Kaltstart des Webpack-Dev-Servers oder simulierte AI-Delays können zu Timeouts führen. *Lösung*: Strikte Verwendung von Mock-Routen und resilienten `waitForSelector`-Assertions in `e2e/helpers.ts`.
- **Offene Frage**: Soll das Rezept nach dem direkten Speichern in der Detailansicht sofort visualisiert als "Gespeichert" markiert werden (z.B. Deaktivierung oder Beschriftungswechsel des Speicher-Buttons)?
- **Offene Frage**: Ist für zukünftige Releases eine PWA-Installation mit Web-Push-Notifications über den Service Worker geplant, oder bleibt Cordova der alleinige Benachrichtigungskanal auf Mobilgeräten?

---

## 5. Optional (Ideen ohne aktuellen Beleg im Code)
- Einführung von Vitest als schnellerer Ersatz für Jest (benötigt Migration der Konfiguration).
- Mehrsprachigkeit (i18n für Englisch) über ein JSON-Lokalisierungs-Plugin.
- OCR-Erkennung für handschriftliche Rezepte via Gemini Vision.
