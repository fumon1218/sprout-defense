#!/usr/bin/env python3
"""Clean classic 2D sprite rows without leaking neighboring frames.

Example:
  python tools/clean_sprite_sheet.py input.png out_dir \
    --rows idle:4 walk:8 attack:6 death:7 --frame 320
"""
from __future__ import annotations
import argparse
from pathlib import Path
import numpy as np
import cv2
from PIL import Image

def valley_cuts(row: np.ndarray, count: int) -> list[int]:
    alpha = row[..., 3].astype(np.float32)
    proj = alpha.sum(axis=0)
    occupied = np.where(proj > 20)[0]
    if not len(occupied):
        return [0, row.shape[1]]
    left, right = int(occupied[0]), int(occupied[-1] + 1)
    spacing = (right - left) / count
    cuts = [left]
    for k in range(1, count):
        target = left + spacing * k
        radius = max(24, int(spacing * .28))
        lo, hi = max(left + 1, int(target - radius)), min(right - 1, int(target + radius))
        xs = np.arange(lo, hi + 1)
        vals = proj[lo:hi + 1]
        score = vals / (vals.max() + 1e-9) + np.abs(xs - target) / (radius + 1e-9) * .22
        cuts.append(int(xs[np.argmin(score)]))
    cuts.append(right)
    return cuts

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--rows", nargs="+", required=True, help="state:frameCount")
    ap.add_argument("--frame", type=int, default=320)
    ap.add_argument("--padding", type=int, default=24)
    args = ap.parse_args()

    src = Image.open(args.input).convert("RGBA")
    arr = np.array(src)
    rows = [(name, int(count)) for name, count in (x.split(":", 1) for x in args.rows)]
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)

    row_h = src.height / len(rows)
    for r, (state, count) in enumerate(rows):
        y0 = int(round(r * row_h))
        y1 = int(round((r + 1) * row_h))
        row = arr[y0:y1].copy()
        cuts = valley_cuts(row, count)
        frames = []
        for i in range(count):
            crop = Image.fromarray(row[:, cuts[i]:cuts[i + 1]], "RGBA")
            bbox = crop.getbbox()
            if bbox:
                crop = crop.crop(bbox)
            else:
                crop = Image.new("RGBA", (1, 1), (0, 0, 0, 0))
            padded = Image.new("RGBA", (crop.width + args.padding * 2, crop.height + args.padding * 2), (0, 0, 0, 0))
            padded.alpha_composite(crop, (args.padding, args.padding))
            crop = padded
            max_w, max_h = args.frame - 36, args.frame - 40
            scale = min(max_w / crop.width, max_h / crop.height, 1)
            crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))), Image.Resampling.LANCZOS)
            frame = Image.new("RGBA", (args.frame, args.frame), (0, 0, 0, 0))
            frame.alpha_composite(crop, ((args.frame - crop.width) // 2, args.frame - 18 - crop.height))
            frames.append(frame)
            frame.save(out / f"{state}_{i:02d}.webp", "WEBP", quality=86, method=6)

        strip = Image.new("RGBA", (args.frame * count, args.frame), (0, 0, 0, 0))
        for i, frame in enumerate(frames):
            strip.alpha_composite(frame, (i * args.frame, 0))
        strip.save(out / f"{state}_strip.webp", "WEBP", quality=86, method=6)

if __name__ == "__main__":
    main()
