import { cn } from "@/lib/utils";

interface TituloAnimadoProps {
	lineas: string[];
	as?: "h1" | "h2";
	className?: string;
	/** Clase extra por letra (para seleccionarlas con GSAP). */
	claseLetra: string;
	/** Clases por línea (ej: color distinto para la segunda). */
	clasesLinea?: string[];
}

/**
 * Título partido en letras (cada una en un span) para animarlas con GSAP.
 * Cada línea tiene overflow oculto: las letras "suben" desde abajo de la línea.
 * Lectores de pantalla leen el texto completo vía aria-label.
 */
export function TituloAnimado({ lineas, as: Tag = "h1", className, claseLetra, clasesLinea }: TituloAnimadoProps) {
	return (
		<Tag aria-label={lineas.join(" ")} className={className}>
			{lineas.map((linea, i) => (
				<span key={i} aria-hidden className={cn("block overflow-hidden whitespace-nowrap pb-[0.06em]", clasesLinea?.[i])}>
					{[...linea].map((letra, j) => (
						<span key={j} className={cn("inline-block will-change-transform", claseLetra)}>
							{letra === " " ? " " : letra}
						</span>
					))}
				</span>
			))}
		</Tag>
	);
}
