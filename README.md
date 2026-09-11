# Reisen & Erleben — V5

V5 keeps the complete migration-first R&E site and upgrades the experience without replacing the existing branding, tour content, service/legal structure or redirects.

## V5 highlights
- real Lenis smooth scrolling integrated with GSAP/ScrollTrigger
- Codrops-derived MIT-licensed SVG path and 3D scroll patterns, adapted for performance
- V4 JavaScript runtime removed from generated pages so motion engines no longer compete
- same-origin `/api/re-image` image proxy with caching, legacy filename mapping and branded fallback
- Hero image layering fix and responsive image loading priorities
- redesigned Tobi tour assistant with natural-language tour matching, comparison, consultation requests, WhatsApp handoff and session preferences
- 5-step Tour Concierge with ranked matches
- performance fallbacks for reduced motion / lower-power devices
- cinematic Slowenien video moment using the official R&E start-page video with poster fallback, lazy loading and viewport pause/resume

## Optional integrations
- `TOBI_WEBHOOK_URL` — AI / CRM / n8n / Make backend
- `BOOKING_WEBHOOK_URL` — calendar / consultation workflow
- `LEAD_WEBHOOK_URL` — lead workflow
- `ANALYTICS_WEBHOOK_URL` — conversion events
- `TOUR_DATA_URL` — live tour data source

The build runs V3 migration → V4 content/markup layer → V5 performance/motion/media layer, then applies release gates to prevent old runtimes and direct R&E image hotlinks from shipping.
