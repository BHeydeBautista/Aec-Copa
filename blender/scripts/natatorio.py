"""
Natatorio del Atlético Echagüe Club — modelo procedural para la web, armado a partir de fotos del club.

Uso (desde la raíz del proyecto):
  blender --background --python blender/scripts/natatorio.py -- preview [movil]
  blender --background --python blender/scripts/natatorio.py -- bake

Ejes: Blender es Z-arriba. La pileta corre a lo largo de Y; partidores y toldo están en +Y.
Al exportar a glTF (Y-arriba): three.x = x, three.y = z, three.z = -y.
El agua de la pileta grande NO se exporta: la dibuja el shader interactivo de la web.

Todo se ubica respecto de la pileta (ML / MA): cambiar LARGO o ANCHO reacomoda la escena.
"""

import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import detalles  # noqa: E402
from base import (  # noqa: E402
    ASSETS,
    MAT,
    SALIDA,
    caja,
    caja_min_max,
    cilindro,
    coleccion,
    convertir_a_malla,
    crear_materiales,
    material,
    objeto_desde_bm,
    prisma,
    tubo,
    unir,
)

random.seed(7)

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
MODO = ARGS[0] if ARGS else "preview"

# ─── Medidas (metros) ───────────────────────────────────────────────────────────
LARGO, ANCHO = 25.0, 16.0  # pileta semiolímpica de 6 andariveles
ANDARIVELES = 6
ML, MA = LARGO / 2, ANCHO / 2
BORDE = 0.8  # borde de baldosa roja
H = 0.42  # altura del solárium sobre el nivel del agua (se ve la franja de azulejo + rebalse)
E = MA + BORDE  # borde exterior lateral
CENTROS_ANDARIVEL = [-MA + 0.5 + 2.5 * (i + 0.5) for i in range(ANDARIVELES)]

# Zonas alrededor (todas relativas a la pileta)
X_SOL_O = -(E + 9.5)  # fin del solárium oeste (empieza el jardín/gimnasio)
X_TRIB = E + 3.0  # inicio de la tribuna (lado este)
Y_FRENTE = -(ML + 8.0)  # alambrado con las canchas
Y_FONDO = ML + 19.0  # fin del solárium al fondo


def materiales_extra():
    MAT["gimnasio"] = material("Gimnasio", "gimnasio", "white_plaster_rough_01")
    MAT["columna"] = material("ColumnaOscura", color="#2c3540", rough=0.6)
    MAT["carpa"] = material("Carpa", color="#eef0f2", rough=0.7)
    MAT["bandera_a"] = material("BanderaAzulF", color="#3567c9", rough=0.7)
    MAT["bandera_g"] = material("BanderaGris", color="#4b525c", rough=0.7)
    MAT["rebalse"] = material("Rebalse", color="#1d2a33", rough=0.6)
    MAT["contrahuella"] = material("Contrahuella", color="#2a2f36", rough=0.8)


def suavizar(ob):
    """Sombreado suave (normales interpoladas): saca el aspecto facetado de copas y troncos."""
    if ob:
        for p in ob.data.polygons:
            p.use_smooth = True


# ─── Pileta ─────────────────────────────────────────────────────────────────────


def pileta(col):
    """Paredes de azulejo, rebalse oscuro, borde de baldosa roja y escaleras."""
    prof = -2.0
    t = 0.3
    unir(
        "PiletaParedes",
        [
            caja_min_max("pared_o", (-MA - t, -ML - t, prof), (-MA, ML + t, H), MAT["azulejo"], col, 1.0),
            caja_min_max("pared_e", (MA, -ML - t, prof), (MA + t, ML + t, H), MAT["azulejo"], col, 1.0),
            caja_min_max("pared_s", (-MA, -ML - t, prof), (MA, -ML, H), MAT["azulejo"], col, 1.0),
            caja_min_max("pared_n", (-MA, ML, prof), (MA, ML + t, H), MAT["azulejo"], col, 1.0),
        ],
    )
    # Rebalse: línea oscura a la altura del agua, apenas metida en la pared.
    g0, g1 = -0.04, 0.09
    unir(
        "Rebalse",
        [
            caja_min_max("r_o", (-MA - 0.06, -ML, g0), (-MA + 0.005, ML, g1), MAT["rebalse"], col, 1.0),
            caja_min_max("r_e", (MA - 0.005, -ML, g0), (MA + 0.06, ML, g1), MAT["rebalse"], col, 1.0),
            caja_min_max("r_s", (-MA, -ML - 0.06, g0), (MA, -ML + 0.005, g1), MAT["rebalse"], col, 1.0),
            caja_min_max("r_n", (-MA, ML - 0.005, g0), (MA, ML + 0.06, g1), MAT["rebalse"], col, 1.0),
        ],
    )

    z0, z1 = H - 0.1, H + 0.05
    b = BORDE
    unir(
        "BordeRojo",
        [
            caja_min_max("b_o", (-MA - b, -ML - b, z0), (-MA, ML + b, z1), MAT["borde"], col, 1.0),
            caja_min_max("b_e", (MA, -ML - b, z0), (MA + b, ML + b, z1), MAT["borde"], col, 1.0),
            caja_min_max("b_s", (-MA, -ML - b, z0), (MA, -ML, z1), MAT["borde"], col, 1.0),
            caja_min_max("b_n", (-MA, ML, z0), (MA, ML + b, z1), MAT["borde"], col, 1.0),
        ],
    )

    esc = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            xb = sx * MA
            y = sy * (ML - 1.6)
            for dy in (-0.3, 0.3):
                pts = [
                    (xb + sx * 0.7, y + dy, H),
                    (xb + sx * 0.7, y + dy, H + 0.8),
                    (xb + sx * 0.4, y + dy, H + 1.0),
                    (xb + sx * 0.02, y + dy, H + 0.9),
                    (xb - sx * 0.12, y + dy, H + 0.4),
                    (xb - sx * 0.12, y + dy, -1.0),
                ]
                esc.append(tubo("escalera", pts, 0.025, MAT["metal"], col))
    unir("Escaleras", esc)

    caja_min_max("AguaPreview", (-MA, -ML, -0.05), (MA, ML, 0.0), MAT["agua_preview"], coleccion("PREVIEW"))


def solarium(col):
    """Solárium con hueco para la pileta, pasto del jardín oeste y suelo de la ciudad."""
    x0, x1 = X_SOL_O, X_TRIB + 0.5
    y0, y1 = Y_FRENTE, Y_FONDO
    z0, z1 = -0.3, H
    hx, hy = MA + 0.3, ML + 0.3
    unir(
        "Solarium",
        [
            caja_min_max("s_o", (x0, y0, z0), (-hx, y1, z1), MAT["solarium"], col, 2.0),
            caja_min_max("s_e", (hx, y0, z0), (x1, y1, z1), MAT["solarium"], col, 2.0),
            caja_min_max("s_s", (-hx, y0, z0), (hx, -hy, z1), MAT["solarium"], col, 2.0),
            caja_min_max("s_n", (-hx, hy, z0), (hx, y1, z1), MAT["solarium"], col, 2.0),
        ],
    )
    unir(
        "Pasto",
        [
            caja_min_max("p1", (X_SOL_O, -ML - 1.0, z1), (-(E + 4.8), ML + 3.0, z1 + 0.04), MAT["pasto"], col, 4.0),
            caja_min_max("p2", (X_SOL_O, Y_FRENTE + 0.2, z1), (-(E + 1.5), -ML - 4.0, z1 + 0.04), MAT["pasto"], col, 4.0),
        ],
    )
    # Suelo de la ciudad con hueco para la pileta (debajo del agua transparente se ve el fondo real).
    sl = coleccion("SIN_LUZ")
    R, z0s, z1s = 170, -0.8, -0.4
    unir(
        "Suelo",
        [
            caja_min_max("su_o", (-R, -R, z0s), (-hx, R, z1s), MAT["suelo"], sl, 6.0),
            caja_min_max("su_e", (hx, -R, z0s), (R, R, z1s), MAT["suelo"], sl, 6.0),
            caja_min_max("su_s", (-hx, -R, z0s), (hx, -hy, z1s), MAT["suelo"], sl, 6.0),
            caja_min_max("su_n", (-hx, hy, z0s), (hx, R, z1s), MAT["suelo"], sl, 6.0),
        ],
    )


def tribuna(col):
    """Tribuna celeste: escalones, contrahuellas con drenajes, escaleras de los extremos y muros blancos escalonados."""
    x_ini, y0, y1 = X_TRIB, -ML - 2.0, ML + 1.5
    paso, alto, n = 0.8, 0.42, 14
    escalones = [
        caja_min_max(f"esc{i}", (x_ini + i * paso, y0, 0), (x_ini + (i + 1) * paso, y1, H + (i + 1) * alto), MAT["gradas"], col)
        for i in range(n)
    ]
    unir("Gradas", escalones)

    detalles = []
    # Escaleras de circulación junto a los muros: contrahuellas oscuras (como en la foto).
    for yc0, yc1 in ((y0, y0 + 1.3), (y1 - 1.3, y1)):
        for i in range(n):
            x = x_ini + i * paso
            ztop = H + (i + 1) * alto
            for k in (0, 1):
                xa = x + k * paso / 2
                zk = ztop - alto / 2 * (1 - k)
                detalles.append(caja_min_max("esc_c", (xa, yc0, zk - alto / 2), (xa + 0.03, yc1, zk), MAT["contrahuella"], col, 1.0))
                detalles.append(caja_min_max("esc_h", (xa, yc0, zk - 0.02), (xa + paso / 2, yc1, zk + 0.01), MAT["gradas"], col, 1.0))
    # Drenajes: cuadraditos oscuros en las contrahuellas.
    for i in range(n):
        x = x_ini + i * paso
        zm = H + i * alto + alto * 0.45
        y = y0 + 3.0
        while y < y1 - 3.0:
            detalles.append(caja_min_max("dren", (x - 0.02, y, zm), (x + 0.01, y + 0.16, zm + 0.14), MAT["contrahuella"], col, 1.0))
            y += 4.2
    unir("TribunaDetalles", detalles)

    x_fin = x_ini + n * paso
    techo_z = H + n * alto
    # Muros blancos escalonados que siguen a la tribuna.
    perfil = [(x_ini, 0), (x_fin + 0.4, 0), (x_fin + 0.4, techo_z + 1.3)]
    for i in range(n - 1, -1, -1):
        z = H + (i + 1) * alto + 0.55
        perfil += [(x_ini + (i + 1) * paso, z), (x_ini + i * paso, z)]
    unir(
        "TribunaMuros",
        [
            prisma("muro_s", perfil, y0 - 0.35, y0, MAT["blanco"], col),
            prisma("muro_n", perfil, y1, y1 + 0.35, MAT["blanco"], col),
            caja_min_max("muro_fondo", (x_fin, y0 - 0.35, 0), (x_fin + 0.4, y1 + 0.35, techo_z + 1.3), MAT["blanco"], col),
        ],
    )
    bar = [tubo("baranda", [(x_fin - 0.1, y0, techo_z + 1.0), (x_fin - 0.1, y1, techo_z + 1.0)], 0.03, MAT["metal"], col)]
    for y in range(int(y0), int(y1) + 1, 3):
        bar.append(cilindro("bpost", (x_fin - 0.1, y, techo_z), (x_fin - 0.1, y, techo_z + 1.0), 0.025, MAT["metal"], col))
    unir("TribunaBaranda", bar)
    return x_fin


def toldo_partidores(col):
    """Toldo azul largo sobre el extremo de los partidores, con la carpa blanca detrás."""
    y_borde = ML + BORDE
    tx0, tx1 = -MA - 2.0, MA + 2.0
    ty0, ty1 = y_borde + 0.6, y_borde + 6.0
    bm = bmesh.new()
    v = [bm.verts.new(p) for p in ((tx0, ty0, H + 3.0), (tx1, ty0, H + 3.0), (tx1, ty1, H + 3.6), (tx0, ty1, H + 3.6))]
    bm.faces.new(v)
    tela = objeto_desde_bm("toldo_tela", bm, MAT["toldo"], col)
    # Faldón frontal.
    fald = caja_min_max("faldon", (tx0, ty0 - 0.03, H + 2.55), (tx1, ty0 + 0.03, H + 3.0), MAT["toldo"], col, 1.0)
    partes = [tela, fald]
    for x in (tx0, -MA / 2, 0, MA / 2, tx1):
        partes.append(cilindro("tposte", (x, ty0, H), (x, ty0, H + 3.0), 0.05, MAT["carpa"], col))
        partes.append(cilindro("tposte2", (x, ty1, H), (x, ty1, H + 3.6), 0.05, MAT["carpa"], col))
    unir("Toldo", partes)
    # Carpa blanca detrás (paredes de lona) y la tarima con bancos.
    unir(
        "Carpa",
        [
            caja_min_max("carpa_fondo", (tx0, ty1, H), (tx1, ty1 + 0.15, H + 3.0), MAT["carpa"], col, 1.0),
            prisma("carpa_techo", [(tx0, H + 3.0), (tx1, H + 3.0), (0, H + 4.2)], ty1, ty1 + 3.5, MAT["carpa"], col, 1.0),
            caja_min_max("tarima", (tx0 + 0.5, ty1 - 1.2, H), (tx1 - 0.5, ty1, H + 0.45), MAT["hormigon"], col, 1.0),
        ],
    )


def partidores(col):
    """Partidores: estructura blanca, tapa negra inclinada, placa con número y manija."""
    y_borde = ML + BORDE
    blancos, tops, nums = [], [], []
    for i, x in enumerate(CENTROS_ANDARIVEL):
        # Patas/estructura blanca (marco abierto como en las fotos).
        for dx in (-0.22, 0.22):
            blancos.append(caja_min_max("pata", (x + dx - 0.04, y_borde - 0.5, H), (x + dx + 0.04, y_borde - 0.42, H + 0.62), MAT["partidor"], col, 1.0))
            blancos.append(caja_min_max("pata2", (x + dx - 0.04, y_borde - 0.05, H), (x + dx + 0.04, y_borde + 0.03, H + 0.7), MAT["partidor"], col, 1.0))
        blancos.append(caja_min_max("marco", (x - 0.27, y_borde - 0.55, H + 0.6), (x + 0.27, y_borde + 0.05, H + 0.68), MAT["partidor"], col, 1.0))
        perfil = [(x - 0.27, H + 0.68), (x + 0.27, H + 0.68), (x + 0.27, H + 0.74), (x - 0.27, H + 0.74)]
        top = prisma(f"ptop{i}", perfil, y_borde - 0.58, y_borde + 0.05, MAT["partidor_top"], col, 1.0)
        for v in top.data.vertices:
            if v.co.z > H + 0.7:
                v.co.z += (v.co.y - (y_borde + 0.05)) * 0.16
        tops.append(top)
        # Placa blanca con el número, mirando a la pileta.
        blancos.append(caja_min_max("placa", (x - 0.16, y_borde - 0.53, H + 0.2), (x + 0.16, y_borde - 0.5, H + 0.5), MAT["partidor"], col, 1.0))
        blancos.append(tubo("manija", [(x - 0.2, y_borde - 0.5, H + 0.66), (x - 0.2, y_borde - 0.62, H + 0.72), (x + 0.2, y_borde - 0.62, H + 0.72), (x + 0.2, y_borde - 0.5, H + 0.66)], 0.018, MAT["metal"], col))
        cu = bpy.data.curves.new(f"num{i}", "FONT")
        cu.body = str(i + 1)
        cu.size = 0.24
        cu.align_x = "CENTER"
        cu.extrude = 0.01
        cu.resolution_u = 2
        ob = bpy.data.objects.new(f"num{i}", cu)
        col.objects.link(ob)
        ob.location = (x, y_borde - 0.545, H + 0.27)
        ob.rotation_euler = (math.pi / 2, 0, math.pi)
        nums.append(convertir_a_malla(ob, MAT["numero"]))
    unir("Partidores", blancos)
    unir("PartidoresTop", tops)
    unir("PartidoresNum", nums)


def banderines(col):
    """Banderines de espalda (azules y grises) a 5 m de cada pared."""
    partes = []
    colores = [MAT["bandera_a"], MAT["bandera_g"]]
    for sy in (-1, 1):
        y = sy * (ML - 5.0)
        xa, xb = -E - 0.6, E + 0.6
        partes.append(cilindro("poste_a", (xa, y, H), (xa, y, H + 2.0), 0.04, MAT["metal"], col))
        partes.append(cilindro("poste_b", (xb, y, H), (xb, y, H + 2.0), 0.04, MAT["metal"], col))
        partes.append(cilindro("soga", (xa, y, H + 1.95), (xb, y, H + 1.95), 0.008, MAT["bandera_b"], col, lados=4))
        x, i = xa + 0.3, 0
        while x < xb - 0.3:
            bm = bmesh.new()
            # Leve caída de la soga hacia el centro.
            zc = H + 1.95 - 0.25 * (1 - (x / xb) ** 2)
            a = bm.verts.new((x - 0.15, y, zc))
            b = bm.verts.new((x + 0.15, y, zc))
            c = bm.verts.new((x, y, zc - 0.32))
            bm.faces.new((a, b, c))
            partes.append(objeto_desde_bm("band", bm, colores[i % 2], col, 1.0))
            x += 0.36
            i += 1
    unir("Banderines", partes)


def torre_clavados(col):
    """Torre de clavados de hormigón en la esquina delantera este."""
    cx, cy = E + 1.4, -ML - 2.4
    partes = [
        caja_min_max("columna", (cx - 0.7, cy - 0.7, 0), (cx + 0.7, cy + 0.7, H + 4.6), MAT["hormigon"], col, 2.0),
        caja_min_max("plataforma", (cx - 2.6, cy - 1.0, H + 4.6), (cx + 0.8, cy + 1.0, H + 4.9), MAT["hormigon"], col, 2.0),
    ]
    for k in range(13):
        z = H + k * 0.35
        partes.append(caja_min_max("pelda", (cx + 0.8, cy - 4.6 + k * 0.3, z), (cx + 1.6, cy - 4.3 + k * 0.3, z + 0.08), MAT["hormigon"], col, 1.0))
    partes += [
        tubo("bt1", [(cx - 2.5, cy - 0.95, H + 4.9), (cx - 2.5, cy - 0.95, H + 5.9), (cx + 0.7, cy - 0.95, H + 5.9)], 0.03, MAT["metal"], col),
        tubo("bt2", [(cx - 2.5, cy + 0.95, H + 4.9), (cx - 2.5, cy + 0.95, H + 5.9), (cx + 0.7, cy + 0.95, H + 5.9)], 0.03, MAT["metal"], col),
    ]
    unir("TorreClavados", partes)


def pileta_ninos(col):
    c = (-(E + 3.2), -ML - 5.0)
    unir("PiletaNinos", [cilindro("pn_borde", (c[0], c[1], 0.0), (c[0], c[1], H + 0.15), 2.0, MAT["azulejo"], col, lados=28)])
    cilindro("AguaNinos", (c[0], c[1], H + 0.1), (c[0], c[1], H + 0.13), 1.75, MAT["agua_ninos"], coleccion("SIN_LUZ"), lados=28)


def pileta_chica(col):
    """Pileta chica al fondo, a la izquierda del toldo."""
    x0, x1 = -MA - 3.0, -1.0
    y0, y1 = ML + BORDE + 8.5, ML + BORDE + 15.0
    unir(
        "PiletaChicaBorde",
        [
            caja_min_max("pc_o", (x0 - 0.5, y0 - 0.5, H - 0.12), (x0, y1 + 0.5, H + 0.05), MAT["blanco"], col),
            caja_min_max("pc_e", (x1, y0 - 0.5, H - 0.12), (x1 + 0.5, y1 + 0.5, H + 0.05), MAT["blanco"], col),
            caja_min_max("pc_s", (x0, y0 - 0.5, H - 0.12), (x1, y0, H + 0.05), MAT["blanco"], col),
            caja_min_max("pc_n", (x0, y1, H - 0.12), (x1, y1 + 0.5, H + 0.05), MAT["blanco"], col),
            caja_min_max("pc_fondo", (x0, y0, -1.25), (x1, y1, -1.2), MAT["azulejo"], col, 1.0),
        ],
    )
    caja_min_max("AguaChica", (x0, y0, -0.2), (x1, y1, H - 0.2), MAT["agua_chica"], coleccion("SIN_LUZ"))


def ventanas_fachada(lista, eje, valor, desde, hasta, z_pisos, mat, col, ancho=1.4, paso=2.6, alto=1.3):
    for z in z_pisos:
        t = desde + 1.0
        while t + ancho < hasta - 0.8:
            if eje == "x":
                lista.append(caja_min_max("v", (valor - 0.06, t, z), (valor + 0.06, t + ancho, z + alto), mat, col, 1.0))
            else:
                lista.append(caja_min_max("v", (t, valor - 0.06, z), (t + ancho, valor + 0.06, z + alto), mat, col, 1.0))
            t += paso


def torre_ciudad(paredes, franjas, x, y, w, d, pisos, mat, col):
    h = pisos * 2.9
    x0, x1, y0, y1 = x - w / 2, x + w / 2, y - d / 2, y + d / 2
    paredes.append(caja_min_max("torre", (x0, y0, 0), (x1, y1, h), mat, col, 3.0))
    for k in range(1, pisos):
        z = k * 2.9 + 0.9
        franjas.append(caja_min_max("f", (x0 - 0.05, y0 + 0.6, z), (x0 + 0.05, y1 - 0.6, z + 1.1), MAT["franja_oscura"], col, 1.0))
        franjas.append(caja_min_max("f", (x1 - 0.05, y0 + 0.6, z), (x1 + 0.05, y1 - 0.6, z + 1.1), MAT["franja_oscura"], col, 1.0))
        franjas.append(caja_min_max("f", (x0 + 0.6, y0 - 0.05, z), (x1 - 0.6, y0 + 0.05, z + 1.1), MAT["franja_oscura"], col, 1.0))
        franjas.append(caja_min_max("f", (x0 + 0.6, y1 - 0.05, z), (x1 - 0.6, y1 + 0.05, z + 1.1), MAT["franja_oscura"], col, 1.0))


def edificios(col, x_fin_tribuna):
    paredes, techos, vidrios, franjas, columnas = [], [], [], [], []
    ciudad, ciudad_techos = [], []  # barrio y edificios lejanos: sin lightmap

    # Gimnasio: fachada gris azulada hacia la pileta, columnas oscuras inclinadas y banda de ventanas arriba.
    gx0, gx1, gy0, gy1, gh = X_SOL_O - 32.0, X_SOL_O - 0.6, -ML - 2.0, Y_FONDO + 2.0, 10.0
    paredes.append(caja_min_max("gim", (gx0, gy0, 0), (gx1, gy1, gh), MAT["gimnasio"], col, 3.0))
    techos.append(prisma("gim_techo", [(gx0 - 0.4, gh), (gx1 + 0.4, gh), ((gx0 + gx1) / 2, gh + 4.5)], gy0 - 0.4, gy1 + 0.4, MAT["chapa"], col, 2.0))
    vidrios.append(caja_min_max("banda", (gx1 - 0.05, gy0 + 1.0, gh - 2.6), (gx1 + 0.06, gy1 - 1.0, gh - 1.1), MAT["vidrio"], col, 1.0))
    y = gy0 + 2.0
    while y < gy1 - 2.0:
        bm = bmesh.new()
        base = [(gx1, y, 0.0), (gx1 + 1.4, y, 0.0), (gx1 + 0.35, y, gh), (gx1 - 0.05, y, gh)]
        a = [bm.verts.new(p) for p in base]
        b = [bm.verts.new((p[0], p[1] + 0.45, p[2])) for p in base]
        bm.faces.new(list(reversed(a)))
        bm.faces.new(b)
        for k in range(4):
            j = (k + 1) % 4
            bm.faces.new((a[k], a[j], b[j], b[k]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        columnas.append(objeto_desde_bm("col_inc", bm, MAT["columna"], col, 1.0))
        y += 7.0

    # Edificio blanco de 2 pisos adelante del gimnasio.
    bx0, bx1, by0, by1, bh = gx0 + 6, gx1, Y_FRENTE - 4.0, gy0, 7.5
    paredes.append(caja_min_max("club", (bx0, by0, 0), (bx1, by1, bh), MAT["revoque"], col, 3.0))
    techos.append(caja_min_max("club_t", (bx0 - 0.2, by0 - 0.2, bh), (bx1 + 0.2, by1 + 0.2, bh + 0.25), MAT["techo_plano"], col, 3.0))
    ventanas_fachada(vidrios, "y", by0, bx0, bx1, (1.0, 4.4), MAT["vidrio_celeste"], col, ancho=2.2, paso=3.0, alto=1.6)
    ventanas_fachada(vidrios, "x", bx1, by0, by1, (1.0, 4.4), MAT["vidrio_celeste"], col, ancho=1.8, paso=2.8, alto=1.6)

    # Edificio blanco detrás de la tribuna, con franja celeste.
    tx0 = x_fin_tribuna + 0.6
    paredes.append(caja_min_max("trib_ed", (tx0, -ML - 3.0, 0), (tx0 + 9.0, ML + 3.0, 8.0), MAT["revoque"], col, 3.0))
    techos.append(caja_min_max("trib_ed_t", (tx0 - 0.2, -ML - 3.2, 8.0), (tx0 + 9.2, ML + 3.2, 8.25), MAT["techo_plano"], col, 3.0))

    # Edificio con galería al fondo.
    fy = Y_FONDO + 2.0
    paredes.append(caja_min_max("fondo", (-MA - 4.0, fy, 0), (x_fin_tribuna, fy + 9.0, 5.0), MAT["revoque"], col, 3.0))
    techos.append(prisma("fondo_t", [(-MA - 4.4, 5.0), (x_fin_tribuna + 0.4, 5.0), (x_fin_tribuna + 0.4, 5.6), (-MA - 4.4, 6.6)], fy - 0.4, fy + 9.4, MAT["chapa"], col, 2.0))
    ventanas_fachada(vidrios, "y", fy, -MA - 4.0, x_fin_tribuna, (1.2,), MAT["vidrio"], col, ancho=2.4, paso=3.4, alto=1.8)

    # Torre de ladrillo con balcones (adelante a la derecha) y edificios altos de la ciudad.
    torre_ciudad(ciudad, franjas, x_fin_tribuna + 14.0, Y_FRENTE - 18.0, 12.0, 36.0, 10, MAT["ladrillo"], col)
    altos = [
        (-20, -110, 16, 14, 11, MAT["ladrillo"]), (15, -115, 14, 18, 12, MAT["torre_blanca"]), (60, -95, 16, 16, 9, MAT["ladrillo"]),
        (-70, -85, 14, 14, 13, MAT["torre_blanca"]), (85, -50, 14, 18, 10, MAT["torre_blanca"]), (90, 20, 16, 14, 12, MAT["ladrillo"]),
        (70, 80, 14, 14, 9, MAT["torre_blanca"]), (-5, 100, 18, 14, 11, MAT["ladrillo"]), (-80, 55, 14, 16, 10, MAT["torre_blanca"]),
        (-100, -20, 16, 16, 12, MAT["ladrillo"]), (40, 110, 14, 14, 13, MAT["torre_blanca"]), (-50, 105, 14, 14, 8, MAT["ladrillo"]),
    ]
    for x, y, w, d, pisos, mat in altos:
        torre_ciudad(ciudad, franjas, x, y, w, d, pisos, mat, col)

    mats = [MAT["revoque"], MAT["revoque_beige"], MAT["revoque_gris"]]
    colocadas, intentos = 0, 0
    while colocadas < 75 and intentos < 900:
        intentos += 1
        cx, cy = random.uniform(-125, 125), random.uniform(-125, 125)
        if gx0 - 4 < cx < x_fin_tribuna + 32 and Y_FRENTE - 60 < cy < Y_FONDO + 14:
            continue
        if math.hypot(cx, cy) > 135 or any(abs(cx - x) < w / 2 + 8 and abs(cy - y) < d / 2 + 8 for x, y, w, d, _, _ in altos):
            continue
        w, d = random.uniform(7, 14), random.uniform(9, 18)
        h = random.choice([3.2, 3.5, 4, 6, 6.5, 9])
        ciudad.append(caja_min_max("casa", (cx - w / 2, cy - d / 2, 0), (cx + w / 2, cy + d / 2, h), random.choice(mats), col, 3.0))
        techo = MAT["chapa"] if random.random() < 0.45 else MAT["techo_plano"]
        ciudad_techos.append(caja_min_max("casa_t", (cx - w / 2 - 0.15, cy - d / 2 - 0.15, h), (cx + w / 2 + 0.15, cy + d / 2 + 0.15, h + 0.2), techo, col, 2.0))
        colocadas += 1

    unir("Edificios", paredes)
    unir("Techos", techos)
    unir("Ventanas", vidrios)
    unir("Balcones", franjas)
    unir("GimnasioColumnas", columnas)
    unir("CiudadEdificios", ciudad)
    unir("CiudadTechos", ciudad_techos)
    return (gx0, x_fin_tribuna)


def canchas(col, x_max):
    z = 0.06
    yf = Y_FRENTE
    unir(
        "Canchas",
        [
            caja_min_max("cancha", (X_SOL_O, yf - 48.0, -0.3), (x_max, yf, z), MAT["cancha"], col, 3.0),
            caja_min_max("patio", (X_SOL_O - 28.0, yf - 48.0, -0.3), (X_SOL_O, yf - 4.0, z), MAT["patio"], col, 3.0),
        ],
    )
    lineas = []

    def linea(p0, p1, mat=None, ancho=0.08):
        mat = mat or MAT["linea_blanca"]
        (x0, y0), (x1, y1) = p0, p1
        if abs(x1 - x0) > abs(y1 - y0):
            lineas.append(caja_min_max("l", (min(x0, x1), y0 - ancho / 2, z), (max(x0, x1), y0 + ancho / 2, z + 0.01), mat, col, 1.0))
        else:
            lineas.append(caja_min_max("l", (x0 - ancho / 2, min(y0, y1), z), (x0 + ancho / 2, max(y0, y1), z + 0.01), mat, col, 1.0))

    def circulo(c, r, mat=None, seg=40, arco=(0, math.tau)):
        mat = mat or MAT["linea_blanca"]
        bm = bmesh.new()
        a0, a1 = arco
        for k in range(seg):
            t0 = a0 + (a1 - a0) * k / seg
            t1 = a0 + (a1 - a0) * (k + 1) / seg
            v = [bm.verts.new((c[0] + math.cos(t) * rr, c[1] + math.sin(t) * rr, z + 0.012)) for t, rr in ((t0, r - 0.04), (t1, r - 0.04), (t1, r + 0.04), (t0, r + 0.04))]
            bm.faces.new(v)
        lineas.append(objeto_desde_bm("circ", bm, mat, col, 1.0))

    xc = (X_SOL_O + x_max) / 2
    y0, y1 = yf - 44.0, yf - 4.0
    yc = (y0 + y1) / 2
    hx0, hx1 = xc - 10, xc + 10
    for a, b in (((hx0, y0), (hx1, y0)), ((hx0, y1), (hx1, y1)), ((hx0, y0), (hx0, y1)), ((hx1, y0), (hx1, y1)), ((hx0, yc), (hx1, yc))):
        linea(a, b)
    circulo((xc, yc), 3.0)
    circulo((xc, y0), 6.0, arco=(0, math.pi))
    circulo((xc, y1), 6.0, arco=(math.pi, math.tau))
    am = MAT["linea_amarilla"]
    bx0, bx1, by0, by1 = xc - 14, xc + 14, yc - 7.5, yc + 7.5
    for a, b in (((bx0, by0), (bx1, by0)), ((bx0, by1), (bx1, by1)), ((bx0, by0), (bx0, by1)), ((bx1, by0), (bx1, by1)), ((xc, by0), (xc, by1))):
        linea(a, b, am)
    circulo((xc, yc), 1.8, am)
    unir("CanchaLineas", lineas)

    eq = []
    for y, sgn in ((y0, -1), (y1, 1)):
        eq.append(tubo("arco", [(xc - 1.5, y, z), (xc - 1.5, y, 2.0), (xc + 1.5, y, 2.0), (xc + 1.5, y, z)], 0.05, MAT["linea_blanca"], col))
        eq.append(tubo("arco_red", [(xc - 1.5, y, 2.0), (xc - 1.5, y + sgn * 1.0, z), (xc + 1.5, y + sgn * 1.0, z), (xc + 1.5, y, 2.0)], 0.015, MAT["linea_blanca"], col))
    for x, sgn in ((bx0 - 1.2, 1), (bx1 + 1.2, -1)):
        eq.append(cilindro("aro_poste", (x, yc, z), (x, yc, 3.6), 0.07, MAT["metal_oscuro"], col))
        eq.append(caja("tablero", (x + sgn * 0.6, yc, 3.4), (0.08, 1.8, 1.05), MAT["linea_blanca"], col, 1.0))
    unir("CanchaEquipamiento", eq)

    # Alambrado/baranda blanca entre el solárium y las canchas.
    al = []
    for x in range(int(X_SOL_O), int(x_max) + 1, 2):
        al.append(cilindro("fposte", (x, yf, 0), (x, yf, H + 1.1), 0.035, MAT["blanco"], col, lados=6))
    for zz in (H + 0.45, H + 1.05):
        al.append(cilindro("friel", (X_SOL_O, yf, zz), (x_max, yf, zz), 0.025, MAT["blanco"], col, lados=6))
    unir("Alambrado", al)


def palmera(nombre, base, altura, inclinacion, giro, col):
    bm = bmesh.new()
    anillos, lados = 14, 8
    eje = []
    for i in range(anillos + 1):
        t = i / anillos
        dx = math.sin(t * 1.4) * inclinacion
        eje.append(Vector((base[0] + dx * math.cos(giro), base[1] + dx * math.sin(giro), base[2] + t * altura)))
    capas = []
    for i, c in enumerate(eje):
        t = i / anillos
        r = 0.26 - 0.1 * t + (0.025 if i % 2 == 0 else 0)
        capas.append([bm.verts.new(c + Vector((math.cos(a) * r, math.sin(a) * r, 0))) for a in (k * math.tau / lados for k in range(lados))])
    for i in range(anillos):
        for k in range(lados):
            j = (k + 1) % lados
            bm.faces.new((capas[i][k], capas[i][j], capas[i + 1][j], capas[i + 1][k]))
    tronco = objeto_desde_bm(nombre + "_tronco", bm, MAT["tronco"], col, 1.0)

    copa = eje[-1]
    hojas_bm, secas_bm = bmesh.new(), bmesh.new()
    n_hojas = 17
    for h in range(n_hojas):
        ang = h / n_hojas * math.tau + random.uniform(-0.15, 0.15)
        seca = h % 6 == 0
        largo = random.uniform(2.8, 3.6) * (0.8 if seca else 1.0)
        caida = random.uniform(0.6, 1.1) * (1.6 if seca else 1.0)
        elev = random.uniform(0.25, 0.7)
        dirh = Vector((math.cos(ang), math.sin(ang), 0))
        lado = Vector((-math.sin(ang), math.cos(ang), 0))
        destino = secas_bm if seca else hojas_bm
        pasos = 16
        for s in range(pasos):
            t0, t1 = s / pasos, (s + 1) / pasos

            def punto(t):
                return copa + dirh * (largo * t) + Vector((0, 0, elev * largo * t - caida * largo * t * t))

            p0, p1 = punto(t0), punto(t1)
            ancho = 0.75 * math.sin(math.pi * min(1, t0 + 0.08)) + 0.08
            for sgn in (-1, 1):
                punta = p0 + lado * (sgn * ancho) + Vector((0, 0, -0.18 * ancho)) + dirh * 0.18
                destino.faces.new((destino.verts.new(p0), destino.verts.new(p1), destino.verts.new(punta)))
    return [tronco, objeto_desde_bm(nombre + "_hojas", hojas_bm, MAT["hoja"], col, 1.0), objeto_desde_bm(nombre + "_secas", secas_bm, MAT["hoja_seca"], col, 1.0)]


def vegetacion(col):
    partes = []
    xj = -(E + 6.5)  # centro del jardín oeste
    palmeras = [
        ((xj + 0.8, -ML + 1.0, H), 9.0), ((xj - 1.0, -ML + 8.0, H), 10.0), ((xj + 0.6, -ML + 15.0, H), 8.5),
        ((xj - 0.8, ML + 1.0, H), 9.5), ((-(E + 1.6), -ML - 6.0, H), 7.5), ((xj, Y_FRENTE + 2.5, H), 8.0),
        ((-MA - 1.5, ML + BORDE + 17.5, H), 10.5), ((MA + 2.0, Y_FONDO - 1.0, H), 11.0),
    ]
    for i, (base, alto) in enumerate(palmeras):
        partes += palmera(f"palmera{i}", base, alto, random.uniform(0.4, 1.4), random.uniform(0, math.tau), col)
    for i in range(14):
        x = xj + random.uniform(-2.5, 2.5) if i < 10 else random.uniform(X_SOL_O + 1, -(E + 2))
        y = random.uniform(-ML - 0.5, ML + 2.5) if i < 10 else random.uniform(Y_FRENTE + 0.5, -ML - 4.5)
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=random.uniform(0.7, 1.3))
        for v in bm.verts:
            v.co *= random.uniform(0.85, 1.15)
            v.co.z *= 0.75
            v.co += Vector((x, y, H + 0.5))
        partes.append(objeto_desde_bm(f"arbusto{i}", bm, MAT["arbusto"], col, 1.0))
    grupos = {"Palmeras": "_tronco", "PalmerasHojas": "_hojas", "PalmerasSecas": "_secas", "Arbustos": "arbusto"}
    listas = {k: [p for p in partes if clave in p.name] for k, clave in grupos.items()}
    for nombre, lista in listas.items():
        ob = unir(nombre, lista)
        if nombre in ("Arbustos", "Palmeras"):
            suavizar(ob)


def arboles(col, gx0, x_max):
    """Árboles frondosos: los grandes detrás del toldo (como en las fotos) y los del barrio."""
    troncos, copas = [], []
    puntos = [(x, Y_FONDO + random.uniform(-1, 1)) for x in (-MA - 6, -MA, -2, 5, 11)]
    puntos += [(X_SOL_O + 1.5, ML + 6), (X_SOL_O + 1.5, ML + 12)]
    while len(puntos) < 50:
        x, y = random.uniform(-120, 120), random.uniform(-120, 120)
        if gx0 - 4 < x < x_max + 32 and Y_FRENTE - 60 < y < Y_FONDO + 14:
            continue
        puntos.append((x, y))
    for n_arbol, (x, y) in enumerate(puntos):
        alto = random.uniform(5.0, 9.0)
        troncos.append(cilindro("tronco_a", (x, y, 0), (x, y, alto * 0.6), 0.24, MAT["tronco"], col, lados=6))
        for _ in range(random.randint(4, 6)):
            bm = bmesh.new()
            bmesh.ops.create_icosphere(bm, subdivisions=2 if n_arbol < 7 else 1, radius=random.uniform(1.8, 3.0))  # los cercanos, más redondos
            off = Vector((random.uniform(-1.8, 1.8), random.uniform(-1.8, 1.8), alto * 0.6 + random.uniform(0.5, 2.4)))
            for v in bm.verts:
                v.co *= random.uniform(0.88, 1.12)
                v.co += Vector((x, y, 0)) + off
            copas.append(objeto_desde_bm("copa", bm, MAT["copa_arbol"], col, 1.0))
    unir("ArbolesTroncos", troncos)
    suavizar(unir("ArbolesCopas", copas))


def torres_luz(col):
    partes, lamparas = [], []
    for x, y in ((X_SOL_O + 1.0, -ML - 4.0), (X_SOL_O + 1.0, Y_FONDO - 1.0), (X_TRIB - 0.6, Y_FONDO - 1.0)):
        partes.append(cilindro("torre", (x, y, H), (x, y, 14.0), 0.2, MAT["metal_oscuro"], col, radio_fin=0.11))
        partes.append(caja("cabezal", (x, y, 14.3), (2.2, 0.4, 0.9), MAT["metal_oscuro"], col, 1.0))
        dir_y = -1 if y > 0 else 1
        for k in (-0.75, -0.25, 0.25, 0.75):
            lamparas.append(caja("lamp", (x + k, y + dir_y * 0.22, 14.3), (0.42, 0.06, 0.6), MAT["lampara"], col, 1.0))
    unir("TorresLuz", partes)
    lamp = unir("Lamparas", lamparas)
    for c in list(lamp.users_collection):
        c.objects.unlink(lamp)
    coleccion("SIN_LUZ").objects.link(lamp)


def sillas():
    """Sillas monobloc de Poly Haven (instancias que comparten la malla)."""
    ruta = os.path.join(ASSETS, "modelos", "plastic_monobloc_chair_01", "plastic_monobloc_chair_01.gltf")
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=ruta)
    nuevos = [o for o in bpy.data.objects if o not in antes]
    malla = next(o for o in nuevos if o.type == "MESH")
    me = malla.data
    me.transform(malla.matrix_world)
    for n in [o.name for o in nuevos]:
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o)
    col = coleccion("SIN_LUZ")
    pos = [((-(E + 2.2), -ML + 1.5 + k * 2.4), math.pi / 2 + random.uniform(-0.25, 0.25)) for k in range(9)]
    pos += [((-MA + k * 1.4, -ML - 4.5), random.uniform(-0.3, 0.3)) for k in range(5)]
    pos += [((MA + 1.6, -ML + 3 + k * 2.2), -math.pi / 2 + random.uniform(-0.3, 0.3)) for k in range(5)]
    for i, ((x, y), rot) in enumerate(pos):
        ob = bpy.data.objects.new(f"Silla{i}", me)
        col.objects.link(ob)
        ob.location = (x, y, H)
        ob.rotation_euler = (0, 0, rot)


def vida(col):
    """Lonas de sponsors, gazebos y gente (según las fotos de torneos)."""
    sin_luz = coleccion("SIN_LUZ")
    y_borde = ML + BORDE
    ty1 = y_borde + 6.0  # pared de la carpa bajo el toldo
    unir("Lonas", detalles.lonas(col, -MA - 1.0, MA + 1.0, ty1, H, Y_FRENTE, H + 0.75))

    gz = []
    gz += detalles.gazebo("gazebo1", (-(E + 2.6), ML - 0.5, H), 3.0, 2.3, MAT["toldo"], sin_luz)
    gz += detalles.gazebo("gazebo2", (-(E + 2.6), ML + 3.2, H), 3.0, 2.3, MAT["carpa"], sin_luz)
    gz += detalles.gazebo("gazebo3", (-(E + 2.6), -ML + 2.0, H), 3.0, 2.3, MAT["toldo"], sin_luz)
    unir("Gazebos", gz)

    lugares = detalles.lugares_tribuna(X_TRIB, -ML - 2.0, ML + 1.5, 0.8, 0.42, 14, H, 48)
    for _ in range(16):  # bajo el toldo, detrás de los partidores, mirando a la pileta
        lugares.append((random.uniform(-MA, MA), random.uniform(y_borde + 1.4, y_borde + 4.6), H, math.pi + random.uniform(-0.5, 0.5), False))
    for _ in range(6):  # bajo los gazebos
        lugares.append((-(E + 2.6) + random.uniform(-1, 1), ML + random.uniform(-1.5, 4), H, -math.pi / 2 + random.uniform(-0.6, 0.6), False))
    for y in (-ML + 4.0, -ML + 9.0, ML - 3.0):  # en el solárium oeste
        lugares.append((-(E + 0.9), y, H, -math.pi / 2, False))
    ob = detalles.gente(lugares, sin_luz)
    if ob:
        for c in list(ob.users_collection):
            c.objects.unlink(ob)
        sin_luz.objects.link(ob)


# Objetos chicos o con muchas caras diminutas: no van al lightmap (ensucian el atlas y bajan la resolución
# de las sombras grandes). En la web se iluminan con las luces de la escena.
SIN_LIGHTMAP = (
    "Banderines", "Escaleras", "PartidoresNum", "TribunaBaranda", "Alambrado", "CanchaEquipamiento",
    "CanchaLineas", "TribunaDetalles", "PalmerasHojas", "PalmerasSecas", "ArbolesCopas", "Arbustos",
    "Rebalse", "Ventanas", "Balcones", "GimnasioColumnas", "CiudadEdificios", "CiudadTechos", "ArbolesTroncos", "Lonas",
)


def pasar_a_sin_luz():
    nat, sin_luz = coleccion("NATATORIO"), coleccion("SIN_LUZ")
    for ob in list(nat.objects):
        if any(ob.name.startswith(n) for n in SIN_LIGHTMAP):
            nat.objects.unlink(ob)
            sin_luz.objects.link(ob)


# ─── Escena, luz y cámara ───────────────────────────────────────────────────────


def mundo_y_luz():
    sc = bpy.context.scene
    w = bpy.data.worlds.new("Cielo")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.image = bpy.data.images.load(os.path.join(ASSETS, "hdri", "qwantani_afternoon_puresky_2k.hdr"))
    mapping = nt.nodes.new("ShaderNodeMapping")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    mapping.inputs["Rotation"].default_value[2] = math.radians(200)
    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
    bg = nt.nodes["Background"]
    bg.inputs["Strength"].default_value = 0.65
    nt.links.new(env.outputs["Color"], bg.inputs["Color"])

    sol = bpy.data.lights.new("Sol", "SUN")
    sol.energy = 4.5
    sol.color = (1.0, 0.9, 0.78)
    sol.angle = math.radians(2.5)
    ob = bpy.data.objects.new("Sol", sol)
    sc.collection.objects.link(ob)
    ob.rotation_euler = (math.radians(55), 0, math.radians(-125))


def camara(pos, mira, fov_v=55, nombre="Cam"):
    cam = bpy.data.cameras.new(nombre)
    cam.sensor_fit = "VERTICAL"
    cam.angle_y = math.radians(fov_v)
    cam.clip_end = 600
    ob = bpy.data.objects.new(nombre, cam)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = pos
    ob.rotation_euler = (Vector(mira) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    return ob


def three_a_blender(x, y, z):
    return (x, -z, y)


# Mismas tomas que components/hero/escena/camara-scroll.tsx (coordenadas three).
CAM_INICIO = ((17, 21, 27), (0, 0, -1))
CAM_FIN = ((0, 1.8, ML + 3.0), (0, 0.9, -ML))


def render_preview(movil=False):
    sc = bpy.context.scene
    try:
        sc.render.engine = "BLENDER_EEVEE"
    except TypeError:
        sc.render.engine = "BLENDER_EEVEE_NEXT"
    sc.eevee.taa_render_samples = 48
    if hasattr(sc.eevee, "use_raytracing"):
        sc.eevee.use_raytracing = True
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    sc.render.resolution_x, sc.render.resolution_y = (540, 1170) if movil else (1280, 720)
    sufijo = "_movil" if movil else ""
    for nombre, (pos, mira) in (("preview", CAM_INICIO), ("preview_fin", CAM_FIN)):
        sc.camera = camara(three_a_blender(*pos), three_a_blender(*mira), nombre=nombre)
        sc.render.filepath = os.path.join(SALIDA, f"{nombre}{sufijo}.png")
        bpy.ops.render.render(write_still=True)


def construir():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    crear_materiales()
    materiales_extra()
    col = coleccion("NATATORIO")
    pileta(col)
    solarium(col)
    x_fin_trib = tribuna(col)
    gx0, x_max = edificios(col, x_fin_trib)
    canchas(col, x_max + 6.0)
    arboles(col, gx0, x_max)
    vegetacion(col)
    pileta_ninos(col)
    pileta_chica(col)
    toldo_partidores(col)
    partidores(col)
    banderines(col)
    torre_clavados(col)
    torres_luz(col)
    sillas()
    vida(col)
    pasar_a_sin_luz()
    mundo_y_luz()


if __name__ == "__main__":
    construir()
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SALIDA, "natatorio.blend"))
    if MODO == "preview":
        render_preview(movil="movil" in ARGS)
    elif MODO == "bake":
        import hornear  # noqa: E402

        hornear.hornear_y_exportar(SALIDA)
