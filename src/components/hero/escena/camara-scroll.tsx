"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import type { EstadoEscena } from "./estado-escena";

/** Recorrido de la cámara según el scroll: arranca alta mirando la pileta y avanza rasante sobre el agua. */
// Toma de dron en diagonal (como la foto aérea) que baja hasta el borde, mirando hacia el toldo y los partidores.
const INICIO = { pos: new THREE.Vector3(17, 21, 27), mira: new THREE.Vector3(0, 0, -1) };
/** En pantallas verticales (celular) la toma arranca más alta y centrada: la pileta entra entera y la torre de clavados no tapa. */
const INICIO_VERTICAL = { pos: new THREE.Vector3(4, 36, 25), mira: new THREE.Vector3(0, 0, -1.5) };
const FIN = { pos: new THREE.Vector3(0, 1.8, 15.5), mira: new THREE.Vector3(0, 0.9, -12.5) };

const suavizar = (t: number) => t * t * (3 - 2 * t);

export function CamaraScroll({ estadoRef }: { estadoRef: RefObject<EstadoEscena> }) {
	const pos = useRef(INICIO.pos.clone());
	const mira = useRef(INICIO.mira.clone());
	const objetivoPos = useRef(new THREE.Vector3());
	const objetivoMira = useRef(new THREE.Vector3());

	useFrame((state, delta) => {
		const p = suavizar(Math.min(1, Math.max(0, estadoRef.current.progreso)));
		const t = state.clock.elapsedTime;
		const inicio = state.size.width < state.size.height ? INICIO_VERTICAL : INICIO;
		objetivoPos.current.lerpVectors(inicio.pos, FIN.pos, p);
		objetivoMira.current.lerpVectors(inicio.mira, FIN.mira, p);

		// Parallax con el mouse (en touch, pointer queda en 0).
		objetivoPos.current.x += state.pointer.x * 1.4;
		objetivoPos.current.y += state.pointer.y * 0.5;

		const k = 1 - Math.exp(-delta * 3);
		pos.current.lerp(objetivoPos.current, k);
		mira.current.lerp(objetivoMira.current, k);

		// Flotación sutil, como en un bote.
		state.camera.position.set(
			pos.current.x + Math.sin(t * 0.25) * 0.35,
			pos.current.y + Math.cos(t * 0.33) * 0.18,
			pos.current.z,
		);
		state.camera.lookAt(mira.current);
	});

	return null;
}
