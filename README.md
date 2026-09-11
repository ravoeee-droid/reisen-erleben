# Reisen & Erleben — High-End Relaunch V3

Migration-first Relaunch: bestehende R&E-Marke, Inhalte und Funktionsbereiche bleiben erhalten und werden in eine moderne, schnelle Reise-/Booking-Journey überführt.

## Enthalten
- Editorial High-End Homepage statt generischer AI-Landingpage
- 2026/2027 Reiseübersicht + Tagestouren
- Andalusien Roadbook-Detailseite
- Tour Concierge / Fahrprofil-Flow
- Service, FAQ, Tourenregeln, Club-Touren, Team, News, Kontakt, Buchung
- Gästebuch- und Tour-Verabredungs-Migration als Community-Bereiche
- Restplätze, Gutschein, Reiseversicherung, Reise-T-Shirts
- Admin/Operations-Prototyp + Lead Webhook
- SEO/GEO-Basis, Schema, Sitemap, Performance-first static build

## Open-source Interaction Inspiration
- Codrops OnScrollPathAnimations (MIT): scroll-linked route/path behavior
- Codrops Scroll3DGrid (MIT): depth/grid memory sequence concept
- motion-primitives (MIT): tilt/magnetic interaction concept

Die konkrete Implementierung in `assets/app.js` nutzt native Web APIs, um ohne große Runtime-Dependencies schnell zu bleiben.

## Legal / launch note
Rechtstexte werden beim echten Domain-Relaunch nicht neu formuliert. Der Entwurf verlinkt auf die aktuell veröffentlichten Originalfassungen. Für den finalen Domain-Switch muss der freigegebene Originaltext aus der Bestandsquelle 1:1 übernommen und geprüft werden.

## Automationen optional
`LEAD_WEBHOOK_URL` kann auf n8n, Make, CRM oder eine eigene API zeigen. WhatsApp-/E-Mail-Follow-ups werden erst nach Auswahl des finalen Providers und DSGVO-Prüfung aktiviert.
