"use client";

import { Minus, Plus } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { tiposEntrada } from "@/data/entradas";
import type { InscripcionFormController } from "@/hooks/use-inscripcion-form";
import { formatearPrecio } from "@/lib/format";
import { calcularPrecioUnitario } from "@/lib/precios";
import { cn } from "@/lib/utils";

export function PasoEntrada({ ctrl }: { ctrl: InscripcionFormController }) {
	const { form, tipo, cantidad, cupo } = ctrl;
	const { register, formState, setValue } = form;
	const errores = formState.errors;

	return (
		<div className="flex flex-col gap-6">
			<fieldset>
				<legend className="mb-3 text-sm font-medium">Tipo de entrada</legend>
				<div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
					{tiposEntrada.map((t) => {
						const precio = calcularPrecioUnitario(t, t.cupo ? cupo : null);
						const elegido = tipo?.id === t.id;
						return (
							<label
								key={t.id}
								className={cn(
									"relative flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition-all",
									elegido
										? "border-brand-2 bg-brand-2/[0.07] shadow-[0_0_0_1px_var(--brand-2)]"
										: "border-border bg-surface-2/40 hover:border-brand/40",
								)}
							>
								<input type="radio" value={t.id} className="sr-only" {...register("tipoEntrada")} />
								<span className="flex items-center justify-between gap-2">
									<span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{t.zona}</span>
									<span
										className={cn(
											"size-4 rounded-full border-2 transition-all",
											elegido ? "border-brand-2 bg-brand-2 shadow-[inset_0_0_0_3px_var(--background)]" : "border-foreground/25",
										)}
									/>
								</span>
								<span className="font-semibold">{t.nombre}</span>
								<span className="font-display text-xl font-bold tabular-nums">{formatearPrecio(precio)}</span>
								{t.cupo && cupo?.tipo === t.id && (
									<span className="text-xs text-muted-foreground">
										{cupo.agotado ? "Cupo completo: precio general" : `Quedan ${cupo.disponibles} lugares`}
									</span>
								)}
							</label>
						);
					})}
				</div>
				{errores.tipoEntrada && <p role="alert" className="mt-2 text-xs text-destructive">{errores.tipoEntrada.message}</p>}
			</fieldset>

			{tipo && tipo.maxCantidad > 1 && (
				<Field id="cantidad" label="Cantidad de entradas" error={errores.cantidad?.message} hint={`Hasta ${tipo.maxCantidad} por inscripción`}>
					<div className="flex items-center gap-2">
						<button
							type="button"
							aria-label="Restar una entrada"
							onClick={() => setValue("cantidad", Math.max(1, cantidad - 1), { shouldValidate: true })}
							className="grid size-11 place-items-center rounded-xl border border-input bg-surface-2/60 hover:border-brand/40"
						>
							<Minus className="size-4" />
						</button>
						<Input
							id="cantidad"
							type="number"
							inputMode="numeric"
							min={1}
							max={tipo.maxCantidad}
							className="w-20 text-center tabular-nums"
							aria-invalid={!!errores.cantidad}
							aria-describedby="cantidad-msg"
							{...register("cantidad", { valueAsNumber: true })}
						/>
						<button
							type="button"
							aria-label="Sumar una entrada"
							onClick={() => setValue("cantidad", Math.min(tipo.maxCantidad, cantidad + 1), { shouldValidate: true })}
							className="grid size-11 place-items-center rounded-xl border border-input bg-surface-2/60 hover:border-brand/40"
						>
							<Plus className="size-4" />
						</button>
					</div>
				</Field>
			)}

			{tipo?.requiereAcreditacion && (
				<Field
					id="numeroSocio"
					label="N° de socio AEC"
					error={errores.numeroSocio?.message}
					hint="Si nadás la Copa Challenger y no sos socio, dejalo vacío y completá tu club en el próximo paso."
				>
					<Input
						id="numeroSocio"
						placeholder="Ej: 12345"
						aria-invalid={!!errores.numeroSocio}
						aria-describedby="numeroSocio-msg"
						{...register("numeroSocio")}
					/>
				</Field>
			)}

			{tipo?.zona === "pileta" && (
				<p className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-foreground/80">
					Las entradas de pileta son individuales: completá una inscripción por nadador.
				</p>
			)}
		</div>
	);
}
