# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Training cadre across USAR units — training NCOs/officers who generate graduation certificates for course candidates in their own division/battalion/command group. Not a single-user personal tool; used by cadre in different units.

## Product Purpose

A static, no-backend web app that lets USAR training cadre generate a graduation certificate for a course candidate (OCS, SMA, and ESB) and download it as a PNG, ready to print or hand to the graduate.

## Positioning

Client-side canvas rendering keyed off a structured unit/course catalog (`data/catalog.json`) that encodes the real USAR unit hierarchy (division → brigade → company) and course-specific certificate templates (title, body text, signatory titles/orgs). The correct insignia and phrasing assemble automatically from the selected unit and course rather than being manually edited per certificate.

## Operating Context

Runs entirely client-side as a static site (GitHub Pages, live at https://codythebeast89.github.io/usar-certificate-generator/); local preview via `python3 -m http.server`. Logo assets are refreshed via `scripts/import_logos.py`, which pulls unit art from an external site (`~/Projects/forscom-website`) and Roblox group icons, upscaled to ~1024px.

## Capabilities and Constraints

- Three courses enabled: OCS (Officer Candidate School), SMA (Sergeants Major Academy), and ESB (Expert Soldier Badge Course, hosted by RRC). ESB has no dedicated badge artwork yet, so it uses RRC's own seal as a placeholder watermark rather than a fabricated badge image; its right-seal command-group fallback is TRADOC, RRC's actual parent command.
- `data/catalog.json` is the single source of truth for the division → brigade → company hierarchy and course templates.
- No backend, no persistence — one-shot PNG download per session; nothing is saved server-side.
- Insignia usage/trademark rights for official or unofficial DoD/Army unit insignia are an open, unresolved concern — flag before wider distribution rather than assuming clearance.

## Evidence on Hand

`assets/` contains 87 real unit insignia PNGs across divisions/brigades/companies/groups, referenced by id from `data/catalog.json`.

Known accuracy gap (found via automated vision inspection, not yet fixed): several insignia files are visually mismatched to the unit their filename/lineage claims —
- `1cav-spearhead-brigade.png` shows an unrelated crest, not 1st Cavalry Division styling.
- `1id-demon-brigade.png`, `1id-raven-brigade.png`, and a "Vanguard Brigade" file don't match 1st Infantry Division's red-1-on-olive design.
- `82nd-black-hats-brigade.png` doesn't match 82nd Airborne's "AA" motif.
- `odcs.png` actually depicts a Space Operations Squadron seal, not an Office of Deputy Chief of Staff insignia.
- `tfd.png` depicts a Task Force 121 seal.

Future work must not treat these filenames as ground truth for what they visually depict; treat this list as a to-do, not settled fact — verify against an authoritative source before recoloring, cropping, or otherwise trusting them.

## Product Principles

1. Unit insignia accuracy is a hard requirement — a certificate bearing the wrong unit's patch is a real defect, not a cosmetic one.
2. The certificate PNG is the deliverable a cadre member hands to or prints for a real graduate — visual correctness and print clarity outweigh interface flourish.
3. `data/catalog.json` is the single source of truth for units and course templates; extend it for new units/courses rather than hardcoding exceptions into render logic.
4. Keep the app static/serverless — no backend dependency should be introduced for what is fundamentally a client-side rendering tool.
