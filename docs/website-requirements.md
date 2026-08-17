# Website Requirements

## Product Goal

Build a polished personal product portfolio that supports broad product manager job applications while making AI-assisted working ability visible through the website itself and selected works.

## Core Positioning

The website should not position me only as an AI product manager.

It should position me as:

```text
A product manager with a design background who turns complex systems into clear user experiences, with shipped Agent, payment, cross-device, and experience-governance work.
```

## V1 User Experience Requirements

### Mobile Adaptation

Mobile must be treated as a primary experience.

Requirements:

- hero section works on narrow screens
- portrait crop stays polished
- resume download is easy to access
- works cards stack cleanly
- no horizontal scrolling
- text does not overflow buttons or cards
- navigation is simple and touch-friendly

### Extensibility

The website should support future expansion:

- more works
- project detail pages
- richer interaction and animation
- dark mode
- multilingual content
- blog or notes if needed later

Implementation direction:

- V1: dependency-light static site for a fast, reliable launch
- Later: React or Next.js with TypeScript when project pages and 3D interaction justify migration
- structured bilingual content
- reusable layout and theme tokens

### Layout Precision

The page should be easy to refine over time.

Requirements:

- token-based colors
- consistent spacing scale
- responsive typography
- reusable card styles
- flexible image ratios
- layout sections that can be reordered or expanded

## Theme Requirements

Dark mode should be considered from the beginning.

V1 options:

1. Ship light mode first and reserve a theme toggle position.
2. Ship both light and dark modes if implementation time allows.

The code should avoid hard-coded colors that make dark mode difficult later.

## Language Requirements

Multilingual content should be considered from the beginning.

V1 options:

1. Ship Chinese-first content with selected English labels.
2. Ship full Chinese and English switch if implementation time allows.

The code should avoid hard-coded page copy scattered across components. Content should be structured so `zh` and `en` versions can be added later.

## Hero Requirements

The hero section should include:

- name: 吴桐 / Elle Wu
- broad product manager positioning
- personal portrait
- contact link

The portrait should be a primary visual asset, but not the entire identity of the site.

## Future Works Requirements

No unfinished personal projects appear in the V1 homepage. Add them only after there is a usable artifact or a case study worth reviewing.

Candidate future works:

- Travel Outfit Assistant
- AI Journey
- Personal Portfolio Website

Each work should eventually support:

- status
- one-line summary
- problem
- target user
- my role
- AI-assisted workflow
- prototype or screenshots
- next iteration

## Suggested First Launch Standard

The first public version is ready when:

- the site opens successfully on the custom domain
- mobile and desktop layouts are polished
- resume download works
- contact links work
- the homepage clearly communicates broad product capability
- AI capability is proven through shipped Agent work and hands-on building without narrowing the site to one job title

## Future Spatial Interaction

The 3D room is a later storytelling layer, not the V1 navigation system.

- Each object must map to meaningful content, such as a suitcase for travel, a sketchbook for design, or a device for AI work.
- Desktop can use a full interactive Three.js scene.
- Mobile and reduced-motion users need a fast, readable alternative.
- The 3D layer must never hide core resume and project content from recruiters.
