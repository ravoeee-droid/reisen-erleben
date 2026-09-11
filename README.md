# Reisen & Erleben — V4 Motion, Concierge & Tobi

V4 is a non-destructive interaction layer on top of the complete migration-first R&E V3. Existing branding, migrated pages, tour content, redirects and legal/service structure stay intact.

## V4 adds
- cinematic scroll progress and hero parallax
- editorial reveal / image-mask motion language
- magnetic controls and subtle tilt interactions
- hover journey previews in the tour archive
- scroll-linked Roadbook route drawing
- spatial 3D memory flight for the community/story section
- full-screen 5-step Tour Concierge with live match scores and ranked recommendations
- **Tobi**, the R&E tour assistant: natural-language matching, comparisons, availability, transport/group/price answers, tour cards, WhatsApp handoff and consultation-slot requests
- travel comparison, shortlist/share/watch interactions
- optional analytics, CRM/n8n/Make/AI and booking webhooks
- View Transitions where supported and reduced-motion fallbacks

## Runtime design
The existing V3 `build.js` and `.site-bundle` remain unchanged. `npm run build` first creates the full V3 site, then `v4-build-hook.js` verifies and unpacks the checked V4 runtime from `.v4-runtime/`, writes the motion/Tobi assets into `dist/assets`, and patches every generated HTML page. This keeps the migrated R&E content as the source of truth while upgrading the experience globally.

## Optional environment variables
- `TOBI_WEBHOOK_URL` — n8n / Make / CRM / AI service for server-side Tobi replies
- `BOOKING_WEBHOOK_URL` — consultation/calendar workflow
- `LEAD_WEBHOOK_URL` — fallback lead workflow
- `ANALYTICS_WEBHOOK_URL` — interaction/conversion events
- `TOUR_DATA_URL` — optional external live tour data feed

Without these integrations, the browser-side Tobi expert engine and Tour Concierge still work as the safe fallback; no provider secrets are exposed client-side.
