import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LogoInstitucion } from "@/types";

interface LogoImageProps {
	logo: LogoInstitucion;
	className?: string;
	sizes?: string;
	priority?: boolean;
}

/** Logo contenido en una caja (el padre define el tamaño). Los SVG se sirven sin optimizar. */
export function LogoImage({ logo, className, sizes = "64px", priority }: LogoImageProps) {
	return (
		// El contorno blanco suave hace visibles los bordes negros del logo AEC sobre fondo oscuro.
		<span
			className={cn(
				"relative block [filter:drop-shadow(0_0_1px_rgb(255_255_255/0.75))_drop-shadow(0_0_10px_rgb(143_169_216/0.3))]",
				className,
			)}
		>
			<Image
				src={logo.src}
				alt={logo.nombre}
				fill
				sizes={sizes}
				priority={priority}
				unoptimized={logo.src.endsWith(".svg")}
				className="object-contain"
			/>
		</span>
	);
}
