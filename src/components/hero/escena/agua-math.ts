import { MAX_ONDAS } from "./estado-escena";

/** Mismo cálculo que `elevacion()` del vertex shader (sin la estela de nadadores), en JS. */
export function elevacion(
	x: number,
	z: number,
	t: number,
	mouseX: number,
	mouseZ: number,
	mouseAmt: number,
	ondas: Float32Array,
): number {
	let e =
		Math.sin(x * 0.6 + t * 1.1) * 0.035 +
		Math.sin(z * 0.45 + t * 0.8) * 0.03 +
		Math.sin((x + z) * 1.3 + t * 1.9) * 0.015 +
		Math.sin(x * 2.7 - z * 2.1 + t * 2.6) * 0.008;

	const dmm = Math.hypot(x - mouseX, z - mouseZ);
	e += Math.exp(-dmm * dmm * 0.5) * 0.12 * mouseAmt * (0.6 + 0.4 * Math.sin(t * 3 - dmm * 2.5));

	for (let i = 0; i < MAX_ONDAS; i++) {
		const age = t - ondas[i * 3 + 2];
		if (age < 0 || age > 5) continue;
		const d = Math.hypot(x - ondas[i * 3], z - ondas[i * 3 + 1]);
		const ring = Math.exp(-((d - age * 2.6) ** 2) * 2) * Math.exp(-age * 0.8);
		e += Math.sin(d * 6 - age * 10) * ring * 0.14;
	}
	return e;
}
