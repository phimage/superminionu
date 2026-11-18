#!/usr/bin/env python3
"""Découpe / normalise une photo de vignette et l'enregistre dans images/stickers/.

Usage :
  python3 tools/add_image.py <photo> <id> [--box x,y,w,h] [--rotate deg]

  <photo>  image source (jpg/png/webp), ex. images/sources/ebay-lot-12.jpg
  <id>     numéro de la vignette tel que dans data/stickers.js ("4", "57", "P3")
  --box    rectangle à découper en pixels de l'image source (après rotation)
  --rotate rotation en degrés (sens anti-horaire) appliquée avant la découpe

Résultat : images/stickers/<ID>.webp (largeur 360 px, qualité 82) et le champ
`img` de l'entrée correspondante dans data/stickers.js est mis à jour.
Nécessite Pillow (pip install pillow).
"""
import argparse
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "images" / "stickers"
DATA = ROOT / "data" / "stickers.js"
WIDTH = 360


def file_id(sid: str) -> str:
    """'4' -> '04', '57' -> '57', 'P3' -> 'P3' (tri alphabétique propre)."""
    return sid.zfill(2) if sid.isdigit() else sid.upper()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("photo")
    ap.add_argument("id")
    ap.add_argument("--box")
    ap.add_argument("--rotate", type=float, default=0)
    a = ap.parse_args()

    sid = a.id.upper() if a.id.lower().startswith("p") else str(int(a.id))
    src = DATA.read_text(encoding="utf-8")
    pattern = re.compile(r'(\{ id: "' + re.escape(sid) + r'",[^}]*?img: )(null|"[^"]*")')
    if not pattern.search(src):
        print(f"id {sid!r} introuvable dans data/stickers.js", file=sys.stderr)
        return 1

    im = ImageOps.exif_transpose(Image.open(a.photo)).convert("RGB")
    if a.rotate:
        im = im.rotate(a.rotate, expand=True, resample=Image.BICUBIC, fillcolor="white")
    if a.box:
        x, y, w, h = (int(v) for v in a.box.split(","))
        im = im.crop((x, y, x + w, y + h))
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"{file_id(sid)}.webp"
    im.save(out, "WEBP", quality=82, method=6)

    rel = out.relative_to(ROOT).as_posix()
    DATA.write_text(pattern.sub(lambda m: f'{m.group(1)}"{rel}"', src, count=1), encoding="utf-8")
    print(f"{rel}  ({im.width}x{im.height})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
