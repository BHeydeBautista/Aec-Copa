"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { obtenerTipoEntrada } from "@/data/entradas";
import { pasosFormulario } from "@/data/inscripcion";
import { metodosHabilitados } from "@/data/pago";
import { useCupo } from "@/hooks/use-cupo";
import { calcularPrecioUnitario } from "@/lib/precios";
import { enviarInscripcion } from "@/lib/services/inscripcion.service";
import {
	camposPorPaso,
	inscripcionSchema,
	type InscripcionFormInput,
	type InscripcionFormValues,
} from "@/lib/validations/inscripcion.schema";
import type { InscripcionRespuestaOk, PasoFormulario, TipoEntradaId } from "@/types";

type IdPaso = PasoFormulario["id"];

/**
 * Toda la lógica del formulario de inscripción: pasos, validación por paso,
 * precio en vivo (con cupo) y envío del comprobante.
 */
export function useInscripcionForm(tipoInicial?: TipoEntradaId) {
	const form = useForm<InscripcionFormInput, unknown, InscripcionFormValues>({
		resolver: zodResolver(inscripcionSchema),
		mode: "onTouched",
		defaultValues: {
			tipoEntrada: tipoInicial,
			cantidad: 1,
			metodoPago: metodosHabilitados[0]?.id ?? "transferencia",
			nombre: "",
			apellido: "",
			dni: "",
			email: "",
			telefono: "",
			club: "",
			numeroSocio: "",
			observaciones: "",
		},
	});

	// Si llega con la entrada preelegida desde una card, arranca en "Tus datos".
	const [indicePaso, setIndicePaso] = useState(tipoInicial ? 1 : 0);
	const [resultado, setResultado] = useState<InscripcionRespuestaOk | null>(null);
	const { cupo, cargando: cargandoCupo } = useCupo();

	const [tipoId, cantidadRaw] = useWatch({ control: form.control, name: ["tipoEntrada", "cantidad"] });
	const tipo = obtenerTipoEntrada(tipoId);
	const cantidad = Number.isFinite(cantidadRaw) && cantidadRaw > 0 ? cantidadRaw : 1;

	// Las entradas de pileta son individuales.
	useEffect(() => {
		if (tipo && cantidad > tipo.maxCantidad) form.setValue("cantidad", tipo.maxCantidad);
	}, [tipo, cantidad, form]);

	const precioUnitario = tipo ? calcularPrecioUnitario(tipo, cupo) : 0;
	const total = precioUnitario * cantidad;
	const cupoAgotado = Boolean(tipo?.cupo && cupo?.agotado);

	const paso = pasosFormulario[indicePaso];
	const esUltimoPaso = indicePaso === pasosFormulario.length - 1;

	const siguiente = useCallback(async () => {
		const ok = await form.trigger([...camposPorPaso[paso.id]], { shouldFocus: true });
		if (ok) setIndicePaso((i) => Math.min(i + 1, pasosFormulario.length - 1));
		return ok;
	}, [form, paso.id]);

	const anterior = useCallback(() => setIndicePaso((i) => Math.max(i - 1, 0)), []);

	/** Solo permite saltar a pasos anteriores o al siguiente si el actual es válido. */
	const irAPaso = useCallback(
		async (destino: number) => {
			if (destino <= indicePaso) return setIndicePaso(destino);
			for (let i = indicePaso; i < destino; i++) {
				const ok = await form.trigger([...camposPorPaso[pasosFormulario[i].id]], { shouldFocus: true });
				if (!ok) return setIndicePaso(i);
			}
			setIndicePaso(destino);
		},
		[form, indicePaso],
	);

	const enviar = form.handleSubmit(async (valores) => {
		const respuesta = await enviarInscripcion(valores);
		if (respuesta.ok) {
			setResultado(respuesta);
			toast.success("¡Inscripción enviada!", { description: `Tu código es ${respuesta.id}` });
			window.scrollTo({ top: 0, behavior: "smooth" });
			return;
		}

		toast.error(respuesta.error);
		if (respuesta.campos) {
			let primerPaso: number | null = null;
			for (const [campo, mensaje] of Object.entries(respuesta.campos)) {
				form.setError(campo as keyof InscripcionFormInput, { message: mensaje });
				const idx = pasosFormulario.findIndex((p) =>
					(camposPorPaso[p.id] as readonly string[]).includes(campo),
				);
				if (idx >= 0) primerPaso = primerPaso === null ? idx : Math.min(primerPaso, idx);
			}
			if (primerPaso !== null) setIndicePaso(primerPaso);
		}
	});

	const reiniciar = useCallback(() => {
		form.reset();
		setResultado(null);
		setIndicePaso(0);
	}, [form]);

	const estadoPasos = useMemo(
		() =>
			pasosFormulario.map((p, i) => ({
				...p,
				estado: (i < indicePaso ? "completo" : i === indicePaso ? "actual" : "pendiente") as
					| "completo"
					| "actual"
					| "pendiente",
			})),
		[indicePaso],
	);

	return {
		form,
		paso,
		pasoId: paso.id as IdPaso,
		indicePaso,
		estadoPasos,
		esUltimoPaso,
		siguiente,
		anterior,
		irAPaso,
		enviar,
		enviando: form.formState.isSubmitting,
		resultado,
		reiniciar,
		tipo,
		cantidad,
		precioUnitario,
		total,
		cupo,
		cargandoCupo,
		cupoAgotado,
	};
}

export type InscripcionFormController = ReturnType<typeof useInscripcionForm>;
