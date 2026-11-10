"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import luzConfig from "./natatorio-luz.json";

/**
 * Natatorio modelado en Blender (blender/scripts/natatorio.py) con la luz horneada en un lightmap.
 * Los objetos con UV de luz (uv1) usan MeshBasicMaterial: textura × lightmap, sin cálculo de luces
 * en tiempo real → se ve como el render de Cycles y corre liviano en celulares.
 */
const URL_MODELO = "/models/natatorio.glb";
const URL_LUZ = "/models/natatorio-luz.jpg";
/** Compensa que three no tiene el "look" de contraste de AgX que usa Blender. */
const AJUSTE_LUZ = 0.6;

const VEGETACION = /^(Hoja|HojaSeca|CopaArbol|Arbusto)/;

export function NatatorioModelo({ onListo }: { onListo?: () => void }) {
	const { scene } = useGLTF(URL_MODELO, "/draco/");
	const textura = useTexture(URL_LUZ);
	// Copia configurada para lightmap glTF: sin flipY, sRGB y en el segundo set de UV (uv1).
	const luz = useMemo(() => {
		const t = textura.clone();
		t.flipY = false;
		t.colorSpace = THREE.SRGBColorSpace;
		t.channel = 1;
		t.needsUpdate = true;
		return t;
	}, [textura]);

	useLayoutEffect(() => {

		scene.traverse((o) => {
			const malla = o as THREE.Mesh;
			if (!malla.isMesh) return;
			const original = malla.material as THREE.MeshStandardMaterial;

			if (original.name === "Lampara") {
				malla.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.1, 1.9), toneMapped: false });
				return;
			}
			if (malla.geometry.attributes.uv1) {
				malla.material = new THREE.MeshBasicMaterial({
					name: original.name,
					map: original.map,
					color: original.map ? 0xffffff : original.color,
					lightMap: luz,
					lightMapIntensity: Math.PI * luzConfig.escala * AJUSTE_LUZ,
					side: original.side,
				});
				return;
			}
			// Sin luz horneada (suelo, sillas, pileta chica): se iluminan con las luces de la escena.
			malla.castShadow = false;
			malla.receiveShadow = false;
			// Se bajan reflejos y, en la vegetación, el color: si no, quedan más claros que lo horneado.
			if (original.isMeshStandardMaterial && !original.userData.ajustado) {
				original.userData.ajustado = true;
				original.envMapIntensity = 0.35;
				if (VEGETACION.test(original.name)) {
					original.color.multiplyScalar(0.55);
					original.roughness = 1;
				}
			}
		});
		requestAnimationFrame(() => onListo?.());
	}, [scene, luz, onListo]);

	return <primitive object={scene} />;
}

useGLTF.preload(URL_MODELO, "/draco/");
