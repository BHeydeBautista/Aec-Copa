import type { ItemLineaTiempo, JornadaCronograma } from "@/types";

/** Convierte las jornadas en una lista lineal: marcador de día + actividades alternando arriba/abajo. */
export function aplanarCronograma(jornadas: JornadaCronograma[]): ItemLineaTiempo[] {
	const ordenadas = [...jornadas].sort((a, b) => a.fecha.localeCompare(b.fecha));
	const items: ItemLineaTiempo[] = [];
	let alterna = 0;

	for (const j of ordenadas) {
		items.push({ tipo: "dia", id: `dia-${j.id}`, categoria: j.categoria, fecha: j.fecha, titulo: j.titulo, lugar: j.lugar });
		for (const a of j.actividades) {
			items.push({
				tipo: "actividad",
				id: `${j.id}-${a.id}`,
				categoria: j.categoria,
				fecha: j.fecha,
				hora: a.hora,
				titulo: a.titulo,
				descripcion: a.descripcion,
				destacado: a.destacado,
				posicion: alterna++ % 2 === 0 ? "arriba" : "abajo",
			});
		}
	}
	return items;
}
