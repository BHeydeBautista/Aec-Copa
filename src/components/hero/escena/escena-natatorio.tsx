"use client";

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { Agua, Corcheras, FondoPileta } from "./agua";
import { Bloom } from "./bloom";
import { CamaraScroll } from "./camara-scroll";
import { COLORES, DENSIDAD_NIEBLA, detectarCalidad, type EstadoEscena } from "./estado-escena";
import { Nadadores } from "./nadadores";
import { NatatorioModelo } from "./natatorio-modelo";

interface EscenaNatatorioProps {
	/** Contenedor que recibe el mouse/touch (el hero completo, así el texto no bloquea la interacción). */
	eventSource: RefObject<HTMLElement | null>;
	estadoRef: RefObject<EstadoEscena>;
	activo: boolean;
	reducirMovimiento: boolean;
	onListo?: () => void;
}

/**
 * Natatorio del AEC: modelo de Blender con luz horneada + agua interactiva, corcheras y nadadores
 * en tiempo real, con el mismo cielo de tarde (HDRI de Poly Haven) que se usó para hornear.
 */
export default function EscenaNatatorio({ eventSource, estadoRef, activo, reducirMovimiento, onListo }: EscenaNatatorioProps) {
	const calidad = useMemo(() => detectarCalidad(), []);

	return (
		<Canvas
			eventSource={eventSource as RefObject<HTMLElement>}
			eventPrefix="client"
			frameloop={!activo ? "never" : reducirMovimiento ? "demand" : "always"}
			dpr={[1, calidad.dprMax]}
			camera={{ position: [24, 30, 40], fov: 55, near: 0.1, far: 900 }}
			gl={{ antialias: !calidad.bloom, powerPreference: "high-performance", toneMappingExposure: 0.95 }}
			onCreated={({ gl, scene }) => {
				// ACES: más contraste que AgX "base" (Blender usa AgX con look de contraste medio-alto).
				gl.toneMapping = THREE.ACESFilmicToneMapping;
				scene.fog = new THREE.FogExp2(COLORES.niebla, DENSIDAD_NIEBLA);
			}}
		>
			{/* Luces solo para lo que no tiene luz horneada (corcheras, nadadores, sillas, suelo). Sol de la tarde desde el oeste. */}
			<hemisphereLight args={["#cfe0ff", "#6b6152", 0.9]} />
			<directionalLight position={[-40, 34, -28]} intensity={2.2} color="#fff0dc" />

			<Suspense fallback={null}>
				<Environment files="/hdri/cielo-tarde.hdr" background backgroundRotation={[0, Math.PI * 1.11, 0]} environmentIntensity={0.6} />
				<NatatorioModelo onListo={onListo} />
			</Suspense>

			<CamaraScroll estadoRef={estadoRef} />
			<Nadadores estadoRef={estadoRef} />
			<FondoPileta />
			<Agua estadoRef={estadoRef} segmentos={calidad.segmentosAgua} />
			<Corcheras estadoRef={estadoRef} />

			{calidad.bloom && <Bloom fuerza={0.22} radio={0.3} umbral={1.0} />}
		</Canvas>
	);
}
