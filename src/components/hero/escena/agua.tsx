"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { elevacion } from "./agua-math";
import { fondoFragmentShader, fondoVertexShader, waterFragmentShader, waterVertexShader } from "./agua-shaders";
import {
	COLORES,
	DENSIDAD_NIEBLA,
	MAX_NADADORES,
	MAX_ONDAS,
	PILETA,
	agregarOnda,
	type EstadoEscena,
} from "./estado-escena";

type EstadoRef = RefObject<EstadoEscena>;

/** Corcheras entre andariveles y en los bordes: x = -10, -7.5 … 10 */
const CORCHERAS_X = Array.from({ length: PILETA.andariveles + 1 }, (_, i) => -PILETA.medioAncho + 0.5 + i * PILETA.andarivel);
const Z_INICIO = -PILETA.medioLargo + 0.3;
const Z_FIN = PILETA.medioLargo - 0.3;
const PASO_BOYA = 0.42;
const BOYAS_POR_CORCHERA = Math.floor((Z_FIN - Z_INICIO) / PASO_BOYA) + 1;
const TOTAL_BOYAS = CORCHERAS_X.length * BOYAS_POR_CORCHERA;

function crearUniforms() {
	return {
		uTime: { value: 0 },
		uMouse: { value: new THREE.Vector2(0, -100) },
		uMouseAmt: { value: 0 },
		uRipples: { value: Array.from({ length: MAX_ONDAS }, () => new THREE.Vector3(0, 0, -100)) },
		uNadadores: { value: Array.from({ length: MAX_NADADORES }, () => new THREE.Vector3(-100, -100, 1)) },
		uDeep: { value: new THREE.Color(COLORES.aguaProfunda) },
		uShallow: { value: new THREE.Color(COLORES.agua) },
		uLinea: { value: new THREE.Color(COLORES.lineaFondo) },
		uCielo: { value: new THREE.Color("#b7cde6") },
		uSol: { value: new THREE.Color("#fff3e0") },
		uFog: { value: new THREE.Color(COLORES.niebla) },
		uFogDensity: { value: DENSIDAD_NIEBLA },
		uLaneSpacing: { value: PILETA.andarivel },
		uMedio: { value: new THREE.Vector2(PILETA.medioAncho, PILETA.medioLargo) },
	};
}

/** Agua de la pileta (21 × 50 m): olas suaves, cáusticas, azulejos, líneas de fondo y ondas al tocar. */
export function Agua({ estadoRef, segmentos }: { estadoRef: EstadoRef; segmentos: number }) {
	const malla = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);

	const geometry = useMemo(() => {
		const g = new THREE.PlaneGeometry(PILETA.ancho, PILETA.largo, Math.round(segmentos * 0.42), segmentos);
		g.rotateX(-Math.PI / 2);
		return g;
	}, [segmentos]);

	const uniforms = useMemo(() => crearUniforms(), []);

	useLayoutEffect(() => () => geometry.dispose(), [geometry]);

	useFrame((state, delta) => {
		const estado = estadoRef.current;
		const mesh = malla.current;
		if (!mesh) return;

		const t = state.clock.elapsedTime;
		estado.tiempo = t;
		const k = 1 - Math.exp(-delta * 6);
		estado.mouse.lerp(estado.mouseObjetivo, k);
		estado.mouseAmt += (estado.mouseAmtObjetivo - estado.mouseAmt) * k;

		// Alguna onda suelta para que el agua tenga vida aunque nadie la toque.
		if (t > estado.proximaAuto) {
			agregarOnda(estado, (Math.random() - 0.5) * (PILETA.ancho - 3), (Math.random() - 0.5) * (PILETA.largo - 4), t);
			estado.proximaAuto = t + 2.5 + Math.random() * 2;
		}

		const u = mesh.material.uniforms;
		u.uTime.value = t;
		(u.uMouse.value as THREE.Vector2).copy(estado.mouse);
		u.uMouseAmt.value = estado.mouseAmt;
		const ripples = u.uRipples.value as THREE.Vector3[];
		for (let i = 0; i < MAX_ONDAS; i++) {
			ripples[i].set(estado.ondas[i * 3], estado.ondas[i * 3 + 1], estado.ondas[i * 3 + 2]);
		}
		const nad = u.uNadadores.value as THREE.Vector3[];
		for (let i = 0; i < MAX_NADADORES; i++) {
			nad[i].set(estado.nadadores[i * 3], estado.nadadores[i * 3 + 1], estado.nadadores[i * 3 + 2]);
		}
	});

	const onMove = (e: ThreeEvent<PointerEvent>) => {
		if (e.pointerType !== "mouse") return;
		estadoRef.current.mouseObjetivo.set(e.point.x, e.point.z);
		estadoRef.current.mouseAmtObjetivo = 1;
	};
	const onOut = () => {
		estadoRef.current.mouseAmtObjetivo = 0;
	};
	const onDown = (e: ThreeEvent<PointerEvent>) => {
		agregarOnda(estadoRef.current, e.point.x, e.point.z, estadoRef.current.tiempo);
	};

	return (
		<mesh ref={malla} geometry={geometry} onPointerMove={onMove} onPointerOut={onOut} onPointerDown={onDown}>
			<shaderMaterial
				vertexShader={waterVertexShader}
				fragmentShader={waterFragmentShader}
				uniforms={uniforms}
				transparent
				depthWrite={false}
			/>
		</mesh>
	);
}

/** Corcheras: boyas instanciadas que flotan sobre la misma función de olas que el shader. */
export function Corcheras({ estadoRef }: { estadoRef: EstadoRef }) {
	const ref = useRef<THREE.InstancedMesh>(null);
	const dummy = useRef(new THREE.Object3D());

	useLayoutEffect(() => {
		const mesh = ref.current;
		if (!mesh) return;
		const rojo = new THREE.Color("#e2562e");
		const azul = new THREE.Color("#2f5fb8");
		const blanco = new THREE.Color("#f2f5fa");
		const amarillo = new THREE.Color("#f2c230");
		let i = 0;
		for (let c = 0; c < CORCHERAS_X.length; c++) {
			const borde = c === 0 || c === CORCHERAS_X.length - 1;
			for (let b = 0; b < BOYAS_POR_CORCHERA; b++) {
				const z = Z_INICIO + b * PASO_BOYA;
				// Como en las fotos: últimos 5 m rojo-naranja, marca amarilla a 5 m, centro azul/blanco.
				const extremo = z > Z_FIN - 5 || z < Z_INICIO + 5;
				const marca15 = Math.abs(Math.abs(z) - (PILETA.medioLargo - 5)) < 0.3;
				const color = extremo ? rojo : marca15 ? amarillo : borde ? azul : Math.floor(b / 2) % 2 === 0 ? azul : blanco;
				mesh.setColorAt(i++, color);
			}
		}
		if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
	}, []);

	useFrame((state) => {
		const mesh = ref.current;
		if (!mesh) return;
		const estado = estadoRef.current;
		const d = dummy.current;
		const t = state.clock.elapsedTime;
		let i = 0;
		for (const x of CORCHERAS_X) {
			for (let b = 0; b < BOYAS_POR_CORCHERA; b++) {
				const z = Z_INICIO + b * PASO_BOYA;
				const y = elevacion(x, z, t, estado.mouse.x, estado.mouse.y, estado.mouseAmt, estado.ondas);
				d.position.set(x, y + 0.04, z);
				d.rotation.set(Math.PI / 2, 0, t * 0.6 + b * 0.4);
				d.updateMatrix();
				mesh.setMatrixAt(i++, d.matrix);
			}
		}
		mesh.instanceMatrix.needsUpdate = true;
	});

	return (
		<instancedMesh ref={ref} args={[undefined, undefined, TOTAL_BOYAS]} frustumCulled={false}>
			<cylinderGeometry args={[0.09, 0.09, 0.3, 8]} />
			<meshStandardMaterial roughness={0.45} metalness={0.05} />
		</instancedMesh>
	);
}

const PROFUNDIDAD_FONDO = -1.7;

/** Fondo de la pileta bajo el agua transparente (azulejos, líneas, triángulos y cáusticas). */
export function FondoPileta() {
	const malla = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);
	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uAzulejo: { value: new THREE.Color("#4cc4de") },
			uLinea: { value: new THREE.Color(COLORES.lineaFondo) },
			uFog: { value: new THREE.Color(COLORES.niebla) },
			uFogDensity: { value: DENSIDAD_NIEBLA },
			uLaneSpacing: { value: PILETA.andarivel },
			uMedio: { value: new THREE.Vector2(PILETA.medioAncho, PILETA.medioLargo) },
		}),
		[],
	);

	useFrame((state) => {
		if (malla.current) malla.current.material.uniforms.uTime.value = state.clock.elapsedTime;
	});

	return (
		<mesh ref={malla} position={[0, PROFUNDIDAD_FONDO, 0]} rotation={[-Math.PI / 2, 0, 0]}>
			<planeGeometry args={[PILETA.ancho, PILETA.largo]} />
			<shaderMaterial vertexShader={fondoVertexShader} fragmentShader={fondoFragmentShader} uniforms={uniforms} />
		</mesh>
	);
}
