"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { obtenerTipoEntrada } from "@/data/entradas";
import { pasosFormulario } from "@/data/inscripcion";
import { metodosHabilitados } from "@/data/pago";
import { useCupo } from "@/hooks/use-cupo";
import { calcularPrecioUnitario, entradaCerrada } from "@/lib/precios";
import { confirmarCodigoEmail, enviarCodigoEmail, enviarInscripcion } from "@/lib/services/inscripcion.service";
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
	const [indicePasoGuardado, setIndicePaso] = useState(tipoInicial ? 1 : 0);
	const [resultado, setResultado] = useState<InscripcionRespuestaOk | null>(null);
	const [codigoEmail, setCodigoEmail] = useState("");
	const [emailDeCodigo, setEmailDeCodigo] = useState("");
	const [emailVerificado, setEmailVerificado] = useState("");
	const [tokenEmail, setTokenEmail] = useState("");
	const [errorVerificacion, setErrorVerificacion] = useState("");
	const [procesandoPaso, setProcesandoPaso] = useState(false);
	const procesandoPasoRef = useRef(false);
	const { cupo, cargando: cargandoCupo } = useCupo();

	const [tipoId, cantidadRaw] = useWatch({ control: form.control, name: ["tipoEntrada", "cantidad"] });
	const email = useWatch({ control: form.control, name: "email" });
	const tipoElegido = obtenerTipoEntrada(tipoId);
	// Si el cupo de la entrada elegida se completó, se descarta la elección y se vuelve al primer paso.
	const cupoAgotado = Boolean(tipoElegido && entradaCerrada(tipoElegido, cupo));
	const tipo = cupoAgotado ? undefined : tipoElegido;
	const indicePaso = tipo ? indicePasoGuardado : 0;
	const cantidad = Number.isFinite(cantidadRaw) && cantidadRaw > 0 ? cantidadRaw : 1;
	const emailNormalizado = email.trim().toLowerCase();

	// Las entradas de pileta son individuales.
	useEffect(() => {
		if (tipo && cantidad > tipo.maxCantidad) form.setValue("cantidad", tipo.maxCantidad);
	}, [tipo, cantidad, form]);

	const precioUnitario = tipo ? calcularPrecioUnitario(tipo) : 0;
	const total = precioUnitario * cantidad;

	const paso = pasosFormulario[indicePaso];
	const esUltimoPaso = indicePaso === pasosFormulario.length - 1;

	const siguiente = useCallback(async () => {
		if (procesandoPasoRef.current) return false;
		procesandoPasoRef.current = true;
		setProcesandoPaso(true);
		setErrorVerificacion("");
		try {
			const ok = await form.trigger([...camposPorPaso[paso.id]], { shouldFocus: true });
			if (!ok) return false;

			if (paso.id === "datos" && emailDeCodigo !== emailNormalizado) {
				setEmailVerificado("");
				setTokenEmail("");
				const respuesta = await enviarCodigoEmail(emailNormalizado);
				if (!respuesta.ok) throw new Error(respuesta.error ?? "No pudimos enviar el código.");
				setEmailDeCodigo(emailNormalizado);
				setCodigoEmail("");
			}

			if (paso.id === "verificacion") {
				const respuesta = await confirmarCodigoEmail(emailNormalizado, codigoEmail);
				if (!respuesta.ok || !respuesta.token) {
					throw new Error(respuesta.error ?? "No pudimos verificar el email.");
				}
				setEmailVerificado(emailNormalizado);
				setTokenEmail(respuesta.token);
			}

			setIndicePaso((i) => Math.min(i + 1, pasosFormulario.length - 1));
			return true;
		} catch (error) {
			const mensaje = error instanceof Error ? error.message : "No pudimos verificar el email.";
			setErrorVerificacion(mensaje);
			toast.error(mensaje);
			return false;
		} finally {
			procesandoPasoRef.current = false;
			setProcesandoPaso(false);
		}
	}, [codigoEmail, emailDeCodigo, emailNormalizado, form, paso.id]);

	const anterior = useCallback(() => setIndicePaso((i) => Math.max(i - 1, 0)), []);

	const irAPaso = useCallback((destino: number) => {
		if (destino <= indicePaso) setIndicePaso(destino);
	}, [indicePaso]);

	const reenviarCodigoEmail = useCallback(async () => {
		setErrorVerificacion("");
		const respuesta = await enviarCodigoEmail(emailNormalizado);
		if (!respuesta.ok) {
			const mensaje = respuesta.error ?? "No pudimos enviar el código.";
			setErrorVerificacion(mensaje);
			toast.error(mensaje);
			return;
		}
		setEmailDeCodigo(emailNormalizado);
		setCodigoEmail("");
		toast.success("Enviamos un nuevo código a tu email.");
	}, [emailNormalizado]);

	const enviar = form.handleSubmit(async (valores) => {
		if (!tokenEmail || emailNormalizado !== emailVerificado) {
			setIndicePaso(pasosFormulario.findIndex((p) => p.id === "verificacion"));
			toast.error("Verificá tu email antes de enviar la inscripción.");
			return;
		}
		const respuesta = await enviarInscripcion(valores, tokenEmail);
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
		setCodigoEmail("");
		setEmailDeCodigo("");
		setEmailVerificado("");
		setTokenEmail("");
		setErrorVerificacion("");
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
		codigoEmail,
		setCodigoEmail,
		emailNormalizado,
		emailDeCodigo,
		errorVerificacion,
		reenviarCodigoEmail,
		procesandoPaso,
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
