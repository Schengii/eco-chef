## Zusammenfassung der Änderungen
<!-- Bitte beschreibe kurz und präzise, was geändert wurde und warum. -->

## Art der Änderung
- [ ] 🐛 Bugfix (Fehlerbehebung ohne Breaking Change)
- [ ] ✨ Feature (Neues Feature oder funktionale Erweiterung)
- [ ] ♻️ Refactoring (Code-Bereinigung ohne Verhaltensänderung)
- [ ] ⚡ Performance (Optimierung von Ladezeit oder Speicher)
- [ ] 🎨 UI/UX (Design-, Styling- oder Barrierefreiheitsanpassung)
- [ ] 📝 Dokumentation (Aktualisierung von Anleitungen, CHANGELOG oder CLAUDE.md)
- [ ] 🧪 Tests (Neue Unit-, Integrations- oder E2E-Tests)
- [ ] 🔧 Konfiguration / CI / Vercel (Build-Pipeline, Dependencies, Deployment)

## Betroffene Bereiche
- [ ] KI-Rezeptgenerierung & Gemini-Service (`ui-src/services/gemini.service.ts`, `api/gemini.ts`)
- [ ] Vorratskammer, Barcode- & Kassenzettel-Scanner (`pantry`, `barcode`)
- [ ] Kochmodus, Timer & Sprachsteuerung
- [ ] Haushalts-Sync & E2E-Krypto (`sync.service.ts`, `crypto.service.ts`)
- [ ] Offline-Storage & PWA (`storage.service.ts`, `sw.js`)
- [ ] Cordova Mobile Wrapper (Android)
- [ ] Vercel Serverless Function & Deployment

## Qualitäts- & Test-Checkliste
- [ ] `npm run type-check` läuft fehlerfrei durch (`tsc --noEmit`)
- [ ] `npm test` bzw. `npm run test:coverage` besteht alle Tests
- [ ] `npm run build` erzeugt erfolgreich den Production-Build (`www/`)
- [ ] Sensible Daten (API-Keys, `.env`) wurden **nicht** committet
- [ ] Falls zutreffend: [CHANGELOG.md](file:///c:/Users/sche-/Desktop/Programmieren%20Projekte/EcoChef/CHANGELOG.md) aktualisiert
- [ ] Falls Architektur geändert: [CLAUDE.md](file:///c:/Users/sche-/Desktop/Programmieren%20Projekte/EcoChef/CLAUDE.md) synchronisiert
