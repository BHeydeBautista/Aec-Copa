"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { clone as clonarConEsqueleto } from "three/examples/jsm/utils/SkeletonUtils.js";
import { CENTROS_ANDARIVEL, MAX_NADADORES, PILETA, type EstadoEscena } from "./estado-escena";

/**
 * Nadadores de crol animados (personaje y animación de Mixamo, convertidos con blender/scripts/nadador.py).
 * La animación trae desplazamiento propio: se anula y cada nadador avanza por su andarivel, da la vuelta
 * en la pared y escribe su posición en el estado para que el agua dibuje la estela.
 */
const URL_NADADOR = "/models/nadador.glb";

const NADADORES = [
	{ andarivel: 1, velocidad: 1.15, ritmo: 1.7, fase: 0, gorra: "#e2453f" },
	{ andarivel: 2, velocidad: 1.3, ritmo: 1.9, fase: 8, gorra: "#f2c230" },
	{ andarivel: 4, velocidad: 1.05, ritmo: 1.6, fase: 15, gorra: "#f4f6fa" },
].slice(0, MAX_NADADORES);

const RECORRIDO = PILETA.largo - 3.2; // vuelve a ~1.6 m de cada pared
const ALTURA_CADERA = 0.7; // la cadera del personaje está 0.7 m sobre su origen
const PROFUNDIDAD = -0.3; // asoman espalda, cabeza y brazada; el resto queda bajo el agua

/** Clip "en el lugar": se quita la traslación de la cadera (el avance lo maneja la escena). */
function clipEnLugar(clip: THREE.AnimationClip) {
	const c = clip.clone();
	c.tracks = c.tracks.filter((t) => !/Hips\.position$/.test(t.name));
	return c;
}

function Nadador({ indice, estadoRef }: { indice: number; estadoRef: RefObject<EstadoEscena> }) {
	const { scene, animations } = useGLTF(URL_NADADOR, "/draco/");
	const grupo = useRef<THREE.Group>(null);
	const mixer = useRef<THREE.AnimationMixer | null>(null);
	const giro = useRef(0);
	const n = NADADORES[indice];
	const x = CENTROS_ANDARIVEL[n.andarivel];

	const modelo = useMemo(() => clonarConEsqueleto(scene), [scene]);

	useEffect(() => {
		const m = new THREE.AnimationMixer(modelo);
		const accion = m.clipAction(clipEnLugar(animations[0]));
		accion.timeScale = n.ritmo;
		accion.play();
		accion.time = (indice * 2.3) % animations[0].duration; // que no braceen sincronizados
		mixer.current = m;

		// Gorra de color en la cabeza.
		const cabeza = modelo.getObjectByName("mixamorigHead");
		let gorra: THREE.Mesh | null = null;
		if (cabeza) {
			const escala = new THREE.Vector3();
			cabeza.getWorldScale(escala);
			gorra = new THREE.Mesh(
				new THREE.SphereGeometry(0.098, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
				new THREE.MeshStandardMaterial({ color: n.gorra, roughness: 0.35 }),
			);
			gorra.scale.setScalar(1 / (escala.x || 1));
			gorra.position.set(0, 0.105 / (escala.y || 1), 0.0);
			cabeza.add(gorra);
		}
		modelo.traverse((o) => {
			if ((o as THREE.Mesh).isMesh) o.frustumCulled = false;
		});
		return () => {
			m.stopAllAction();
			if (gorra && cabeza) cabeza.remove(gorra);
		};
	}, [modelo, animations, n.ritmo, n.gorra, indice]);

	useFrame((state, delta) => {
		const g = grupo.current;
		if (!g) return;
		mixer.current?.update(delta);
		const t = state.clock.elapsedTime;

		// Ida y vuelta a lo largo de la pileta.
		const d = (t * n.velocidad + n.fase) % (RECORRIDO * 2);
		const ida = d < RECORRIDO;
		const z = ida ? -RECORRIDO / 2 + d : RECORRIDO / 2 - (d - RECORRIDO);
		const dir = ida ? 1 : -1;

		// Vuelta suave en la pared.
		const objetivo = ida ? 0 : Math.PI;
		giro.current += (objetivo - giro.current) * (1 - Math.exp(-delta * 6));
		g.position.set(x, PROFUNDIDAD - ALTURA_CADERA, z);
		g.rotation.y = giro.current;

		const s = estadoRef.current.nadadores;
		s[indice * 3] = x;
		s[indice * 3 + 1] = z + dir * 0.8;
		s[indice * 3 + 2] = dir;
	});

	return (
		<group ref={grupo}>
			<primitive object={modelo} />
		</group>
	);
}

export function Nadadores({ estadoRef }: { estadoRef: RefObject<EstadoEscena> }) {
	return (
		<Suspense fallback={null}>
			{NADADORES.map((_, i) => (
				<Nadador key={i} indice={i} estadoRef={estadoRef} />
			))}
		</Suspense>
	);
}

useGLTF.preload(URL_NADADOR, "/draco/");
