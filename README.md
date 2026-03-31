# *Event Website* project

A static event website for student Christian fellowship group. Promotes the spring student retreat _"Falling in Love with Jesus"_ with a photo-rich landing page, smooth-scrolling animations, and a Supabase-backed registration form.

**Live site**: [drincatuic.org](https://drincatuic.org)

## Demo

https://github.com/user-attachments/assets/9df883d5-5220-47a6-8a07-66a975d0f0c5

## Architecture

```mermaid
flowchart TB
    USER([User]) --> IDX["index.html<br/>Landing Page"]
    IDX --> |Scroll| GALLERY["Polaroid Gallery<br/>5:4 + 16:9 collage grids"]
    IDX --> |Scroll| VIDEOS["Video Section<br/>2 Vimeo embeds"]
    IDX --> |Scroll| PROGRAM["Program Slider<br/>3 poster images"]
    IDX --> |Scroll| QA["Q&A Accordion"]
    IDX --> |Scroll| CONTACT["Contact Footer"]
    IDX --> |Click RSVP| REG["registration.html"]

    GALLERY --> |Click image| MODAL["Image Modal<br/>Full-res view"]
    GALLERY --> |Touch tap 1| INFO["Info Overlay"]
    INFO --> |Touch tap 2| MODAL
    MODAL --> |Close / Escape| GALLERY

    REG --> |Submit| SUPA[("Supabase<br/>registrations table")]
    SUPA --> |Success| SUCCESS["Success Message"]

    IDX --> |Toggle| THEME{"Dark / Light Mode"}
    THEME --> |localStorage| IDX

    IDX --> |GSAP| SMOOTH["ScrollSmoother<br/>smooth: 1.5"]
    SMOOTH --> |Scroll velocity| ROTATE["Hero BG Rotation"]
```

## Features

- **Dark/Light mode** Toggle saved to `localStorage`; token-based CSS theming with zero per-component overrides
- **Polaroid collage gallery** Scattered rotation via `nth-child(6n+X)`, hover straightening + shadow depth, fullscreen modal viewer
- **GSAP smooth scrolling** ScrollSmoother for buttery page scroll, scroll-driven hero background rotation via ScrollTrigger
- **Directional hover effects** Mouse-direction-aware overlay animations (inspired by Hakim El Hattab)
- **Touch-optimized** Two-tap interaction (tap 1 = overlay, tap 2 = modal), hamburger sidebar, touch-device CSS class
- **Registration form** Client-side validation, Supabase insert, loading states, personalized success message
- **Responsive-first** Fluid typography via `clamp()`/`min()`/`max()`, mobile breakpoints at 768px/480px
- **Performance** Tiered image preloading, `loading="lazy"`, `content-visibility: auto`, `decoding="async"`, `requestAnimationFrame` guard, `passive` scroll listeners
- **Security hardened** Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, strict referrer policy
- **Frosted glass UI** `backdrop-filter: blur()` with SVG filter fallback on nav, buttons, and panels

## Tech Stack

```mermaid
graph TD
    subgraph External
        SUPA["Supabase JS SDK v2<br/>cdn.jsdelivr.net"]
        VIMEO["Vimeo Player API<br/>player.vimeo.com"]
        FONT["WF Visual Sans<br/>CloudFront CDN"]
        GSAP["GSAP 3.14.1<br/>cdn.jsdelivr.net"]
    end

    subgraph "Webpack Entries"
        IDXE["js/entries/index.js"]
        REGE["js/entries/registration.js"]
    end

    subgraph "Source Modules"
        RESET1[reset.css] --> STYLES[styles.css]
        SCRIPT[script.js]
        SLIDER[slider.js]
        IMGPRE[imagePreloading.js]
        GRIDHOV[gridHover.js]
        MODAL[modal.js]
        EXPAND[expandable.js]
        SCROLLNAV[scrollNav.js]
        CONFIG1[config.js]
    end

    subgraph "Templates"
        RESET2[reset.css] --> FORMCSS[form.min.css]
        IDXHTML[index.html]
        REGHTML[registration.html]
    end

    IDXE --> SCRIPT
    IDXE --> SLIDER
    IDXE --> IMGPRE
    IDXE --> GRIDHOV
    IDXE --> MODAL
    IDXE --> EXPAND
    IDXE --> SCROLLNAV

    REGE --> CONFIG2[config.js]
    REGE --> SCRIPT2[script.js]

    CONFIG1 --> SUPA
    CONFIG2 --> SUPA
    STYLES --> FONT
    MODAL --> |pause/resume| GSAP
```

| Dependency | Purpose |
|---|---|
| Vanilla HTML5 / CSS3 / ES6+ | Core |
| Webpack 5 + Babel Loader | Bundle and compile JS modules |
| [Supabase JS v2](https://supabase.com/docs/reference/javascript) | Registration form backend |
| [GSAP 3.14.1](https://greensock.com/gsap/) | ScrollSmoother + ScrollTrigger for smooth scrolling and scroll-driven animations |
| [Vimeo Player API](https://developer.vimeo.com/) | Embedded event videos |
| WF Visual Sans | Variable web font (woff2) |
| GitHub Pages | Static hosting via CNAME |

JS modules are bundled through webpack entries with `runtimeChunk` manifest extraction and production content-hashed outputs.

## Build with Webpack

```bash
npm install
npm run build
```

Before local builds, create a `.env` file from `.env.example` and set:

- `SUPABASE_URL`
- `SUPABASE_PUBLIC_KEY`

For local development:

```bash
npm start
```

Webpack outputs built files to `dist/` and generates both pages from templates:

- `index.html` using the `index` entry
- `registration.html` using the `registration` entry

## Project Structure

```
.
├── index.html              # Landing page
├── registration.html       # Registration form
├── css/
│   ├── reset.css           # Modified Eric Meyer reset
│   ├── styles.css          # Main page styles
│   ├── styles.min.css      # Minified variant
│   ├── form.css            # Registration form styles
│   └── form.min.css        # Minified variant
├── js/
│   ├── script.js           # Theme, form handler, sidebar
│   ├── config.js           # Supabase client init
│   ├── slider.js           # Image carousel
│   ├── imagePreloading.js  # Progressive image loading
│   ├── gridHover.js        # Directional hover effects
│   ├── modal.js            # Fullscreen image viewer
│   ├── expandable.js       # Accordion Q&A
│   ├── scrollNav.js        # Scroll-responsive navbar
│   └── *.min.js            # Minified variants
├── images/                 # Thumbnails (Small) + originals/
└── assets/                 # Hero BGs, RSVP letter images, favicon
```

## JS Module Map

```mermaid
graph TB
    subgraph "UI Components"
        NAV[Sticky Nav / Sidebar]
        HERO[Hero + RSVP Button]
        BG[Hero BG Rotation]
        POLAROID[Polaroid Grids]
        SLIDER_UI[Poster Slider]
        ACCORDION[Q&A Accordion]
        MODAL_UI[Image Modal]
        FORM_UI[Registration Form]
    end

    subgraph "JS Modules"
        THEME["script.js → theme()"]
        SIDEBAR["script.js → handleSidebar()"]
        FORM_JS["script.js → form()"]
        SCROLLNAV_JS[scrollNav.js]
        HOVER[gridHover.js]
        PRELOAD[imagePreloading.js]
        MODAL_JS[modal.js]
        SLIDER_JS[slider.js]
        EXPAND_JS[expandable.js]
        GSAP_INLINE[Inline GSAP Script]
    end

    NAV --> THEME
    NAV --> SIDEBAR
    NAV --> SCROLLNAV_JS
    POLAROID --> HOVER
    POLAROID --> MODAL_JS
    POLAROID -.->|"selectors not updated"| PRELOAD
    SLIDER_UI --> SLIDER_JS
    ACCORDION --> EXPAND_JS
    FORM_UI --> FORM_JS
    BG --> GSAP_INLINE
    MODAL_JS --> |pause/resume ScrollSmoother| GSAP_INLINE
```

## License

MIT
