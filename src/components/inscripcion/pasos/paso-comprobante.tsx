"use client";

import { Controller } from "react-hook-form";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { configuracionPago } from "@/data/pago";
import type { InscripcionFormController } from "@/hooks/use-inscripcion-form";
import { FileDropzone } from "../file-dropzone";

export function PasoComprobante({ ctrl }: { ctrl: InscripcionFormController }) {
	const { control, register, formState } = ctrl.form;
	const errores = formState.errors;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-2">
				<span className="text-sm font-medium">Comprobante de pago</span>
				<Controller
					control={control}
					name="comprobante"
					render={({ field }) => (
						<FileDropzone
							id="comprobante"
							valor={field.value instanceof File ? field.value : undefined}
							onChange={(archivo) => field.onChange(archivo)}
							onBlur={field.onBlur}
							aceptar={configuracionPago.comprobanteFormatos}
							maxMb={configuracionPago.comprobanteMaxMb}
							error={errores.comprobante?.message}
						/>
					)}
				/>
			</div>

			<Field id="observaciones" label="Observaciones" opcional error={errores.observaciones?.message}>
				<Textarea
					id="observaciones"
					placeholder="Ej: pagué desde la cuenta de otra persona (Juan Pérez)"
					aria-describedby="observaciones-msg"
					{...register("observaciones")}
				/>
			</Field>

			<div>
				<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface-2/40 p-4 text-sm has-[:checked]:border-brand/50">
					<input
						type="checkbox"
						className="mt-0.5 size-4 shrink-0 accent-[var(--brand-2)]"
						aria-invalid={!!errores.aceptaTerminos}
						{...register("aceptaTerminos")}
					/>
					<span className="text-foreground/85">
						Confirmo que los datos son correctos y que el comprobante corresponde al pago de esta inscripción.
					</span>
				</label>
				{errores.aceptaTerminos && (
					<p role="alert" className="mt-2 text-xs text-destructive">
						{errores.aceptaTerminos.message}
					</p>
				)}
			</div>
		</div>
	);
}
