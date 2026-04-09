# Cogochi Showcase Page

Route scope:
- `/cogochi/showcase`

Purpose:
- Provide a literal Ssscript-style experimental landing scene for `/cogochi/showcase` with a dark desktop composition, cursor-reactive background color, the same section order and density as the reference page, and custom chart-analysis themed floating assets built as a varied tool set with a clear center and a scroll-linked `logo.glb` anchor behind the access card.

Primary User Job:
- Feel the product mood quickly, then submit an email for private-alpha access.

Core Flow:
1. User lands on the showcase route.
2. The black topbar, two-row hero, and central access card establish the scene.
3. Pointer movement shifts the background glow and mood.
4. Scrolling reveals and hides layered support cards.
5. User submits an email through the access form.
6. Success state confirms the user is on the private-alpha list.
7. The right-side file rail, hidden waitlist windows, FAQ/mail panel, footer, and dock reinforce the desktop metaphor.
7. The borrowed floating visuals are replaced by project-owned chart-analysis icons, analysis widgets, and a mascot card.

Official Contract:
1. Keep the page visually distinct from the main home route while matching the reference structure closely.
2. Preserve the email-first access action.
3. Use scroll as a visual reveal mechanism, not as a navigation requirement.
4. Keep the content English and product-oriented.
5. Cursor movement should visibly affect the background color or glow.

Key UI Blocks:
- fixed black topbar
- two-row hero copy blocks
- central access card with email capture
- scroll-reactive background layers
- scroll-linked `logo.glb` center anchor behind the access card
- custom chart-analysis floating asset layer with layered tool cards and analysis widgets
- custom chart-analysis floating asset layer arranged as a loose perimeter ring around the access card
- brand lockup, FAQ/mail panel, and footer

State Authority:
- scroll progress: route local
- email and success state: route local
- access submission: `POST /api/waitlist`

Failure States:
- page reads like a static brochure instead of a moving scene
- scroll layers do not fade in or out
- email capture becomes less visible than the backdrop
- floating assets look generic instead of chart-analysis specific or too repetitive
- floating assets cluster too tightly over the access card or hero copy

Read These First:
- `docs/SYSTEM_INTENT.md`
- `docs/product-specs/home.md`
- `docs/page-specs/home-onboarding.md`
- `docs/design-docs/cogochi-uiux-architecture.md`
