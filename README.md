# USAR Certificate Generator

Static GitHub Pages app that generates USAR graduation certificates (OCS first; extensible for more courses).

**Live:** https://codythebeast89.github.io/usar-certificate-generator/

## Use

1. Open the site
2. Pick course, graduate username, Division/Battalion, and Command Group
3. Download PNG

## Local preview

```bash
python3 -m http.server 8080
```

Open http://localhost:8080

## Refreshing logos

```bash
python3 scripts/import_logos.py
```

Pulls unit art from `~/Projects/forscom-website` and Roblox group icons (upscaled to ~1024px).
