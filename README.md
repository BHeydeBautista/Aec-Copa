# Copa Challenger AEC · Clínica Meolans

Landing + formulario de inscripción con subida de comprobante.
Next.js 16 (App Router, Cache Components) · React 19 · Tailwind 4 · three.js / R3F · GSAP (ScrollTrigger) · motion · react-hook-form + zod.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Estructura

```
src/
├─ app/                      # Solo páginas y rutas: llaman a componentes
│  ├─ page.tsx               # Home: hero, logos, cronograma, precios, CTA, FAQ
│  ├─ inscripcion/page.tsx   # Formulario (?tipo=pileta-challenger preselecciona)
│  └─ api/
│     ├─ inscripcion/route.ts  # POST multipart: valida, recalcula precio y guarda
│     └─ cupos/route.ts        # GET cupo en vivo de Pileta Challenger
├─ components/               # Toda la UI y su lógica de presentación
│  ├─ layout/ (navbar, footer Systemium)
│  ├─ hero/ (hero con scroll en 2 slides, titulo-animado, countdown)
│  │  └─ escena/ ← 3D "noche en la pileta": cielo, olas, agua, corcheras, cámara por scroll, bloom
│  ├─ sections/ (cronograma horizontal con GSAP, precios, logos, faq, cta)
│  ├─ inscripcion/ (form, stepper, pasos/, dropzone, resumen, éxito)
│  └─ ui/ (button, input, field, section-heading, reveal…)
├─ data/                     # ✏️ CONTENIDO EDITABLE: evento, hero, cronograma, entradas, pago, logos, FAQ
├─ hooks/                    # use-inscripcion-form, use-cupo, use-countdown, use-active-section…
├─ lib/                      # utils (cn), gsap (registro de plugins), cronograma, format, precios, validations/, services/, server/
└─ types/                    # Interfaces de todo el dominio
```

## ⚠️ Antes de publicar: completar

| Qué | Dónde |
|---|---|
| Fechas de la clínica y la copa, sede, contacto | `src/data/evento.ts` |
| Horarios y pruebas | `src/data/cronograma.ts` |
| Alias / CBU / titular (y link de Mercado Pago, opcional) | `src/data/pago.ts` |
| Precio de Pileta Challenger después del cupo de 60 | `src/data/entradas.ts` → `precioSobreCupo` |
| Backend de guardado (Google Sheet + Drive) | `docs/google-apps-script.gs` + variables de `.env.example` |

## Modelo 3D del natatorio (Blender)

El natatorio del hero se modela por script en Blender 5.2 a partir de las fotos del club,
con assets CC0 de [Poly Haven](https://polyhaven.com) (texturas, cielo HDRI y sillas).

```bash
node blender/scripts/descargar-assets.mjs          # baja texturas, HDRI y modelos CC0 a blender/assets/
python blender/scripts/preparar-texturas.py        # genera las texturas con los colores reales del club
blender --background --python blender/scripts/natatorio.py -- preview   # renders de prueba en blender/salida/
blender --background --python blender/scripts/natatorio.py -- bake      # hornea la luz y exporta a public/models/
blender --background --python blender/scripts/nadador.py                # nadador animado (Mixamo) → public/models/nadador.glb
```

- `natatorio.py`: toda la geometría (pileta, tribuna, gimnasio, canchas, palmeras, partidores, banderines…).
- `base.py`: utilidades (geometría, UV a escala real) y materiales.
- `detalles.py`: lonas de sponsors (con los logos de `public/logos`), gazebos y gente en tribuna, toldo y solárium.
- `nadador.py`: convierte el nadador de Mixamo (`blender/assets/modelos/nadador/Swimming.fbx`) en un GLB animado con Draco.
- `hornear.py`: lightmap con Cycles (CPU; `AEC_BAKE_GPU=1` para probar GPU) + exportación `.glb`.
- La web (`components/hero/escena/`) carga el `.glb` con la luz horneada y dibuja encima, en tiempo real,
  el agua interactiva, las corcheras y los nadadores.

## Rendimiento en celular

La escena 3D baja su calidad sola en pantallas chicas o equipos con pocos núcleos
(`detectarCalidad()` en `components/hero/escena/estado-escena.ts`): menos geometría y estrellas, DPR máx. 1.5.
Se pausa cuando el hero sale de pantalla y respeta `prefers-reduced-motion`.

## Guardado de inscripciones

- **Desarrollo**: sin variables de entorno, se guarda en `.data/inscripciones.json` y `.data/comprobantes/`.
- **Producción**: Vercel no permite escribir archivos → configurar Google Apps Script (instrucciones en
  `docs/google-apps-script.gs`). Cada inscripción queda como fila en una Google Sheet y el comprobante en Drive.
  El precio se recalcula siempre en el servidor y el cupo se cuenta excluyendo los `rechazado`.

## Usar componentes de 21st.dev

`components.json` ya está configurado y `cn()` está en `@/lib/utils`, así que funciona
`npx shadcn@latest add "<url del componente>"`. Las variables de color shadcn (`--primary`, `--card`, etc.)
están mapeadas a la paleta AEC en `src/app/globals.css`.
