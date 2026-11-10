"""
Detalles que dan vida al natatorio: lonas de sponsors, gazebos y gente (tribuna, toldo y solárium).
Se importan desde natatorio.py. La gente y los gazebos van a la colección SIN_LUZ (no ocupan lightmap).
"""

import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

from base import MAT, cilindro, coleccion, material, objeto_desde_bm, unir


# ─── Lonas de sponsors ──────────────────────────────────────────────────────────


def lona(nombre, centro, ancho, alto, normal, gen, col):
    """Lona plana con UV 0..1 (la textura es el diseño completo de la lona)."""
    mat = MAT.get(gen) or material(gen, gen)
    MAT[gen] = mat
    n = Vector(normal).normalized()
    lado = Vector((0, 0, 1)).cross(n).normalized()
    arriba = n.cross(lado).normalized()
    c = Vector(centro) + n * 0.02
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    esquinas = [(-1, -1, (0, 0)), (1, -1, (1, 0)), (1, 1, (1, 1)), (-1, 1, (0, 1))]
    verts = [bm.verts.new(c + lado * (sx * ancho / 2) + arriba * (sy * alto / 2)) for sx, sy, _ in esquinas]
    cara = bm.faces.new(verts)
    for loop, (_, _, uvc) in zip(cara.loops, esquinas):
        loop[uv].uv = uvc
    return objeto_desde_bm(nombre, bm, mat, col, uv=None)


def lonas(col, x0, x1, y_carpa, z_base, y_alambrado, z_alambrado):
    """Lonas en la carpa del extremo de partidores (mirando a la pileta) y en el alambrado (mirando a las canchas)."""
    disenios = ["lona_aec", "lona_master", "lona_icd", "lona_sem"]
    partes = []
    ancho = 3.4
    paso = (x1 - x0) / len(disenios)
    for i, gen in enumerate(disenios):
        cx = x0 + paso * (i + 0.5)
        partes.append(lona(f"lona_c{i}", (cx, y_carpa, z_base + 2.4), ancho, ancho / 4, (0, -1, 0), gen, col))  # por encima de las cabezas
    for i, gen in enumerate(disenios):
        cx = -9.0 + i * 4.6
        partes.append(lona(f"lona_a{i}", (cx, y_alambrado, z_alambrado), ancho, ancho / 4, (0, -1, 0), gen, col))
    return partes


# ─── Gazebos ────────────────────────────────────────────────────────────────────


def gazebo(nombre, centro, lado, alto, mat_techo, col):
    cx, cy, cz = centro
    h = lado / 2
    partes = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            partes.append(cilindro("pata", (cx + sx * h, cy + sy * h, cz), (cx + sx * h, cy + sy * h, cz + alto), 0.03, MAT["metal"], col, lados=6))
    bm = bmesh.new()
    base = [bm.verts.new((cx + sx * (h + 0.1), cy + sy * (h + 0.1), cz + alto)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    cima = bm.verts.new((cx, cy, cz + alto + lado * 0.28))
    for i in range(4):
        bm.faces.new((base[i], base[(i + 1) % 4], cima))
    # Faldón del techo.
    for i in range(4):
        a, b = base[i], base[(i + 1) % 4]
        a2 = bm.verts.new(a.co - Vector((0, 0, 0.25)))
        b2 = bm.verts.new(b.co - Vector((0, 0, 0.25)))
        bm.faces.new((a, b, b2, a2))
    partes.append(objeto_desde_bm(nombre + "_techo", bm, mat_techo, col, uv=1.0))
    return partes


# ─── Gente ──────────────────────────────────────────────────────────────────────

PIELES = ["#e2b896", "#c8936f", "#a8734f", "#8a5a3c"]
REMERAS = ["#f2f2f2", "#d8434c", "#2f5fb8", "#1d2a44", "#f2c230", "#3a8f5a", "#e57a2e", "#8fb8e8", "#6b6f78"]
PANTALONES = ["#1f2633", "#3b4a63", "#2b2b2b", "#6d5a45", "#c8c3b8"]


def _mats_gente():
    if "piel0" in MAT:
        return
    for i, c in enumerate(PIELES):
        MAT[f"piel{i}"] = material(f"Piel{i}", color=c, rough=0.6)
    for i, c in enumerate(REMERAS):
        MAT[f"remera{i}"] = material(f"Remera{i}", color=c, rough=0.8)
    for i, c in enumerate(PANTALONES):
        MAT[f"pantalon{i}"] = material(f"Pantalon{i}", color=c, rough=0.85)


def _capsula(bm_dest, p0, p1, radio, seg=8):
    """Agrega una cápsula (cilindro con tapas esféricas aproximadas) a un bmesh."""
    tmp = bmesh.new()
    d = Vector(p1) - Vector(p0)
    bmesh.ops.create_cone(tmp, cap_ends=True, segments=seg, radius1=radio, radius2=radio, depth=d.length)
    rot = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    bmesh.ops.transform(tmp, matrix=Matrix.Translation((Vector(p0) + Vector(p1)) / 2) @ rot, verts=tmp.verts)
    for extremo in (p0, p1):
        bmesh.ops.create_uvsphere(tmp, u_segments=seg, v_segments=5, radius=radio, matrix=Matrix.Translation(extremo))
    me = bpy.data.meshes.new("tmp")
    tmp.to_mesh(me)
    tmp.free()
    bm_dest.from_mesh(me)
    bpy.data.meshes.remove(me)


def persona(x, y, z, giro, sentada, alto, idx, partes_por_mat):
    """Figura humana estilizada (cuerpo, cabeza, brazos, piernas) parada o sentada."""
    piel = f"piel{idx % len(PIELES)}"
    remera = f"remera{(idx * 7 + 3) % len(REMERAS)}"
    pantalon = f"pantalon{(idx * 5 + 1) % len(PANTALONES)}"
    rot = Matrix.Rotation(giro, 4, "Z")

    def P(dx, dy, dz):
        return tuple(Vector((x, y, z)) + (rot @ Vector((dx, dy, dz))))

    s = alto / 1.72
    cadera = 0.46 * s if sentada else 0.9 * s
    hombros = cadera + 0.52 * s

    bm_r, bm_p, bm_l = bmesh.new(), bmesh.new(), bmesh.new()
    _capsula(bm_r, P(0, 0, cadera + 0.08 * s), P(0, 0, hombros - 0.06 * s), 0.17 * s)  # torso
    _capsula(bm_p, P(0, 0, hombros + 0.12 * s), P(0, 0, hombros + 0.2 * s), 0.1 * s, seg=10)  # cabeza
    for lado in (-1, 1):
        mano = P(lado * 0.24 * s, 0.18 * s, cadera + 0.12 * s) if sentada else P(lado * 0.24 * s, 0.02 * s, cadera - 0.05 * s)
        _capsula(bm_r, P(lado * 0.22 * s, 0, hombros - 0.04 * s), mano, 0.05 * s)  # brazos (manga)
        if sentada:
            rodilla = P(lado * 0.1 * s, 0.42 * s, cadera + 0.02 * s)
            _capsula(bm_l, P(lado * 0.1 * s, 0, cadera), rodilla, 0.075 * s)
            _capsula(bm_l, rodilla, P(lado * 0.1 * s, 0.5 * s, -0.36 * s), 0.065 * s)
        else:
            _capsula(bm_l, P(lado * 0.1 * s, 0, cadera), P(lado * 0.1 * s, 0, 0.06 * s), 0.075 * s)
    partes_por_mat.setdefault(remera, []).append(bm_r)
    partes_por_mat.setdefault(piel, []).append(bm_p)
    partes_por_mat.setdefault(pantalon, []).append(bm_l)


def gente(lugares, col):
    """lugares: lista de (x, y, z, giro, sentada)."""
    _mats_gente()
    partes_por_mat = {}
    for i, (x, y, z, giro, sentada) in enumerate(lugares):
        persona(x, y, z, giro, sentada, random.uniform(1.58, 1.86), i, partes_por_mat)
    objetos = []
    for clave, bms in partes_por_mat.items():
        total = bmesh.new()
        for b in bms:
            me = bpy.data.meshes.new("t")
            b.to_mesh(me)
            b.free()
            total.from_mesh(me)
            bpy.data.meshes.remove(me)
        ob = objeto_desde_bm(f"gente_{clave}", total, MAT[clave], col, uv=1.0)
        for p in ob.data.polygons:
            p.use_smooth = True
        objetos.append(ob)
    return unir("Gente", objetos)


def lugares_tribuna(x_ini, y0, y1, paso, alto, n, h, cantidad):
    lugares = []
    for _ in range(cantidad):
        i = random.randint(0, n - 4)
        y = random.uniform(y0 + 2.0, y1 - 2.0)
        x = x_ini + i * paso + paso * 0.5
        z = h + (i + 1) * alto
        # Mirando hacia la pileta (-x).
        lugares.append((x, y, z, math.pi / 2 + random.uniform(-0.2, 0.2), True))
    return lugares
