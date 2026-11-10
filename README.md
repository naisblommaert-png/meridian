# Meridian · landingspagina

Landingspagina voor **Meridian**, een fictief colognemerk voor reizende professionals. Schoolproject Content Automation 2026-2027.

Live: https://naisblommaert-png.github.io/meridian/

## Inhoud
- Hero, merkverhaal, voordelen, geurlijn (Iris, Amber, Sage, Noir), sfeerband, CTA met het ingesloten MailerLite-formulier, over ons en footer met privacytekst
- Mobiel eerst en responsive, Space Grotesk + DM Sans, hoofdkleur #7453A2
- Toegankelijkheidsmenu (knop linksonder): tekstgrootte, hoog contrast, leesbaar lettertype, regel- en letterafstand, links onderstrepen, animaties uit, grote focusrand. Getest met axe-core (WCAG 2.1 A/AA).

## Bestanden
- `index.html`: de pagina
- `style.css`: opmaak
- `main.js`: kleine animaties, toegankelijkheidsmenu, MailerLite-controle
- `fles3d.js`: het 3D-flesje bij Over ons (three.js); `fles3d.bundle.js` is dezelfde code gebundeld met three.js r170 (esbuild), zodat de pagina ook lokaal werkt
- `vendor/`: RoomEnvironment en de licentie van three.js (MIT)
- `img/`: beelden (WebP), logo en favicon

Geen build-stap: GitHub Pages toont de bestanden rechtstreeks (branch `main`, map `/`).

## Firefly-video toevoegen
Zet `meridian.mp4` in `img/` en vervang in de sectie `sfeer` de `<img>` door:
`<video src="img/meridian.mp4" autoplay muted loop playsinline></video>`
Voorzie dan ook een pauzeknop (WCAG 2.2.2).

## AI-transparantie
Gebouwd met Claude (Claude Code). Teksten en beelden deels gemaakt met AI (Claude, Adobe Firefly). Sfeerfoto's via Pexels (Gustavo Fring, Mikhail Nilov). 3D met three.js (MIT).
