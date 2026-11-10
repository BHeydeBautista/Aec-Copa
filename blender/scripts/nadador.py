"""
Convierte el nadador de Mixamo (Swimming.fbx) en un GLB animado y liviano para la web.

Uso: blender --background --python blender/scripts/nadador.py
Salida: public/models/nadador.glb  (+ blender/salida/nadador_preview.png)
"""

import math
import os

import bpy
from mathutils import Vector

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FBX = os.path.join(RAIZ, "assets", "modelos", "nadador", "Swimming.fbx")
PUBLICO = os.path.join(os.path.dirname(RAIZ), "public", "models")
SALIDA = os.path.join(RAIZ, "salida")


def lin(h):
    h = h.lstrip("#")
    c = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=FBX)

arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
mallas = [o for o in bpy.data.objects if o.type == "MESH"]

# Colores: piel para el cuerpo, malla de natación oscura para las "juntas".
for o in mallas:
    for m in o.data.materials:
        m.use_nodes = True
        b = m.node_tree.nodes.get("Principled BSDF")
        if not b:
            continue
        for l in list(b.inputs["Base Color"].links):
            m.node_tree.links.remove(l)
        if "Joints" in m.name:
            b.inputs["Base Color"].default_value = lin("#1b2236")
            b.inputs["Roughness"].default_value = 0.45
        else:
            b.inputs["Base Color"].default_value = lin("#c8936f")
            b.inputs["Roughness"].default_value = 0.55
    # Menos polígonos para celulares (el decimate va antes del armature).
    mod = o.modifiers.new("decimar", "DECIMATE")
    mod.ratio = 0.35
    while o.modifiers[0].name != "decimar":
        bpy.ops.object.modifier_move_up({"object": o}, modifier="decimar") if False else o.modifiers.move(len(o.modifiers) - 1, 0)

# ¿La animación avanza sola (root motion) o queda en el lugar?
accion = bpy.data.actions[0]
sc = bpy.context.scene
sc.frame_start, sc.frame_end = int(accion.frame_range[0]), int(accion.frame_range[1])
hips = arm.pose.bones.get("mixamorig:Hips") or arm.pose.bones[0]
for f in (sc.frame_start, (sc.frame_start + sc.frame_end) // 2, sc.frame_end):
    sc.frame_set(f)
    p = arm.matrix_world @ hips.head
    print(f"HIPS frame {f}: {tuple(round(v, 2) for v in p)}")

# Preview de costado.
sc.frame_set(60)
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
sc.collection.objects.link(cam)
cam.location = (3.2, -2.6, 1.6)
centro = Vector((0, 0, 0.6))
cam.rotation_euler = (centro - cam.location).to_track_quat("-Z", "Y").to_euler()
sc.camera = cam
sol = bpy.data.objects.new("sol", bpy.data.lights.new("sol", "SUN"))
sol.data.energy = 3
sol.rotation_euler = (math.radians(50), 0, math.radians(30))
sc.collection.objects.link(sol)
w = bpy.data.worlds.new("w")
sc.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.5, 0.6, 0.7, 1)
try:
    sc.render.engine = "BLENDER_EEVEE"
except TypeError:
    sc.render.engine = "BLENDER_EEVEE_NEXT"
sc.render.resolution_x, sc.render.resolution_y = 640, 400
sc.render.filepath = os.path.join(SALIDA, "nadador_preview.png")
bpy.ops.render.render(write_still=True)

# Exportar solo el personaje (armature + mallas) con su animación.
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
for o in mallas:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
os.makedirs(PUBLICO, exist_ok=True)
ruta = os.path.join(PUBLICO, "nadador.glb")
bpy.ops.export_scene.gltf(
    filepath=ruta,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_animations=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_lights=False,
    export_cameras=False,
)
print("GLB nadador:", os.path.getsize(ruta) // 1024, "KB")
