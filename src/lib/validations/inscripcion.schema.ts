import { z } from "zod";
import { configuracionPago } from "@/data/pago";
import { obtenerTipoEntrada } from "@/data/entradas";
import { TIPOS_ENTRADA_IDS } from "@/types/entrada.types";

const MAX_BYTES = configuracionPago.comprobanteMaxMb * 1024 * 1024;

const textoOpcional = (max: number) =>
	z
		.string()
		.trim()
		.max(max, `Máximo ${max} caracteres`)
		.optional()
		.transform((v) => (v ? v : undefined));

export const comprobanteSchema = z
	.instanceof(File, { message: "Subí el comprobante de pago" })
	.refine((f) => f.size > 0, "El archivo está vacío")
	.refine((f) => f.size <= MAX_BYTES, `El archivo supera los ${configuracionPago.comprobanteMaxMb} MB`)
	.refine(
		(f) => configuracionPago.comprobanteFormatos.includes(f.type),
		"Formato no válido: subí una imagen (JPG, PNG, WEBP) o un PDF",
	);

export const inscripcionSchema = z
	.object({
		// Paso: entrada
		tipoEntrada: z.enum(TIPOS_ENTRADA_IDS, { message: "Elegí un tipo de entrada" }),
		cantidad: z
			.number({ message: "Ingresá una cantidad" })
			.int()
			.min(1, "Mínimo 1")
			.max(10, "Máximo 10 por inscripción"),
		numeroSocio: textoOpcional(30),

		// Paso: datos
		nombre: z.string().trim().min(2, "Ingresá tu nombre").max(60),
		apellido: z.string().trim().min(2, "Ingresá tu apellido").max(60),
		dni: z
			.string()
			.trim()
			.transform((v) => v.replace(/\./g, ""))
			.pipe(z.string().regex(/^\d{7,8}$/, "DNI de 7 u 8 números, sin puntos")),
		email: z.string().trim().toLowerCase().pipe(z.email("Email inválido")),
		telefono: z
			.string()
			.trim()
			.regex(/^[\d\s+()-]{8,20}$/, "Teléfono inválido (ej: 343 412 3456)"),
		club: textoOpcional(80),

		// Paso: pago
		metodoPago: z.enum(["transferencia", "mercadopago"], { message: "Elegí cómo pagaste" }),

		// Paso: comprobante
		comprobante: comprobanteSchema,
		observaciones: textoOpcional(300),
		aceptaTerminos: z.literal(true, { message: "Tenés que confirmar que los datos son correctos" }),
	})
	.superRefine((data, ctx) => {
		const tipo = obtenerTipoEntrada(data.tipoEntrada);
		if (!tipo) return;
		if (data.cantidad > tipo.maxCantidad) {
			ctx.addIssue({
				code: "custom",
				path: ["cantidad"],
				message:
					tipo.maxCantidad === 1
						? "Las entradas de pileta son individuales: una inscripción por nadador"
						: `Máximo ${tipo.maxCantidad} entradas`,
			});
		}
		if (tipo.requiereAcreditacion && !data.numeroSocio && !data.club) {
			ctx.addIssue({
				code: "custom",
				path: ["numeroSocio"],
				message: "Ingresá tu número de socio AEC o el club con el que nadás la Copa",
			});
		}
	});

/** Valores tal cual los maneja el formulario (antes de transformar). */
export type InscripcionFormInput = z.input<typeof inscripcionSchema>;
/** Valores ya validados y normalizados. */
export type InscripcionFormValues = z.output<typeof inscripcionSchema>;

/** Campos que se validan al avanzar cada paso del formulario. */
export const camposPorPaso = {
	entrada: ["tipoEntrada", "cantidad", "numeroSocio"],
	datos: ["nombre", "apellido", "dni", "email", "telefono", "club"],
	pago: ["metodoPago"],
	comprobante: ["comprobante", "observaciones", "aceptaTerminos"],
} as const satisfies Record<string, readonly (keyof InscripcionFormInput)[]>;
