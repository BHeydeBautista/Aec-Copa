import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Helper estándar de shadcn: necesario para los componentes de 21st.dev. */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
