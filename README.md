# Reisen & Erleben — High-End Website Concept

Conversion-first Relaunch-Entwurf für Reisen & Erleben Motorradreisen Werner GmbH.

## Prototype

Der aktuelle Stand enthält:

- emotionale Premium-Homepage mit echter R&E-Bildwelt
- interaktiven 5-Step Tour-Finder
- Premium Tour Cards statt Tabellen
- performante Depth-/3D-Effekte ohne schwere WebGL-Runtime
- animierte Routenvisualisierung
- Fahrprofil-/Match-Konzept
- Social → Website Deep-Link Journey
- Club-Tour Rechner
- WhatsApp CTA
- ausgearbeitete Andalusien-Tourdetailseite
- Admin-Control-Room Preview
- Lead-Webhook für CRM / n8n / Make / WhatsApp-Automation
- SEO/GEO mit semantischem Content und Structured Data
- Reduced Motion und Accessibility-Grundlagen

## Build

Die größeren statischen Design-Assets liegen verlustfrei gzip-komprimiert unter `.source/`. Das hält diesen ersten atomaren Repo-Import kompakt. Der Build benötigt keine zusätzliche Library und entpackt die Dateien nach `dist/`.

```bash
npm run build
```

Lokale Vorschau:

```bash
npm run dev
```

## Routen

- `/` — Homepage / Conversion Journey
- `/touren/andalusien/` — vollständige Tourdetailseite
- `/admin/` — Admin-/Automation-Konzept (nur Preview; vor Produktion zwingend Auth ergänzen)

## Optionale Integrationen

`/api/lead.js` kann über Environment Variables an externe Systeme weiterleiten:

- `LEAD_WEBHOOK_URL` — z. B. CRM, n8n, Make
- `WHATSAPP_WEBHOOK_URL` — optionaler WhatsApp-Follow-up Workflow

Produktive Credentials gehören ausschließlich in Environment Variables.

## Production-Roadmap

Für die finale Version sind als gezielte Open-Source-Upgrades vorgesehen: MapLibre + react-map-gl für echte Routenkarten, Turf für Geodaten, Motion für hochwertige Interaktionen, Sanity für Tour-/Content-Daten, React Hook Form für den Buchungswizard und Serwist für einen späteren Offline-„Meine Reise“-Bereich.

Kein fertiges Travel-Template wird über die Marke gestülpt. Bewährte Engines und Patterns werden nur dort eingesetzt, wo sie Conversion, Erlebnis oder Wartbarkeit wirklich verbessern.

## Release-Gates vor echtem Launch

Der Stand ist ein Design-/Conversion-Prototype. Vor Produktionsfreigabe folgen u. a. finale Tourdaten-Migration, Bildoptimierung/CDN, Admin-Auth, DSGVO-/Tracking-Prüfung, Spam-Schutz, Web-Vitals/Lighthouse, Mobile Visual QA, Structured-Data-Validierung, Accessibility QA und Redirect-Migration der bestehenden URLs.
