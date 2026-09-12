---
name: USAR Certificate Generator
description: A disciplined dark workspace for drafting formal USAR graduation certificates.
colors:
  brass-insignia: "#c4a35a"
  deep-olive: "#1a1d18"
  panel-moss: "#232820"
  field-moss: "#2c3228"
  warm-ink: "#f3efe4"
  muted-tan: "#b7b3a6"
  line-olive: "#3a4034"
  accent-ink: "#1a160c"
  parchment: "#f5ecd6"
  certificate-ink: "#111111"
  seal-backing: "#f3ead2"
  danger: "#b5533a"
typography:
  display:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "1.65rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  script:
    fontFamily: "Great Vibes, cursive"
    fontSize: "72px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "10px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "0.35rem"
  sm: "0.55rem"
  md: "0.85rem"
  lg: "1.25rem"
  xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.brass-insignia}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "0.6rem 1.05rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.pill}"
    padding: "0.6rem 1.05rem"
  field:
    backgroundColor: "{colors.field-moss}"
    textColor: "{colors.warm-ink}"
    rounded: "{rounded.sm}"
    padding: "0.55rem 0.65rem"
---

# Design System: USAR Certificate Generator

## Overview

**Creative North Star: "The Adjutant's Desk"**

A disciplined, dimly lit administrative workspace where the real object of care is the document it produces, not the chrome around it. The tool shell is warm and ceremonial in feeling — deep olive surfaces, a brass-insignia accent, a serif masthead — but disciplined and unadorned in construction: pill buttons, plain hairline borders, no gradients or heavy effects. That restraint is deliberate; the workspace never competes with the parchment certificate it exists to produce.

The certificate itself is a second, distinct register: warm cream parchment, near-black ink, a formal serif for structure and a cursive hand for names and signatures — the fixed visual language of an official Army graduation certificate. The dark tool and the light document share one warm, aged palette family (olive/brass on one side, parchment/ink on the other), so the pairing reads as one system rather than two unrelated surfaces.

**Key Characteristics:**
- Dark, quiet tool chrome (deep olive) housing a warm brass accent used sparingly
- A single physical object in the whole system: the certificate canvas, marked by the only drop shadow
- Two typefaces do all the expressive work — a serif for formal structure, a script for the human hand (names, signatures)
- Certificate visual rules (parchment, ink, seal placement) are fixed and separate from the tool's own chrome

## Colors

A warm, aged palette split across two registers: deep olive-and-brass for the tool shell, cream-and-ink for the certificate it produces.

### Primary
- **Brass Insignia** (#c4a35a): the tool's only accent color — fieldset legends, focus rings, the primary "Download PNG" button. Used sparingly against the dark shell so it reads as insignia, not decoration.

### Secondary
- **Parchment** (#f5ecd6): the certificate's base surface — the canvas background whenever the real parchment texture image is unavailable, and the visible page color at all times.
- **Certificate Ink** (#111111): all certificate text, the double-ruled border, and signature lines. Near-black rather than pure black, to sit naturally on parchment.
- **Seal Backing** (#f3ead2): the cream disc drawn behind every circular unit seal, so transparent or non-square insignia never look cropped or float awkwardly.

### Status
- **Danger** (#b5533a): a muted rust reserved for the one hard-failure state — the catalog-load error message and the disabled form beneath it. Never used decoratively.

### Neutral
- **Deep Olive** (#1a1d18): the page background, warmed by two soft radial gradients (one-off atmospheric stops `#2f3528` and `#3a3220`, not part of the reusable palette — see Named Rules) rather than left flat black.
- **Panel Moss** (#232820): the form panel surface (rendered slightly darkened via `color-mix`).
- **Field Moss** (#2c3228): input and select backgrounds — one step lighter than the panel so fields read as recessed.
- **Warm Ink** (#f3efe4): primary text on the dark shell.
- **Muted Tan** (#b7b3a6): secondary text — labels, hints, helper copy.
- **Line Olive** (#3a4034): all hairline borders and dividers in the tool shell.
- **Accent Ink** (#1a160c): text color used on top of the brass accent (primary button label).

### Named Rules
**The Insignia Rule.** Brass Insignia appears only on legends, focus states, and the single primary action per screen. It never fills a large surface — its rarity is what makes it read as rank, not decoration.

**Accepted one-offs.** The two radial-gradient stops on the page background (`#2f3528`, `#3a3220`) are a single, intentional atmospheric wash — not reusable tokens, and not to be extended elsewhere.

## Typography

**Display Font:** Libre Baskerville (with Georgia, serif fallback)
**Script Font:** Great Vibes (cursive)
**Body Font:** Source Sans 3 (with system-ui fallback)

**Character:** A formal serif carries every structural moment — headings, certificate title and body, dates, signatory titles — while a cursive script is reserved exclusively for the human hand: a graduate's name and the two signature lines. The tool's own UI runs on a plain, quiet sans so the serif and script stay special rather than diluted into everyday chrome.

### Hierarchy
- **Display** (700, 1.65rem, 1.2 line-height): the tool's own "Certificate Generator" masthead; also the certificate's own title, set at 58px/700 in-canvas.
- **Headline** (italic 400, 34px): the certificate subtitle line ("Certificate of Graduation").
- **Script** (400, 72px cursive, 1 line-height): the graduate's name on the certificate, and 48px for the two signature lines beneath it. Reserved exclusively for names — never used in the tool UI.
- **Body** (400, 0.95rem / certificate body 26px serif): form field text, and the certificate's certifying paragraph and date line.
- **Label** (400, 0.78rem, 0.08em letter-spacing, uppercase): fieldset legends in the tool shell only.

### Named Rules
**The One Hand Rule.** Great Vibes renders human names and nothing else — not headings, not labels, not body copy. If it appears, a person's name is what's being written.

**Accepted one-offs.** `.form label` (0.82rem) and `.preview-toolbar` (0.88rem) sit a half-step off the documented Body/Label sizes — each used exactly once, close enough to their neighbors not to warrant a third size step.

## Layout

The tool is a two-pane grid: a fixed-width form panel (`minmax(320px, 420px)`) beside a flexible preview pane, collapsing to a single stacked column under 960px. The form panel scrolls independently (`max-height: 100vh`) while the preview stays put. An "Expand preview" mode hides the form panel entirely and widens the certificate canvas to 1600px for a distraction-free view.

Spacing is a small, consistent rhythm rather than a formal scale: 0.35rem for tight label gaps, 0.55–0.6rem for control padding and action gaps, 0.85rem–1rem for fieldset padding and stacked margins, up to 2.5rem for the panel's bottom breathing room. Fieldsets group related fields with a bordered, legend-labeled container — the form's only structural device.

Under `@media (pointer: coarse)`, buttons and fields get taller padding (0.75rem / 0.8rem vertical) to clear a touch-friendly target size; pointer:fine (mouse/trackpad) keeps the compact desktop-tool density.

## Elevation & Depth

Flat by default, everywhere in the tool shell — hairline borders (`--line`) do all the separation work; there are no shadows on panels, fieldsets, or buttons. The one exception is deliberate: the certificate canvas itself carries a soft drop shadow (`0 18px 50px rgba(0,0,0,0.45)`), marking it as a physical object resting on the dark desk rather than another flat UI panel.

### Named Rules
**The One Object Rule.** Exactly one element in the entire system casts a shadow: the certificate. Everything else — buttons, fields, fieldsets, the logo-preview chip — stays flat and line-bordered. A second shadow anywhere else breaks the rule.

## Shapes

Two corner languages by register. The tool shell favors soft, small radii: 8px on inputs and the logo-preview chip, 10px on fieldset containers, a one-off 12px on the canvas-wrap frame specifically (between `sm` and `md`, used once), and a full 999px pill on every button — the only fully round shape besides the circular seal thumbnails (50%, used for both the small in-form logo previews and the large in-certificate seals). The certificate itself has no rounded corners at all: a sharp-edged rectangle with a double hairline border (4px outer, 1.5px inner, both near-black), consistent with a formal printed document.

## Components

### Buttons
- **Shape:** full pill (`border-radius: 999px`)
- **Primary:** Brass Insignia background, Accent Ink text, border one shade darker than the fill (`color-mix(in srgb, var(--accent) 70%, black)`). The certificate generator's single primary action ("Download PNG").
- **Ghost:** transparent background, Warm Ink text, Line Olive border. Used for secondary actions ("Reset", "Expand preview").
- **Hover / Focus:** both variants brighten on hover (`filter: brightness(1.08)`); no color or shape change, keeping the disciplined, unadorned character.

### Cards / Containers (Fieldsets)
- **Corner Style:** 10px radius
- **Background:** none (transparent within Panel Moss) — border-only separation
- **Border:** 1px solid Line Olive
- **Legend:** uppercase, 0.08em letter-spacing, 0.78rem, Brass Insignia — the only label-level use of the accent color
- **Internal Padding:** 0.85rem sides, ~1rem bottom

### Inputs / Fields
- **Style:** Field Moss background, Line Olive border, 8px radius, Warm Ink text
- **Focus:** a 2px outline in a brightened accent (`color-mix(in srgb, var(--accent) 65%, white)`), offset 1px — the only place focus state uses color rather than just a border shift

### Form Error State
- **Trigger:** the catalog fails to load (`data/catalog.json` fetch error).
- **Style:** every fieldset gets `disabled` plus 0.55 opacity — the form visibly goes inert rather than staying interactive and non-functional; the status line switches to Danger red and states what happened plus the recovery ("reload the page").

### Logo Preview (signature component)
A small dashed-border chip (`border: 1px dashed var(--line)`) holding a 44px circular thumbnail (cream-backed, `object-fit: contain`) plus a caption. Appears three times in the form — left unit, right command, watermark course — always previewing exactly what will render on the certificate before download, so the seal choice is never a surprise.

### The Certificate Canvas (signature component)
The system's one physical object. Parchment-textured background, double hairline border (4px + 1.5px, near-black), a faint 12%-opacity course watermark centered behind the text, two circular unit seals (cream-backed, 200px) flanking the date line, and a fixed vertical rhythm: title → subtitle → graduate name (script, underlined) → certifying paragraph with bolded name/unit/course → date/location → two signature blocks (script signature, ruled line, title, org). Every element position is fixed in canvas coordinates against the 2000×1414 base size, not responsive layout — the certificate is drawn once as a finished document, then displayed at any scale.

## Do's and Don'ts

### Do:
- **Do** keep Great Vibes exclusive to human names (graduate name, two signatures) — the One Hand Rule.
- **Do** keep Brass Insignia rare: legends, focus rings, and the single primary button only — the Insignia Rule.
- **Do** keep every tool-shell surface flat (borders only); reserve the drop shadow for the certificate canvas — the One Object Rule.
- **Do** back every circular seal with the cream Seal Backing disc so transparent or tall/non-square insignia never look cropped.
- **Do** preview every logo choice (left/right/watermark) before it reaches the certificate — no blind selection.

### Don't:
- **Don't** add a second shadow anywhere in the tool shell — it would compete with the certificate as "the object."
- **Don't** use the script font for anything but a name — not headings, not labels, not body text.
- **Don't** round the certificate's own corners or soften its border — its sharp-edged, double-ruled rectangle is a fixed part of the formal-document register, distinct from the tool shell's soft radii.
- **Don't** fill large surfaces with Brass Insignia — its value is scarcity, not saturation.
