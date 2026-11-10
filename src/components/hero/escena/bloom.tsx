"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/**
 * Post-proceso con bloom (resplandor en estrellas, brillos del agua y cáusticas).
 * useFrame con prioridad 1 toma el control del render.
 */
export function Bloom({ fuerza = 0.6, radio = 0.4, umbral = 0.9 }: { fuerza?: number; radio?: number; umbral?: number }) {
	const gl = useThree((s) => s.gl);
	const scene = useThree((s) => s.scene);
	const camera = useThree((s) => s.camera);
	const size = useThree((s) => s.size);

	const composer = useMemo(() => {
		const c = new EffectComposer(gl);
		c.addPass(new RenderPass(scene, camera));
		// UnrealBloomPass trabaja internamente con mips a media resolución: barato incluso en celulares.
		c.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), fuerza, radio, umbral));
		c.addPass(new OutputPass());
		return c;
	}, [gl, scene, camera, fuerza, radio, umbral]);

	useEffect(() => {
		composer.setPixelRatio(gl.getPixelRatio());
		composer.setSize(size.width, size.height);
	}, [composer, gl, size]);

	useEffect(() => () => composer.dispose(), [composer]);

	useFrame((_, delta) => composer.render(delta), 1);
	return null;
}
