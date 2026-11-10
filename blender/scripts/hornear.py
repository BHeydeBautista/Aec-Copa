"""
Horneado de luz (lightmap) y exportación del natatorio a glTF para la web.

- Crea un segundo UV ("luz") empaquetado en un único atlas para todos los objetos estáticos.
- Hornea con Cycles solo la LUZ difusa (directa + indirecta, sin color): sombras y rebotes.
- Guarda el lightmap en sRGB normalizado + un JSON con la escala para reconstruir la intensidad.
- Exporta un .glb liviano: solo color base (sin normal/rugosidad), texturas en WebP.

La web usa: color = textura * lightmap * escala  (MeshBasicMaterial con lightMap en uv1).
"""

import json
import os

import bpy
import numpy as np

TAM_LUZ = 2048
MUESTRAS = 400
# El driver HIP de AMD se cae horneando (Memobj map...). Por defecto CPU; AEC_BAKE_GPU=1 para probar GPU.
USAR_GPU = os.environ.get("AEC_BAKE_GPU") == "1"

RAIZ_PROYECTO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PUBLICO = os.path.join(RAIZ_PROYECTO, "public", "models")


def configurar_cycles():
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = MUESTRAS
    sc.cycles.use_denoising = False
    dispositivo = "CPU"
    sc.cycles.device = "CPU"
    if not USAR_GPU:
        print("Horneando con CPU")
        return
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for tipo in ("HIP", "CUDA", "OPTIX", "ONEAPI", "METAL"):
            try:
                prefs.compute_device_type = tipo
            except TypeError:
                continue
            prefs.get_devices()
            gpus = [d for d in prefs.devices if d.type != "CPU"]
            if gpus:
                for d in prefs.devices:
                    d.use = d.type != "CPU"
                dispositivo = f"GPU ({tipo}: {', '.join(d.name for d in gpus)})"
                sc.cycles.device = "GPU"
                break
    except Exception as e:  # noqa: BLE001
        print("No se pudo configurar GPU:", e)
    print("Horneando con", dispositivo)


def objetos_a_hornear():
    return [o for o in bpy.data.collections["NATATORIO"].objects if o.type == "MESH"]


def crear_uv_luz(obs):
    for o in obs:
        uvs = o.data.uv_layers
        if "luz" not in uvs:
            uvs.new(name="luz")
        uvs.active = uvs["luz"]
        uvs["UVMap"].active_render = True
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.lightmap_pack(
        PREF_CONTEXT="ALL_FACES",
        PREF_PACK_IN_ONE=True,
        PREF_NEW_UVLAYER=False,
        PREF_BOX_DIV=12,
        PREF_MARGIN_DIV=0.15,
    )
    bpy.ops.object.mode_set(mode="OBJECT")


def preparar_destino(obs):
    img = bpy.data.images.new("Luz", TAM_LUZ, TAM_LUZ, float_buffer=True, alpha=False)
    mats = {m for o in obs for m in o.data.materials if m}
    for m in mats:
        nt = m.node_tree
        n = nt.nodes.new("ShaderNodeTexImage")
        n.name = "LUZ_BAKE"
        n.image = img
        nt.nodes.active = n
    return img, mats


def hornear(obs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bake = bpy.context.scene.render.bake
    bake.margin = 6
    bake.use_pass_direct = True
    bake.use_pass_indirect = True
    bake.use_pass_color = False
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, margin=6, use_clear=True)


def guardar_lightmap(img):
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    rgb = px[:, :3]
    validos = rgb[rgb.max(axis=1) > 1e-4]
    escala = float(np.percentile(validos.max(axis=1), 99.7)) if len(validos) else 1.0
    # Suavizado leve (3×3) para limpiar ruido de muestreo.
    img3 = (rgb / escala).reshape(TAM_LUZ, TAM_LUZ, 3)
    pad = np.pad(img3, ((1, 1), (1, 1), (0, 0)), mode="edge")
    suave = sum(pad[dy : dy + TAM_LUZ, dx : dx + TAM_LUZ] for dy in range(3) for dx in range(3)) / 9.0
    lin = np.clip(0.4 * img3 + 0.6 * suave, 0, 1).reshape(-1, 3)
    srgb = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)
    out = bpy.data.images.new("LuzLDR", TAM_LUZ, TAM_LUZ, alpha=False)
    salida = np.concatenate([srgb, np.ones((srgb.shape[0], 1), dtype=np.float32)], axis=1)
    out.pixels.foreach_set(salida.ravel())
    out.filepath_raw = os.path.join(PUBLICO, "natatorio-luz.jpg")
    out.file_format = "JPEG"
    bpy.context.scene.render.image_settings.quality = 88
    out.save()
    datos = {"escala": round(escala, 4), "tam": TAM_LUZ}
    # La web lo importa desde el componente de la escena.
    destino_src = os.path.join(RAIZ_PROYECTO, "src", "components", "hero", "escena", "natatorio-luz.json")
    for ruta in (os.path.join(PUBLICO, "natatorio-luz.json"), destino_src):
        with open(ruta, "w", encoding="utf8") as f:
            json.dump(datos, f)
    print("Lightmap guardado. Escala:", escala)


def simplificar_materiales(mats):
    """Para la web solo hace falta el color base: se quitan normal, rugosidad y el nodo de bake."""
    for m in mats:
        nt = m.node_tree
        for nombre in ("ROUGH", "NOR", "NORMALMAP", "LUZ_BAKE"):
            n = nt.nodes.get(nombre)
            if n:
                nt.nodes.remove(n)


def exportar():
    bpy.ops.object.select_all(action="DESELECT")
    for nombre in ("NATATORIO", "SIN_LUZ"):
        for o in bpy.data.collections[nombre].objects:
            if o.type == "MESH":
                o.select_set(True)
    ruta = os.path.join(PUBLICO, "natatorio.glb")
    bpy.ops.export_scene.gltf(
        filepath=ruta,
        export_format="GLB",
        use_selection=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="WEBP",
        export_yup=True,
        export_apply=True,
        export_lights=False,
        export_cameras=False,
        # Draco: geometría ~5-10× más liviana. UV con 14 bits para no deformar el lightmap.
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=14,
    )
    print("GLB:", ruta, os.path.getsize(ruta) // 1024, "KB")


def hornear_y_exportar(salida):
    os.makedirs(PUBLICO, exist_ok=True)
    configurar_cycles()
    prev = bpy.data.collections.get("PREVIEW")
    if prev:
        for o in list(prev.objects):
            bpy.data.objects.remove(o)
    obs = objetos_a_hornear()
    crear_uv_luz(obs)
    img, mats = preparar_destino(obs)
    hornear(obs)
    guardar_lightmap(img)
    simplificar_materiales({m for m in bpy.data.materials if m.node_tree})
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(salida, "natatorio_horneado.blend"))
    exportar()
