"""
Extrae cuadros de un video (el vuelo de dron generado con Higgsfield) como secuencia WebP para el hero.
Se usa Blender porque trae su propio decodificador de video (no hace falta ffmpeg).

Uso: blender --background --python blender/scripts/extraer-cuadros.py -- <video.mp4> <carpeta_salida> <ancho> <alto> [paso] [calidad]
  - ancho/alto: tamaño de salida; si la proporción no coincide con el video, se recorta al centro (cover).
  - paso: 1 = todos los cuadros, 2 = uno de cada dos…
"""

import os
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1 :]
video, salida, ancho, alto = args[0], args[1], int(args[2]), int(args[3])
paso = int(args[4]) if len(args) > 4 else 2
calidad = int(args[5]) if len(args) > 5 else 72

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.sequence_editor_create()
editor = sc.sequence_editor
coleccion = editor.strips if hasattr(editor, "strips") else editor.sequences  # "strips" desde Blender 4.4
tira = coleccion.new_movie("vuelo", video, 1, 1)
total = tira.frame_final_duration
elem = tira.elements[0]
vw, vh = elem.orig_width, elem.orig_height
print(f"VIDEO {vw}x{vh} cuadros={total}")

# Cover: escalar para llenar el encuadre de salida y recortar lo que sobra.
escala = max(ancho / vw, alto / vh)
tira.transform.scale_x = escala
tira.transform.scale_y = escala

sc.render.resolution_x, sc.render.resolution_y = ancho, alto
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = "WEBP"
sc.render.image_settings.quality = calidad
sc.render.image_settings.color_mode = "RGB"
sc.view_settings.view_transform = "Standard"
sc.frame_start, sc.frame_end, sc.frame_step = 1, total, paso

os.makedirs(salida, exist_ok=True)
for viejo in os.listdir(salida):
    if viejo.endswith(".webp"):
        os.remove(os.path.join(salida, viejo))
sc.render.filepath = os.path.join(salida, "tmp_")
bpy.ops.render.render(animation=True)

# Renombrar a f_000.webp, f_001.webp… (índices consecutivos).
archivos = sorted(f for f in os.listdir(salida) if f.startswith("tmp_"))
for i, f in enumerate(archivos):
    os.replace(os.path.join(salida, f), os.path.join(salida, f"f_{i:03d}.webp"))
print(f"CUADROS {len(archivos)} en {salida}")
