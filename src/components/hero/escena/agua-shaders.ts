import { MAX_NADADORES, MAX_ONDAS } from "./estado-escena";

/**
 * Shaders del agua de la pileta.
 * La parte de olas + ondas de `elevacion` está duplicada en JS (agua-math.ts) para que las
 * corcheras floten sobre las mismas olas. Si cambiás una, cambiá la otra.
 */

const elevacionGlsl = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseAmt;
uniform vec3 uRipples[${MAX_ONDAS}];
uniform vec3 uNadadores[${MAX_NADADORES}];

float elevacion(vec2 p) {
  // Agua de pileta: calma, con oleaje chico.
  float e = sin(p.x * 0.6 + uTime * 1.1) * 0.035
          + sin(p.y * 0.45 + uTime * 0.8) * 0.03
          + sin((p.x + p.y) * 1.3 + uTime * 1.9) * 0.015
          + sin(p.x * 2.7 - p.y * 2.1 + uTime * 2.6) * 0.008;

  vec2 dm = p - uMouse;
  float dmm = length(dm);
  e += exp(-dmm * dmm * 0.5) * 0.12 * uMouseAmt * (0.6 + 0.4 * sin(uTime * 3.0 - dmm * 2.5));

  for (int i = 0; i < ${MAX_ONDAS}; i++) {
    vec3 r = uRipples[i];
    float age = uTime - r.z;
    if (age < 0.0 || age > 5.0) continue;
    float d = distance(p, r.xy);
    float ring = exp(-pow(d - age * 2.6, 2.0) * 2.0) * exp(-age * 0.8);
    e += sin(d * 6.0 - age * 10.0) * ring * 0.14;
  }
  return e;
}

// Estela de los nadadores (solo en el shader: las corcheras quedan lejos).
float estela(vec2 p) {
  float e = 0.0;
  for (int i = 0; i < ${MAX_NADADORES}; i++) {
    vec3 s = uNadadores[i];
    vec2 rel = p - s.xy;
    float l = length(rel);
    if (l > 6.0) continue;
    e += exp(-l * l * 3.0) * 0.06;
    float atras = smoothstep(0.0, -1.0, rel.y * s.z);
    e += atras * sin(l * 7.0 - uTime * 9.0) * exp(-l * 0.6) * 0.03 * smoothstep(2.0, 0.0, abs(rel.x));
  }
  return e;
}
`;

export const waterVertexShader = /* glsl */ `
${elevacionGlsl}

varying vec3 vWorld;
varying vec3 vNormal;
varying float vElev;

float altura(vec2 p) { return elevacion(p) + estela(p); }

void main() {
  vec3 pos = position;
  vec2 p = pos.xz;
  float e = altura(p);
  pos.y += e;

  float eps = 0.06;
  float ex = altura(p + vec2(eps, 0.0)) - e;
  float ez = altura(p + vec2(0.0, eps)) - e;
  vNormal = normalize(vec3(-ex, eps, -ez));
  vElev = e;

  vec4 world = modelMatrix * vec4(pos, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

/**
 * Superficie del agua: transparente, con color de agua, reflejo del cielo (Fresnel) y brillo del sol.
 * Lo que está bajo la superficie (fondo, paredes, nadadores) se ve teñido a través de ella.
 */
export const waterFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uCielo;
uniform vec3 uSol;
uniform vec3 uFog;
uniform float uFogDensity;

varying vec3 vWorld;
varying vec3 vNormal;
varying float vElev;

void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(cameraPosition - vWorld);
  float cosV = max(dot(n, viewDir), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - cosV, 5.0);

  // Tinte del agua: más claro en las crestas.
  vec3 tinte = mix(uDeep, uShallow, clamp(0.55 + vElev * 5.0, 0.0, 1.0));
  vec3 col = mix(tinte, uCielo, clamp(fres * 0.9, 0.0, 0.6));

  vec3 L = normalize(vec3(-0.67, 0.57, -0.47));
  vec3 H = normalize(L + viewDir);
  float brillo = pow(max(dot(n, H), 0.0), 420.0);
  col += uSol * brillo * 0.9;

  // Más opaca de costado (Fresnel), bastante transparente mirando desde arriba.
  float alfa = clamp(0.5 + fres * 0.8 + brillo, 0.0, 0.96);

  float dist = length(cameraPosition - vWorld);
  float f = 1.0 - exp(-pow(uFogDensity * dist, 2.0));
  col = mix(col, uFog, f);

  gl_FragColor = vec4(col, alfa);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/**
 * Fondo de la pileta (debajo del agua): azulejos, líneas negras con su "T", franja de triángulos,
 * sombra junto a las paredes y cáusticas animadas. Se deforma con el tiempo para simular la refracción.
 */
export const fondoVertexShader = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const fondoFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uAzulejo;
uniform vec3 uLinea;
uniform vec3 uFog;
uniform float uFogDensity;
uniform float uLaneSpacing;
uniform vec2 uMedio;

varying vec3 vWorld;

float causticas(vec2 p, float t) {
  vec2 q = p;
  float c = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i) + 1.0;
    q += vec2(sin(q.y * 1.9 * fi + t * 1.1), cos(q.x * 1.7 * fi - t * 0.9)) * 0.35 / fi;
    c += sin(q.x * 3.0 + t) * sin(q.y * 3.0 - t);
  }
  c /= 3.0;
  return pow(max(1.0 - abs(c) * 1.4, 0.0), 6.0);
}

void main() {
  // Refracción simulada: el dibujo del fondo ondula con el agua.
  vec2 fp = vWorld.xz + vec2(sin(vWorld.z * 1.3 + uTime * 1.4), cos(vWorld.x * 1.1 + uTime * 1.2)) * 0.05;

  vec2 tg = abs(fract(fp / 0.25) - 0.5);
  float junta = 1.0 - smoothstep(0.0, 0.05, min(tg.x, tg.y));

  float dLinea = abs(fract((fp.x + uMedio.x - 0.5) / uLaneSpacing) - 0.5) * uLaneSpacing;
  float finLinea = uMedio.y - 2.0;
  float linea = (1.0 - smoothstep(0.12, 0.15, dLinea)) * (1.0 - smoothstep(finLinea, finLinea + 0.04, abs(fp.y)));
  float te = (1.0 - smoothstep(0.12, 0.15, abs(abs(fp.y) - finLinea))) * (1.0 - smoothstep(0.48, 0.52, dLinea));
  linea = max(linea, te);

  float dFin = uMedio.y - abs(fp.y);
  float uTri = abs(fract(fp.x / 0.7) - 0.5) * 2.0;
  float hTri = (dFin - 2.6) / 0.55;
  float triangulos = step(0.0, hTri) * step(hTri, 1.0) * step(hTri, 1.0 - uTri);

  vec2 borde = uMedio - abs(vWorld.xz);
  float cercaPared = 1.0 - smoothstep(0.0, 1.2, min(borde.x, borde.y));

  vec3 col = uAzulejo * (1.0 - junta * 0.12);
  col = mix(col, uLinea, linea * 0.9);
  col = mix(col, uLinea * 1.6, triangulos * 0.7);
  col *= 1.0 - cercaPared * 0.25;
  col += vec3(0.75, 0.95, 1.0) * causticas(fp * 0.6, uTime * 0.5) * 0.28;

  float dist = length(cameraPosition - vWorld);
  float f = 1.0 - exp(-pow(uFogDensity * dist, 2.0));
  col = mix(col, uFog, f);

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
