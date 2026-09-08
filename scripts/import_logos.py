#!/usr/bin/env python3
"""Re-import and upscale logos from forscom-website + Roblox group icons."""

from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path.home() / "Projects" / "forscom-website" / "public"
CONFIG = json.loads((SRC / "api-data" / "site-config.json").read_text())
OUT = ROOT / "assets" / "logos"
TARGET = 1024


def upscale(im: Image.Image, target: int = TARGET) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    scale = target / max(w, h)
    if abs(scale - 1) < 0.01:
        return im
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    cur = im
    while max(cur.size) * 2 < max(nw, nh):
        cur = cur.resize((cur.size[0] * 2, cur.size[1] * 2), Image.Resampling.LANCZOS)
    return cur.resize((nw, nh), Image.Resampling.LANCZOS)


def save_upscaled(src_path: Path, dest: Path) -> Path:
    dest = dest.with_suffix(".png")
    dest.parent.mkdir(parents=True, exist_ok=True)
    upscale(Image.open(src_path)).save(dest, "PNG")
    return dest


def rel_from_site(logo_url: str) -> Path | None:
    if not logo_url:
        return None
    path = logo_url.split("?")[0]
    if path.startswith("/images/"):
        return SRC / path.lstrip("/")
    if path.startswith("images/"):
        return SRC / path
    return None


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def build_units() -> list[dict]:
    units_out = []
    mapping = {"1CAV": "1cav.png", "101st": "101st.png", "1ID": "1id.png", "82nd": "82nd.png"}
    for unit in CONFIG.get("units", []):
        u_entry = {
            "id": unit.get("abbr") or unit.get("name"),
            "name": unit.get("name"),
            "abbr": unit.get("abbr"),
            "type": "division",
            "logo": None,
            "brigades": [],
        }
        src = rel_from_site(unit.get("logo", ""))
        if not src or not src.exists():
            cand = SRC / "images" / "logos" / mapping.get(unit.get("abbr"), "")
            if cand.exists():
                src = cand
        if src and src.exists():
            dest = OUT / "divisions" / f"{slugify(u_entry['id'])}.png"
            save_upscaled(src, dest)
            u_entry["logo"] = f"assets/logos/divisions/{dest.name}"
        for brig in unit.get("subUnits", []) or []:
            b_entry = {
                "id": brig.get("abbr") or brig.get("name"),
                "name": brig.get("name"),
                "abbr": brig.get("abbr"),
                "type": "brigade",
                "logo": None,
                "companies": [],
            }
            bsrc = rel_from_site(brig.get("logo", ""))
            if bsrc and bsrc.exists():
                dest = OUT / "brigades" / f"{slugify(u_entry['id'])}-{slugify(brig.get('name') or 'brig')}.png"
                save_upscaled(bsrc, dest)
                b_entry["logo"] = f"assets/logos/brigades/{dest.name}"
            for co in brig.get("companies", []) or []:
                c_entry = {
                    "id": co.get("abbr") or co.get("name"),
                    "name": co.get("name"),
                    "abbr": co.get("abbr"),
                    "type": "company",
                    "logo": None,
                }
                csrc = rel_from_site(co.get("logo", ""))
                if csrc and csrc.exists():
                    dest = OUT / "companies" / f"{slugify(u_entry['id'])}-{slugify(co.get('name') or 'co')}.png"
                    save_upscaled(csrc, dest)
                    c_entry["logo"] = f"assets/logos/companies/{dest.name}"
                b_entry["companies"].append(c_entry)
            u_entry["brigades"].append(b_entry)
        units_out.append(u_entry)
    return units_out


def fetch_groups() -> list[dict]:
    groups = CONFIG.get("tracked_groups", [])
    ids = ",".join(str(g["id"]) for g in groups)
    api = (
        "https://thumbnails.roblox.com/v1/groups/icons"
        f"?groupIds={ids}&size=420x420&format=Png&isCircular=false"
    )
    data = {"data": []}
    try:
        req = urllib.request.Request(api, headers={"User-Agent": "usar-certificate-generator/1.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode())
    except Exception as exc:  # noqa: BLE001
        print("Roblox batch fetch failed, falling back to cached CDN URLs:", exc)

    by_id = {item["targetId"]: item for item in data.get("data", [])}
    tracked_out = []
    for g in groups:
        slug = slugify(g["abbr"])
        dest = OUT / "groups" / f"{slug}.png"
        entry = {
            "id": g["id"],
            "name": g["name"],
            "abbr": g["abbr"],
            "category": g.get("category"),
            "logo": None,
            "source": "roblox",
        }
        item = by_id.get(g["id"])
        url = None
        if item and item.get("state") == "Completed" and item.get("imageUrl"):
            url = item["imageUrl"]
        elif g.get("logo"):
            url = g["logo"]
        if url:
            try:
                r = urllib.request.Request(url, headers={"User-Agent": "usar-certificate-generator/1.0"})
                with urllib.request.urlopen(r, timeout=30) as resp:
                    raw = resp.read()
                tmp = dest.with_suffix(".tmp.png")
                tmp.write_bytes(raw)
                save_upscaled(tmp, dest)
                tmp.unlink(missing_ok=True)
                entry["logo"] = f"assets/logos/groups/{dest.name}"
                print("OK", g["abbr"])
            except Exception as exc:  # noqa: BLE001
                print("FAIL", g["abbr"], exc)
        tracked_out.append(entry)
        time.sleep(0.05)
    return tracked_out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    forscom_src = SRC / "images" / "logos" / "forscom-ssi-512.png"
    if forscom_src.exists():
        save_upscaled(forscom_src, OUT / "misc" / "forscom.png")

    units_out = build_units()
    tracked_out = fetch_groups()

    au = next((t for t in tracked_out if t["abbr"] == "AU"), None)
    au_course_logo = None
    if au and au.get("logo"):
        dest = save_upscaled(ROOT / au["logo"], OUT / "courses" / "army-university.png")
        au_course_logo = f"assets/logos/courses/{dest.name}"

    forscom_logo = next((t["logo"] for t in tracked_out if t["abbr"] == "FORSCOM" and t.get("logo")), "assets/logos/misc/forscom.png")

    courses = [
        {
            "id": "ocs",
            "name": "Officer Candidate School",
            "shortName": "OCS",
            "enabled": True,
            "certificateTitle": "Officer Candidate School",
            "certificateSubtitle": "Certificate of Graduation",
            "bodyTemplate": (
                "This is to certify that Candidate {graduate} of the {division} has successfully "
                "completed the prescribed course of instruction and satisfied all requirements of "
                "{course}, demonstrating the professionalism, trustworthiness, and courage expected "
                "of a commissioned officer."
            ),
            "watermarkLogo": au_course_logo or (au["logo"] if au else None),
            "defaultRightLogo": forscom_logo,
            "defaultRightLabel": "Forces Command",
            "rightSignatoryTitle": "Brigade Commanding Officer,",
            "rightSignatoryOrg": "Army University",
            "leftSignatoryTitle": "Division Commanding General,",
            "defaultLocation": "Fort Jackson",
            "candidateLabel": "Candidate",
        }
    ]

    command_abbrs = {
        "forscom": "FORSCOM",
        "mpc": "MPC",
        "tradoc": "TRADOC",
        "asoc": "ASOC",
        "aac": "AAC",
        "usar": "USAR",
    }
    by_abbr = {g["abbr"]: g for g in tracked_out}
    command_groups = []
    for cat, abbr in command_abbrs.items():
        g = by_abbr.get(abbr)
        if g and g.get("logo"):
            command_groups.append({
                "id": abbr,
                "abbr": abbr,
                "name": g["name"],
                "category": cat,
                "logo": g["logo"],
                "robloxId": g["id"],
            })
    divisions = []
    for g in tracked_out:
        cat = g.get("category")
        if cat not in command_abbrs:
            continue
        parent = command_abbrs[cat]
        if g["abbr"] == parent or not g.get("logo"):
            continue
        name = g["name"]
        low = name.lower()
        tier = "division"
        if "battalion" in low or g["abbr"] in ("503rd", "ORB"):
            tier = "battalion"
        elif "brigade" in low or g["abbr"] in ("14th", "165th"):
            tier = "brigade"
        elif "regiment" in low or g["abbr"] in ("75th", "160th"):
            tier = "regiment"
        elif any(x in low for x in ("school", "academy", "college", "university", "centre", "center")):
            tier = "school"
        elif "corps" in low:
            tier = "corps"
        elif "command" in low:
            tier = "subcommand"
        divisions.append({
            "id": g["abbr"],
            "abbr": g["abbr"],
            "name": g["name"],
            "command": parent,
            "category": cat,
            "tier": tier,
            "logo": g["logo"],
            "robloxId": g["id"],
        })
    order = ["forscom", "mpc", "tradoc", "asoc", "aac", "usar"]
    divisions.sort(key=lambda d: (order.index(d["category"]) if d["category"] in order else 99, d["name"]))

    catalog = {
        "courses": courses,
        "units": units_out,
        "commandGroups": command_groups,
        "divisions": divisions,
        "trackedGroups": tracked_out,
        "meta": {
            "logoTargetPx": TARGET,
            "source": "forscom-website site-config + Roblox group icons",
        },
    }
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "catalog.json").write_text(json.dumps(catalog, indent=2))
    print("Wrote catalog:", len(units_out), "divisions,", len(tracked_out), "groups")


if __name__ == "__main__":
    main()
