"""
Utilidades y materiales compartidos por los scripts de Blender del natatorio.
(Geometría por bmesh en coordenadas de mundo, UV a escala real y materiales con texturas generadas.)
"""

import os

import bmesh
import bpy
from mathutils import Matrix, Vector

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # blender/
ASSETS = os.path.join(RAIZ, "assets")
SALIDA = os.path.join(RAIZ, "salida")
os.makedirs(SALIDA, exist_ok=True)


# ─── Utilidades ─────────────────────────────────────────────────────────────────


def lin(hexstr):
    """#rrggbb (sRGB) → tupla lineal para Blender."""
    h = hexstr.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def coleccion(nombre):
    col = bpy.data.collections.get(nombre)
    if not col:
        col = bpy.data.collections.new(nombre)
        bpy.context.scene.collection.children.link(col)
    return col


def uv_mundo(ob, escala=2.0, capa="UVMap"):
    """UV por proyección de caja en coordenadas de mundo: las texturas quedan a escala real."""
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.get(capa) or bm.loops.layers.uv.new(capa)
    mw = ob.matrix_world
    rot = mw.to_3x3()
    for f in bm.faces:
        n = rot @ f.normal
        eje = max(range(3), key=lambda i: abs(n[i]))
        for l in f.loops:
            p = mw @ l.vert.co
            if eje == 2:
                u, v = p.x, p.y
            elif eje == 0:
                u, v = p.y, p.z
            else:
                u, v = p.x, p.z
            l[uv].uv = (u / escala, v / escala)
    bm.to_mesh(me)
    bm.free()


def objeto_desde_bm(nombre, bm, mat, col, uv=2.0):
    me = bpy.data.meshes.new(nombre)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nombre, me)
    col.objects.link(ob)
    if mat:
        me.materials.append(mat)
    if uv:
        uv_mundo(ob, uv)
    return ob


def caja(nombre, centro, tam, mat, col, uv=2.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * tam[0] + centro[0], v.co.y * tam[1] + centro[1], v.co.z * tam[2] + centro[2]))
    return objeto_desde_bm(nombre, bm, mat, col, uv)


def caja_min_max(nombre, mn, mx, mat, col, uv=2.0):
    c = [(a + b) / 2 for a, b in zip(mn, mx)]
    t = [b - a for a, b in zip(mn, mx)]
    return caja(nombre, c, t, mat, col, uv)


def prisma(nombre, perfil_xz, y0, y1, mat, col, uv=2.0):
    """Extruye un perfil (lista de (x, z)) entre y0 e y1."""
    bm = bmesh.new()
    a = [bm.verts.new((x, y0, z)) for x, z in perfil_xz]
    b = [bm.verts.new((x, y1, z)) for x, z in perfil_xz]
    bm.faces.new(list(reversed(a)))
    bm.faces.new(b)
    n = len(perfil_xz)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return objeto_desde_bm(nombre, bm, mat, col, uv)


def cilindro(nombre, p0, p1, radio, mat, col, lados=10, radio_fin=None):
    bm = bmesh.new()
    d = Vector(p1) - Vector(p0)
    largo = d.length
    bmesh.ops.create_cone(
        bm, cap_ends=True, cap_tris=False, segments=lados, radius1=radio, radius2=radio_fin or radio, depth=largo
    )
    rot = d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    m = Matrix.Translation((Vector(p0) + Vector(p1)) / 2) @ rot
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return objeto_desde_bm(nombre, bm, mat, col, uv=1.0)


def tubo(nombre, puntos, radio, mat, col, lados=8):
    """Tubo a lo largo de una polilínea (barandas, escaleras)."""
    cu = bpy.data.curves.new(nombre, "CURVE")
    cu.dimensions = "3D"
    sp = cu.splines.new("POLY")
    sp.points.add(len(puntos) - 1)
    for i, p in enumerate(puntos):
        sp.points[i].co = (*p, 1)
    cu.bevel_depth = radio
    cu.bevel_resolution = 2
    ob = bpy.data.objects.new(nombre, cu)
    col.objects.link(ob)
    return convertir_a_malla(ob, mat)


def convertir_a_malla(ob, mat=None):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    nuevo = bpy.data.objects.new(ob.name + "_m", me)
    for c in ob.users_collection:
        c.objects.link(nuevo)
    nuevo.matrix_world = ob.matrix_world
    bpy.data.objects.remove(ob)
    if mat:
        me.materials.clear()
        me.materials.append(mat)
    uv_mundo(nuevo, 1.0)
    return nuevo


def unir(nombre, objetos):
    """Une varias mallas en una sola (menos draw calls en la web)."""
    objetos = [o for o in objetos if o and o.type == "MESH"]
    if not objetos:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for o in objetos:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objetos[0]
    bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = nombre
    return ob


# ─── Materiales ─────────────────────────────────────────────────────────────────


def tex(nombre, mapa):
    return os.path.join(ASSETS, "texturas", nombre, f"{mapa}.jpg")


def material(nombre, gen=None, fuente=None, color="#ffffff", rough=0.8, metal=0.0, emision=None, fuerza=10.0):
    """gen: textura de color generada (assets/generadas); fuente: set de Poly Haven para rugosidad/normal."""
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    m.use_backface_culling = False
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Metallic"].default_value = metal
    if gen:
        ti = nt.nodes.new("ShaderNodeTexImage")
        ti.name = "BASE"
        ti.image = bpy.data.images.load(os.path.join(ASSETS, "generadas", f"{gen}.jpg"), check_existing=True)
        nt.links.new(ti.outputs["Color"], b.inputs["Base Color"])
    else:
        b.inputs["Base Color"].default_value = (*lin(color), 1)
    b.inputs["Roughness"].default_value = rough
    if fuente:
        r = bpy.data.images.load(tex(fuente, "rough"), check_existing=True)
        r.colorspace_settings.name = "Non-Color"
        tr = nt.nodes.new("ShaderNodeTexImage")
        tr.image = r
        tr.name = "ROUGH"
        nt.links.new(tr.outputs["Color"], b.inputs["Roughness"])
        n = bpy.data.images.load(tex(fuente, "nor"), check_existing=True)
        n.colorspace_settings.name = "Non-Color"
        tn = nt.nodes.new("ShaderNodeTexImage")
        tn.image = n
        tn.name = "NOR"
        nm = nt.nodes.new("ShaderNodeNormalMap")
        nm.name = "NORMALMAP"
        nt.links.new(tn.outputs["Color"], nm.inputs["Color"])
        nt.links.new(nm.outputs["Normal"], b.inputs["Normal"])
    if emision:
        b.inputs["Emission Color"].default_value = (*lin(emision), 1)
        b.inputs["Emission Strength"].default_value = fuerza
    return m


MAT = {}


def crear_materiales():
    MAT["solarium"] = material("Solarium", "solarium", "concrete_floor_02")
    MAT["borde"] = material("BordeRojo", "borde", "painted_concrete_02")
    MAT["azulejo"] = material("Azulejo", "azulejo", "square_tiles_02")
    MAT["gradas"] = material("Gradas", "gradas", "painted_concrete_02")
    MAT["blanco"] = material("PinturaBlanca", "blanco", "painted_concrete_02")
    MAT["revoque"] = material("Revoque", "revoque", "white_plaster_rough_01")
    MAT["revoque_beige"] = material("RevoqueBeige", "revoque_beige", "white_plaster_rough_01")
    MAT["revoque_gris"] = material("RevoqueGris", "revoque_gris", "white_plaster_rough_01")
    MAT["chapa"] = material("Chapa", "chapa", "corrugated_iron_02", metal=0.3)
    MAT["chapa_beige"] = material("ChapaBeige", "chapa_beige", "corrugated_iron_02", metal=0.3)
    MAT["pasto"] = material("Pasto", "pasto", "leafy_grass")
    MAT["suelo"] = material("Suelo", "suelo", "asphalt_02")
    MAT["cancha"] = material("Cancha", "cancha", "concrete_floor_02")
    MAT["patio"] = material("Patio", "patio", "concrete_floor_02")
    MAT["ladrillo"] = material("Ladrillo", "ladrillo", "red_brick")
    MAT["techo_plano"] = material("TechoPlano", "techo_plano", "concrete_floor_02")
    MAT["hormigon"] = material("Hormigon", "patio", "concrete_floor_02")
    MAT["vidrio_celeste"] = material("VidrioCeleste", color="#86bcd9", rough=0.2)
    MAT["linea_blanca"] = material("LineaBlanca", color="#f1f1ec", rough=0.8)
    MAT["linea_amarilla"] = material("LineaAmarilla", color="#e2b33c", rough=0.8)
    MAT["copa_arbol"] = material("CopaArbol", color="#2f5a27", rough=0.9)
    MAT["agua_ninos"] = material("AguaNinos", color="#3fb2d6", rough=0.05)
    MAT["torre_blanca"] = material("TorreBlanca", "revoque", "white_plaster_rough_01")
    MAT["franja_oscura"] = material("FranjaOscura", color="#2a2c30", rough=0.7)
    MAT["vidrio"] = material("Vidrio", color="#2b3a4d", rough=0.15)
    MAT["metal"] = material("Metal", color="#d9dde2", rough=0.25, metal=1.0)
    MAT["metal_oscuro"] = material("MetalOscuro", color="#5d6570", rough=0.5, metal=0.6)
    MAT["tronco"] = material("Tronco", color="#7b6a55", rough=0.95)
    MAT["hoja"] = material("Hoja", color="#3f6e34", rough=0.7)
    MAT["hoja_seca"] = material("HojaSeca", color="#a08a55", rough=0.9)
    MAT["arbusto"] = material("Arbusto", color="#365f2e", rough=0.9)
    MAT["toldo"] = material("Toldo", color="#2a63b8", rough=0.6)
    MAT["partidor"] = material("Partidor", color="#f4f6f8", rough=0.4)
    MAT["partidor_top"] = material("PartidorTop", color="#1b1d21", rough=0.85)
    MAT["numero"] = material("Numero", color="#111418", rough=0.6)
    MAT["bandera_r"] = material("BanderaNegra", color="#16181c", rough=0.7)
    MAT["bandera_b"] = material("BanderaAzul2", color="#2c63c9", rough=0.7)
    MAT["bandera_a"] = material("BanderaAzul", color="#2a5fb0", rough=0.7)
    MAT["lampara"] = material("Lampara", color="#fff4dd", emision="#fff1d0", fuerza=25.0)
    MAT["agua_chica"] = material("AguaChica", color="#36b9cc", rough=0.05)
    MAT["agua_preview"] = material("AguaPreview", color="#2fb3c8", rough=0.05)
