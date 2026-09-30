"""Convert Gemini-generated PNGs into transparent, cropped, web-sized WebP sprites.
Usage: python3 tools/process_images.py <input_dir> <output_dir>
"""
import sys, glob, os
import numpy as np
from PIL import Image, ImageFilter

NAMES = {
 '1ln1':'weapon_s','27bf':'map_curve','4xd8':'hero_stage3','56rg':'map_pad','5eyt':'map_core',
 '5jxh':'tower_vine','6jt8':'hero_stage2','9g8l':'weapon_c','d2pi':'enemy_flyer','eno4':'tower_wall',
 'lxe6':'enemy_crawler','nftw':'enemy_golem','o3ho':'tower_mortar','p4lu':'enemy_soldier','qx2j':'tower_ballista',
 'rito':'weapon_f','sh18':'map_decor','the0':'map_path','x6fn':'enemy_boss','yblx':'hero_stage1'}

def estimate_bg(arr):
    h, w, _ = arr.shape
    sw, sh = 64, 36
    small = np.array(Image.fromarray(arr).resize((sw, sh), Image.BILINEAR)).astype(np.float32)
    med = np.median(np.concatenate([small[0], small[-1], small[:, 0], small[:, -1]]), axis=0)
    mask = np.abs(small - med).max(axis=2) > 14          # probably foreground
    bg = small.copy(); bg[mask] = med
    known = ~mask
    for _ in range(120):                                   # diffuse known bg into masked area
        pad = np.pad(bg, ((1, 1), (1, 1), (0, 0)), mode='edge')
        avg = (pad[:-2, 1:-1] + pad[2:, 1:-1] + pad[1:-1, :-2] + pad[1:-1, 2:]) / 4
        bg = np.where(known[..., None], small, avg)
    return np.array(Image.fromarray(bg.astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32)

def process(src, dst, maxside=512):
    im = Image.open(src).convert('RGB'); arr = np.array(im)
    h, w, _ = arr.shape
    bg = estimate_bg(arr)
    diff = np.abs(arr.astype(np.float32) - bg).max(axis=2)
    alpha = np.clip((diff - 12) / 18, 0, 1)
    # Gemini sparkle watermark (bottom-right): keep only pixels darker than background there
    cx, cy = int(w * 0.911), int(h * 0.845)
    rx, ry = int(w * 0.03), int(h * 0.055)
    lum = arr.mean(axis=2); bl = bg.mean(axis=2)
    box = np.zeros((h, w), bool); box[cy - ry:cy + ry, cx - rx:cx + rx] = True
    alpha[box & (lum >= bl - 6)] = 0
    a = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    a = a.filter(ImageFilter.GaussianBlur(0.6))
    out = im.convert('RGBA'); out.putalpha(a)
    bbox = a.point(lambda v: 255 if v > 60 else 0).getbbox()
    pad = 6
    bbox = (max(bbox[0]-pad,0), max(bbox[1]-pad,0), min(bbox[2]+pad,w), min(bbox[3]+pad,h))
    out = out.crop(bbox)
    s = maxside / max(out.size)
    if s < 1: out = out.resize((round(out.width*s), round(out.height*s)), Image.LANCZOS)
    out.save(dst, 'WEBP', quality=88, method=6)
    return out.size

if __name__ == '__main__':
    src_dir, dst_dir = sys.argv[1], sys.argv[2]
    os.makedirs(dst_dir, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(src_dir, '*Gemini*.png'))):
        key = os.path.basename(f).split('_')[-1][:4]
        name = NAMES.get(key)
        if not name: print('skip', f); continue
        print(name, process(f, os.path.join(dst_dir, name + '.webp')))
