# Website Requirements

## Product Goal

Build a polished personal product portfolio that supports broad product manager job applications while making AI-assisted working ability visible through the website itself and selected works.

## Core Positioning

The website should not position me only as an AI product manager.

It should position me as:

```text
A product manager with design background, C-end product experience, visual taste, user empathy, and AI-assisted building ability.
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

Recommended implementation direction:

- Next.js
- TypeScript
- Tailwind CSS
- structured content data
- reusable components
- theme and language controls reserved in layout

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

- name: 吴桐 / Estelle Wu
- broad product manager positioning
- personal portrait
- resume download
- GitHub link
- contact link

The portrait should be a primary visual asset, but not the entire identity of the site.

## Works Requirements

Initial works:

- Personal AI Portfolio
- AI Fund Assistant
- AI Product Teardown Library

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
- GitHub and contact links work
- the homepage clearly communicates broad product capability
- AI-assisted work is visible without over-narrowing the job direction

