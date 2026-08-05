"""
Renders both MWM business card designs as high-quality JPG images using Pillow.
Card dimensions: 1050 × 600 px (3.5" × 2" @ 300 DPI, print-ready).
"""

import base64, os, io, urllib.request, re
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import qrcode

OUT_DIR = "screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

# ── Font setup ────────────────────────────────────────────────────────────────
FONT_DIR = "/tmp/fonts"
os.makedirs(FONT_DIR, exist_ok=True)

def fetch_font(url, name):
    path = os.path.join(FONT_DIR, name)
    if not os.path.exists(path):
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)"
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        with open(path, "wb") as f:
            f.write(data)
    return path

FONT_URLS = {
    "playfair_bold": "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ixq5H9k_-swS.ttf",
    "playfair_reg":  "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ixq5H9k_IIo.ttf",
    "cinzel_reg":    "https://fonts.gstatic.com/s/cinzel/v23/8vIU7ww63mVu7gtRqQ.ttf",
    "lato_reg":      "https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wWg.ttf",
    "lato_light":    "https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh7USSwiP.ttf",
    "dancing":       "https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSo3ROp5.ttf",
}

print("Downloading fonts…")
fonts = {}
for key, url in FONT_URLS.items():
    try:
        fonts[key] = fetch_font(url, f"{key}.ttf")
        print(f"  ✓ {key}")
    except Exception as e:
        fonts[key] = None
        print(f"  ✗ {key}: {e}")

def get_font(key, size):
    path = fonts.get(key)
    if path and os.path.exists(path):
        return ImageFont.truetype(path, size)
    # fallback
    fallback = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if "bold" in key or "cinzel" in key or "playfair" in key else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    try:
        return ImageFont.truetype(fallback, size)
    except:
        return ImageFont.load_default()

# ── Load logo ─────────────────────────────────────────────────────────────────
print("Loading logo…")
with open("artifacts/web/public/cards/business-card-design-1.html") as f:
    html = f.read()
match = re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', html)
logo_img = None
if match:
    logo_data = base64.b64decode(match.group(1))
    logo_img = Image.open(io.BytesIO(logo_data)).convert("RGBA")
    print(f"  ✓ logo {logo_img.size}")

# ── QR code ───────────────────────────────────────────────────────────────────
QR_URL = "https://www.mappingwithmelanin.com/preview"

def make_qr(fg="#000000", bg="#FFFFFF", box=6, border=2):
    qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_M,
                        box_size=box, border=border)
    qr.add_data(QR_URL)
    qr.make(fit=True)
    img = qr.make_image(fill_color=fg, back_color=bg).convert("RGBA")
    return img

# ── Helper ────────────────────────────────────────────────────────────────────
def center_text(draw, text, font, y, width, color):
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text(((width - w) / 2, y), text, font=font, fill=color)

def draw_kente_stripe(img, x, y, w, h):
    """Draw a simplified kente-style stripe."""
    d = ImageDraw.Draw(img)
    colors = ["#2C1505", "#B8860B", "#2C1505", "#8B4513", "#B8860B", "#2C1505"]
    stripe_w = w // len(colors)
    for i, c in enumerate(colors):
        d.rectangle([x + i*stripe_w, y, x + (i+1)*stripe_w, y+h], fill=c)

def draw_grid(img, x0, y0, x1, y1, spacing, color, alpha=60):
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    d = ImageDraw.Draw(overlay)
    for x in range(x0, x1, spacing):
        d.line([(x, y0), (x, y1)], fill=color + (alpha,), width=1)
    for y in range(y0, y1, spacing):
        d.line([(x0, y), (x1, y)], fill=color + (alpha,), width=1)
    img.alpha_composite(overlay)

# Card size — 3.5" × 2" at 300 DPI
W, H = 1050, 600

# ═══════════════════════════════════════════════════════════════════════════════
# CARD 1 — Cream / Kente / Two-Panel
# ═══════════════════════════════════════════════════════════════════════════════
print("\nRendering Card 1 (Cream / Kente)…")

card1 = Image.new("RGBA", (W, H), "#F5EBD0")
d1 = ImageDraw.Draw(card1)

# ── Left panel (darker cream + kente border) ──────────────────────────────────
LW = 400
d1.rectangle([0, 0, LW, H], fill="#EDE0C4")

# Kente border: vertical stripe on left edge
kente_w = 22
stripe_colors = ["#2C1505","#B8860B","#2C1505","#8B4513","#B8860B","#2C1505","#2C1505"]
stripe_h = H // len(stripe_colors)
for i, c in enumerate(stripe_colors):
    d1.rectangle([0, i*stripe_h, kente_w, (i+1)*stripe_h], fill=c)

# Kente horizontal accent lines across the border
for y_pos in range(0, H, 42):
    d1.rectangle([0, y_pos, kente_w, y_pos+2], fill="#C9A84C")

# Subtle grid on left panel
draw_grid(card1, kente_w, 0, LW, H, 28, (139, 105, 20), 25)

# Logo on left panel
logo_y = 60
if logo_img:
    logo_size = 120
    logo_resized = logo_img.copy()
    logo_resized.thumbnail((logo_size, logo_size), Image.LANCZOS)
    lx = kente_w + (LW - kente_w - logo_resized.width) // 2
    card1.alpha_composite(logo_resized, (lx, logo_y))
    logo_bottom = logo_y + logo_resized.height + 14
else:
    logo_bottom = logo_y + 14

# Brand name
f_brand_sm  = get_font("playfair_reg", 16)
f_brand_lg  = get_font("dancing", 36)
f_cinzel    = get_font("cinzel_reg", 13)
f_lato_sm   = get_font("lato_reg", 12)
f_lato_xs   = get_font("lato_light", 10)

d1.text((kente_w + 12, logo_bottom), "MAPPING", font=get_font("cinzel_reg", 18),
        fill="#2C1505", anchor="lt")
center_text(d1, "With Melanin", get_font("dancing", 32), logo_bottom + 22, LW, "#8B6914")

# Divider
div_y = logo_bottom + 64
d1.line([(kente_w + 30, div_y), (LW - 30, div_y)], fill="#C9A84C", width=1)

# Tagline
tl_y = div_y + 12
center_text(d1, "Map Your Life. Connect Deeper.", get_font("lato_light", 10), tl_y, LW, "#2C1505")

# Compass rose placeholder (simple geometric)
cx, cy, cr = LW//2 + kente_w//2 - 10, H - 110, 38
d1.ellipse([cx-cr, cy-cr, cx+cr, cy+cr], outline="#C9A84C", width=2)
d1.ellipse([cx-cr+8, cy-cr+8, cx+cr-8, cy+cr-8], outline="#8B6914", width=1)
# N S E W marks
d1.line([(cx, cy-cr+4), (cx, cy+cr-4)], fill="#2C1505", width=2)
d1.line([(cx-cr+4, cy), (cx+cr-4, cy)], fill="#2C1505", width=2)
d1.polygon([(cx-4, cy-cr+4), (cx+4, cy-cr+4), (cx, cy-cr-6)], fill="#C9A84C")
d1.polygon([(cx-4, cy+cr-4), (cx+4, cy+cr-4), (cx, cy+cr+6)], fill="#8B6914")
center_text(d1, "N", get_font("cinzel_reg", 9), cy - cr - 18, LW, "#2C1505")

# ── Right panel (cream / contact + QR) ───────────────────────────────────────
RX = LW

# Vertical accent at panel seam
d1.line([(RX, 0), (RX, H)], fill="#C9A84C", width=2)

# Name & title
name_y = 44
d1.text((RX + 36, name_y), "Teianna Lindsay",
        font=get_font("playfair_bold", 24), fill="#2C1505")
d1.text((RX + 38, name_y + 34), "Founder & CEO",
        font=get_font("cinzel_reg", 11), fill="#8B6914")

# Divider under name
d1.line([(RX + 36, name_y + 56), (W - 36, name_y + 56)], fill="#C9A84C", width=1)

# Contact items
contacts = [
    ("🌐", "MappingWithMelanin.com"),
    ("✉", "hello@mappingwithmelanin.com"),
    ("☎", "267-616-8258"),
]
f_contact = get_font("lato_reg", 12)
cy_contact = name_y + 68
for icon, text in contacts:
    d1.text((RX + 38, cy_contact), text, font=f_contact, fill="#2C1505")
    cy_contact += 22

# QR code
qr1 = make_qr(fg="#2C1505", bg="#F5EBD0", box=4, border=2)
qr_size = 130
qr1 = qr1.resize((qr_size, qr_size), Image.LANCZOS)
qr_x = W - qr_size - 36
qr_y = name_y + 64
card1.alpha_composite(qr1, (qr_x, qr_y))

# QR label
d1.text((qr_x, qr_y + qr_size + 4), "Scan to join",
        font=get_font("lato_light", 9), fill="#8B6914")

# Footer divider
d1.line([(RX + 20, H - 40), (W - 20, H - 40)], fill="#C9A84C", width=1)
center_text(d1, "Connecting Culture, Community & Opportunity.",
            get_font("lato_light", 10), H - 28, W + RX, "#8B6914")

# Round corners & save
mask = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, W-1, H-1], radius=18, fill=255)
card1_rgb = Image.new("RGB", (W, H), "#e8e0d4")
card1_rgb.paste(card1.convert("RGB"), mask=mask)

out1 = os.path.join(OUT_DIR, "business-card-design-1.jpg")
card1_rgb.save(out1, "JPEG", quality=97, dpi=(300, 300))
print(f"  ✓ Saved {out1}")


# ═══════════════════════════════════════════════════════════════════════════════
# CARD 2 — Dark Chocolate / Gold Split
# ═══════════════════════════════════════════════════════════════════════════════
print("\nRendering Card 2 (Dark / Gold)…")

card2 = Image.new("RGBA", (W, H))
d2 = ImageDraw.Draw(card2)

# Dark left panel (60% width)
DW = 620
# Gradient-style: paint three rectangles blending dark to slightly lighter
d2.rectangle([0, 0, DW, H], fill="#1E0D03")
d2.rectangle([DW//3, 0, DW, H], fill="#2C1505")
d2.rectangle([DW*2//3, 0, DW, H], fill="#3A1C08")

# Gold grid overlay on dark panel
draw_grid(card2, 0, 0, DW, H, 30, (201, 168, 76), 30)

# Dot pattern in bottom-right of dark panel
for xi in range(DW - 80, DW, 20):
    for yi in range(H - 80, H, 20):
        d2.ellipse([xi-2, yi-2, xi+2, yi+2], fill="#C9A84C" + "50")

# Light right panel
d2.rectangle([DW, 0, W, H], fill="#F8F2E6")

# Gold seam
d2.line([(DW, 0), (DW, H)], fill="#C9A84C", width=3)
# Gradient fade: paint thin strips near seam on left panel
for i in range(20):
    alpha = int(80 * (1 - i/20))
    d2.line([(DW - i, 0), (DW - i, H)], fill=(201, 168, 76, alpha))

# ── Left panel content ────────────────────────────────────────────────────────
# Logo circle
circ_x, circ_y, circ_r = 80, H//2, 56
d2.ellipse([circ_x-circ_r, circ_y-circ_r, circ_x+circ_r, circ_y+circ_r],
           outline="#C9A84C", width=2)
if logo_img:
    logo_inner = logo_img.copy()
    inner_d = (circ_r - 4) * 2
    logo_inner.thumbnail((inner_d, inner_d), Image.LANCZOS)
    lx2 = circ_x - logo_inner.width // 2
    ly2 = circ_y - logo_inner.height // 2
    card2.alpha_composite(logo_inner, (lx2, ly2))

# Brand text (right of logo)
tx = circ_x + circ_r + 22
d2.text((tx, H//2 - 52), "MAPPING", font=get_font("cinzel_reg", 24), fill="#C9A84C")
d2.text((tx, H//2 - 20), "With", font=get_font("dancing", 22), fill="#F5EBD0")
d2.text((tx, H//2 + 4), "Melanin", font=get_font("dancing", 38), fill="#C9A84C")

# Gold bar accent
d2.rectangle([tx, H//2 + 50, tx + 180, H//2 + 52], fill="#C9A84C")

# Tagline
d2.text((tx, H//2 + 60), "Map Your Life. Connect Deeper.",
        font=get_font("lato_light", 10), fill="#F5EBD0")

# Social handle at bottom
d2.text((30, H - 32), "@mappingwithmelanin",
        font=get_font("cinzel_reg", 11), fill="#C9A84C")

# ── Right panel content ───────────────────────────────────────────────────────
RX2 = DW + 28

# Name
d2.text((RX2, 44), "Teianna Lindsay",
        font=get_font("playfair_bold", 22), fill="#1E0D03")
d2.text((RX2, 74), "Founder & CEO",
        font=get_font("cinzel_reg", 11), fill="#8B6914")

# Gold underline
d2.line([(RX2, 96), (W - 28, 96)], fill="#C9A84C", width=1)

# Choose Your Preview text above QR
d2.text((RX2, 110), "Scan to preview the app",
        font=get_font("lato_light", 10), fill="#8B6914")

# QR code
qr2 = make_qr(fg="#1E0D03", bg="#F8F2E6", box=5, border=2)
qr_size2 = 155
qr2 = qr2.resize((qr_size2, qr_size2), Image.LANCZOS)
qr2_x = RX2
qr2_y = 128
card2.alpha_composite(qr2, (qr2_x, qr2_y))

# Contact info right of QR
cx2 = qr2_x + qr_size2 + 14
d2.text((cx2, qr2_y + 10),  "MappingWithMelanin.com",
        font=get_font("lato_reg", 10), fill="#1E0D03")
d2.text((cx2, qr2_y + 30), "hello@mappingwithmelanin.com",
        font=get_font("lato_light", 9), fill="#2C1505")
d2.text((cx2, qr2_y + 48), "267-616-8258",
        font=get_font("lato_reg", 10), fill="#1E0D03")

# Join prompt
d2.line([(RX2, H - 50), (W - 28, H - 50)], fill="#C9A84C", width=1)
d2.text((RX2, H - 38), "Join the Waitlist",
        font=get_font("cinzel_reg", 11), fill="#C9A84C")
d2.text((RX2, H - 20), "Early access — limited spots.",
        font=get_font("lato_light", 9), fill="#8B6914")

# Round corners & save
mask2 = Image.new("L", (W, H), 0)
ImageDraw.Draw(mask2).rounded_rectangle([0, 0, W-1, H-1], radius=18, fill=255)
card2_rgb = Image.new("RGB", (W, H), "#d4c9b8")
card2_rgb.paste(card2.convert("RGB"), mask=mask2)

out2 = os.path.join(OUT_DIR, "business-card-design-2.jpg")
card2_rgb.save(out2, "JPEG", quality=97, dpi=(300, 300))
print(f"  ✓ Saved {out2}")

print("\n✅ Both cards rendered.")
