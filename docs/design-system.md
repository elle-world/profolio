# Design System

## Style Keywords

- Minimal
- Tech-forward
- Editorial
- Calm
- Precise
- Human

## Visual Direction

The website should feel like a polished product interface with editorial warmth.

It should avoid looking like:

- a generic resume template
- a photo-heavy travel blog
- a flashy but empty tech demo
- an overdecorated landing page

## Color Direction

The design should support both light and dark modes. V1 can ship with one default theme, but color choices should be token-based from the beginning.

Suggested base palette:

- near black
- soft white
- cool gray
- muted metallic gray
- one restrained accent color

The accent color can be extracted later from selected personal images or chosen to match the target role direction.

## Theme Strategy

Dark mode should feel intentional, not like a simple color inversion.

Light mode:

- editorial
- clean
- portfolio-friendly
- easy to read in recruiting contexts

Dark mode:

- tech-forward
- calm
- high contrast
- suitable for AI and product experiment sections

The header should reserve a place for a theme toggle even if dark mode is implemented after the first launch.

## Typography

- Use a clean sans-serif font for most text.
- Use a mono font sparingly for system labels, metadata, or prototype elements.
- Keep hierarchy clear and restrained.

## Image Usage

The personal portrait is a primary hero asset.

It should be presented as a professional visual anchor, not as a decorative background. The layout should keep the portrait flexible across desktop and mobile crops.

Travel photos are secondary.

They should be used as personal texture, not as the main website identity. They can appear in:

- a small personal context section
- project context for AI Travel Planner
- subtle image strips
- social media previews

## Motion

Motion should be subtle:

- soft hover states
- gentle section reveal
- lightweight image transitions
- no excessive 3D or distracting animation in V1

The component structure should still allow future upgrades with Framer Motion, GSAP, or scroll-based interactions.

## Layout Principles

- Clear first screen
- Strong information hierarchy
- Generous whitespace
- Dense but readable project cards
- Mobile-first readability
- Resume and contact actions always easy to find
- Header has room for language and theme controls
- Hero layout adapts from desktop split layout to mobile stacked layout
- Project cards are data-driven and easy to expand

## Responsive Requirements

Mobile is a first-class experience.

Key requirements:

- no horizontal overflow
- portrait crop remains intentional
- primary actions visible without excessive scrolling
- text lines stay readable on narrow screens
- cards stack cleanly
- navigation remains simple and thumb-friendly

## Internationalization Readiness

The website should be prepared for Chinese and English versions.

Design implications:

- avoid fixed text containers that only fit one language
- allow headings and buttons to grow
- keep navigation labels short
- use data structures that can later map to `zh` and `en` content
