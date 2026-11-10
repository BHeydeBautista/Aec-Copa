"""
Genera texturas de color base con el color exacto de cada superficie (tomado de la foto aérea),
conservando el detalle de las texturas de Poly Haven. Salida: blender/assets/generadas/<nombre>.jpg

Uso: python blender/scripts/preparar-texturas.py
"""
import os
from PIL import Image, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEX = os.path.join(RAIZ, "assets", "texturas")
OUT = os.path.join(RAIZ, "assets", "generadas")
os.makedirs(OUT, exist_ok=True)
TAM = 512

# nombre: (textura fuente, color objetivo, contraste del detalle)
RECETAS = {
    "solarium": ("square_tiles_02", "#d6c4a2", 0.42),  # baldosas beige
    "borde": ("square_tiles_02", "#b23c40", 0.28),
    "azulejo": ("square_tiles_02", "#a9dceb", 0.6),
    "gradas": ("painted_concrete_02", "#78b6e2", 0.35),
    "blanco": ("painted_concrete_02", "#efefea", 0.3),
    "revoque": ("white_plaster_rough_01", "#ece8df", 0.4),
    "revoque_beige": ("white_plaster_rough_01", "#dcc7a1", 0.4),
    "revoque_gris": ("white_plaster_rough_01", "#c4c8ce", 0.4),
    "chapa": ("corrugated_iron_02", "#c3c6cb", 0.6),
    "chapa_beige": ("corrugated_iron_02", "#d6c59f", 0.6),
    "pasto": ("leafy_grass", "#6e9a4c", 0.7),
    "suelo": ("asphalt_02", "#8a8986", 0.55),
    "gimnasio": ("white_plaster_rough_01", "#a9b8c8", 0.35),
    "cancha": ("concrete_floor_02", "#b9c0c4", 0.5),
    "patio": ("concrete_floor_02", "#9fa3a3", 0.6),
    "ladrillo": ("red_brick", "#9b5b45", 0.9),
    "techo_plano": ("concrete_floor_02", "#c9c6bf", 0.5),
}


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


for nombre, (fuente, color, contraste) in RECETAS.items():
    img = Image.open(os.path.join(TEX, fuente, "diff.jpg")).convert("RGB").resize((TAM, TAM), Image.LANCZOS)
    lum = ImageOps.grayscale(img)
    px = list(lum.getdata())
    media = sum(px) / len(px)
    objetivo = hex_rgb(color)
    datos = []
    for l in px:
        k = 1 + contraste * (l - media) / max(media, 1)
        datos.append(tuple(max(0, min(255, int(c * k))) for c in objetivo))
    out = Image.new("RGB", (TAM, TAM))
    out.putdata(datos)
    out.save(os.path.join(OUT, f"{nombre}.jpg"), quality=86)
    print("ok", nombre)


# ─── Lonas de sponsors (fondo blanco + logo centrado, proporción 4:1) ───────────
LOGOS = os.path.join(os.path.dirname(RAIZ), "public", "logos")
LONAS = {
    "lona_aec": ("aec.png", "#ffffff"),
    "lona_master": ("echague-natacion-master.png", "#0d1626"),
    "lona_icd": ("instituto-ciencias-deporte.png", "#ffffff"),
    "lona_sem": ("sem-emergencias.png", "#ffffff"),
}
for nombre, (archivo, fondo) in LONAS.items():
    W, Hh = 1024, 256
    lona = Image.new("RGB", (W, Hh), hex_rgb(fondo))
    logo = Image.open(os.path.join(LOGOS, archivo)).convert("RGBA")
    logo.thumbnail((int(W * 0.8), int(Hh * 0.86)), Image.LANCZOS)
    # Repetido a los costados en las lonas con logo cuadrado (como las lonas reales).
    posiciones = [((W - logo.width) // 2, (Hh - logo.height) // 2)]
    if logo.width < W * 0.4:
        posiciones += [(W // 6 - logo.width // 2, (Hh - logo.height) // 2), (5 * W // 6 - logo.width // 2, (Hh - logo.height) // 2)]
    for p in posiciones:
        lona.paste(logo, p, logo)
    lona.save(os.path.join(OUT, f"{nombre}.jpg"), quality=88)
    print("ok", nombre)
