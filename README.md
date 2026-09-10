# Reisen & Erleben — High-End Website Concept

Conversion-first Relaunch-Entwurf für Reisen & Erleben Motorradreisen Werner GmbH.

## Was im Prototype enthalten ist

- Emotionaler Premium-Homepage-Entwurf mit echten R&E-Bild-URLs
- Tour-Finder als interaktiver 5-Step Funnel
- Premium Tour Cards statt Tabellen
- 3D-/Depth-Effekte ohne schweren WebGL-Ballast
- Animierte Route als performantes SVG
- Fahrprofil-/Match-Konzept
- Social → Website Deep-Link Konzept
- Club-Tour Rechner
- WhatsApp CTA
- Ausgearbeitete Andalusien-Tourdetailseite
- Admin-Control-Room Preview
- Optionaler Lead-Webhook für CRM / n8n / Make / WhatsApp-Automation
- SEO/GEO: strukturierte Daten, semantische Inhalte, FAQPage, TravelAgency, TouristTrip, Sitemap, Robots
- Performance: keine Framework-Runtime im Prototype, kein schweres 3D, lazy-loaded Medien, reduced-motion Support
- Accessibility: Skip Link, semantische Sections, Fokus-fähige Bedienelemente, Reduced Motion

## Admin-Vision

Der Admin-Bereich bündelt perspektivisch:

1. Touren & Termine
2. Plätze / Verfügbarkeit
3. Leads & Buchungen
4. Preise & Leistungen
5. Hotels, Guides, Etappen
6. Bilder & Videos
7. Gästestimmen
8. SEO/GEO Content
9. Social Landingpages / UTM-Zuordnung
10. Automationen / CRM / WhatsApp / E-Mail

`/admin/` ist im Prototype nur eine UI-Demo und muss vor Produktionsbetrieb durch Auth geschützt werden.

## Automationen

`/api/lead.js` kann per Environment Variables an externe Systeme weiterleiten:

- `LEAD_WEBHOOK_URL` → z. B. n8n, Make, CRM, Slack
- `WHATSAPP_WEBHOOK_URL` → optionaler WhatsApp-Follow-up Workflow

Keine Integration ist hardcodiert; produktive Credentials gehören ausschließlich in Environment Variables.

## GitHub/Open-Source Upgrade-Pfade für Production

Der Prototype bleibt absichtlich extrem leicht. Für Production sind folgende Open-Source-Bausteine sinnvoll, wenn der Nutzen den Bundle-Impact rechtfertigt:

- `maplibre/maplibre-gl-js` — echte interaktive Destination-/Routenkarten (BSD-3-Clause)
- `visgl/react-map-gl` — React-Integration für MapLibre (MIT)
- `Turfjs/turf` — Geodaten, Distanzen, Bounding Boxes, Route-Logik (MIT)
- `motiondivision/motion` — gezielte hochwertige Interaktionen (MIT)
- `darkroomengineering/lenis` — optionales Smooth Scrolling, nur falls UX-Messung positiv (MIT)
- `sanity-io/next-sanity` — CMS/Tourdaten im späteren Next.js Build (MIT)
- `react-hook-form/react-hook-form` — komplexer finaler Buchungswizard (MIT)
- `gpbl/react-day-picker` — zugängliche Terminfilter (MIT)
- `serwist/serwist` — späterer „Meine Reise“-PWA-/Offline-Bereich (MIT)

**Prinzip:** nicht ein fertiges Travel-Template kopieren. Wir übernehmen nur bewährte Engines/Patterns und halten die R&E Art Direction vollständig individuell.

## Production Architektur

Für die finale Version empfohlen:

- Next.js App Router
- Sanity für Touren/Termine/Content
- Route-/Destination-Daten als strukturierte Entities
- serverseitig gerenderte, indexierbare Tourseiten
- image CDN / Next Image
- Webhooks zu CRM/n8n/Make
- optional WhatsApp Business Platform
- Analytics + Consent Mode
- Admin nur authentifiziert
- automatische Restplatz-/Verfügbarkeitslogik
- per-Tour Structured Data + FAQ + OG Images

## Release-Gates vor echtem Launch

Der jetzige Stand ist ein **Design-/Conversion-Prototype**, kein Produktionslaunch. Vor Freigabe:

- Originalfotos final auswählen und lokal/CDN-optimiert einbinden
- alle Tourdaten aus dem aktuellen Katalog migrieren
- Texte/Reisepreise/Termine gegen Backend verifizieren
- DSGVO/Consent/Tracking juristisch prüfen
- Formulare mit Spam-Schutz + Double-Opt-In je nach Workflow
- Admin Auth + Rollen/Rechte
- Lighthouse/Web Vitals auf realer Preview
- Mobile Visual QA auf mehreren Viewports
- Structured Data Validation
- Accessibility QA
- 404/redirect migration plan für bestehende URLs

## Lokale Vorschau

```bash
python3 -m http.server 3000
```

Dann `http://localhost:3000` öffnen.
