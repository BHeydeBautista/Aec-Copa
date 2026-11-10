// Descarga los assets CC0 de Poly Haven que usa el modelo del natatorio.
// Uso: node blender/scripts/descargar-assets.mjs   (deja todo en blender/assets/)
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const DESTINO = path.resolve("blender/assets");
const UA = { "User-Agent": "aec-copa-build" };
const RES = "1k";

const TEXTURAS = [
	"anti_slip_concrete", // solárium
	"leafy_grass", // pasto
	"painted_concrete_02", // tribuna / borde
	"white_plaster_rough_01", // edificios
	"corrugated_iron_02", // techos
	"square_tiles_02", // azulejo de paredes de la pileta
	"concrete_floor_02", // solárium (hormigón liso)
	"asphalt_02", // calles alrededor
	"red_brick", // torre de ladrillo
];
const HDRI = "qwantani_afternoon_puresky";
const MODELOS = ["plastic_monobloc_chair_01"];

async function existe(p) {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

async function bajar(url, archivo) {
	if (await existe(archivo)) return;
	const res = await fetch(url, { headers: UA });
	if (!res.ok) throw new Error(`${res.status} ${url}`);
	await mkdir(path.dirname(archivo), { recursive: true });
	await writeFile(archivo, Buffer.from(await res.arrayBuffer()));
	console.log("✓", path.relative(DESTINO, archivo));
}

async function archivos(id) {
	const res = await fetch(`https://api.polyhaven.com/files/${id}`, { headers: UA });
	return res.json();
}

for (const id of TEXTURAS) {
	const f = await archivos(id);
	const mapas = { diff: f.Diffuse, nor: f.nor_gl, rough: f.Rough };
	for (const [nombre, m] of Object.entries(mapas)) {
		const url = m?.[RES]?.jpg?.url;
		if (url) await bajar(url, path.join(DESTINO, "texturas", id, `${nombre}.jpg`));
	}
}

{
	const f = await archivos(HDRI);
	await bajar(f.hdri["1k"].hdr.url, path.join(DESTINO, "hdri", `${HDRI}_1k.hdr`));
	await bajar(f.hdri["2k"].hdr.url, path.join(DESTINO, "hdri", `${HDRI}_2k.hdr`));
}

for (const id of MODELOS) {
	const f = await archivos(id);
	const g = f.gltf[RES].gltf;
	const base = path.join(DESTINO, "modelos", id);
	await bajar(g.url, path.join(base, `${id}.gltf`));
	for (const [rel, info] of Object.entries(g.include ?? {})) await bajar(info.url, path.join(base, rel));
}
console.log("Listo:", DESTINO);
