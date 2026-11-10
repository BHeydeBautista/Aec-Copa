"use client";

import { ExternalLink, Info, Landmark, Wallet } from "lucide-react";
import { configuracionPago, metodosHabilitados, pagoConfigurado } from "@/data/pago";
import type { InscripcionFormController } from "@/hooks/use-inscripcion-form";
import { formatearPrecio } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CopyField } from "../copy-field";

export function PasoPago({ ctrl }: { ctrl: InscripcionFormController }) {
	const { form, total } = ctrl;
	const metodo = form.watch("metodoPago");
	const { transferencia, linkMercadoPago } = configuracionPago;

	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-2xl border border-brand-2/30 bg-gradient-to-br from-brand-2/10 to-transparent p-5 text-center">
				<p className="text-sm text-muted-foreground">Total a pagar</p>
				<p className="font-display text-4xl font-extrabold tabular-nums">{formatearPrecio(total)}</p>
			</div>

			{metodosHabilitados.length > 1 && (
				<fieldset>
					<legend className="mb-3 text-sm font-medium">¿Cómo vas a pagar?</legend>
					<div className="grid gap-3 sm:grid-cols-2">
						{metodosHabilitados.map((m) => (
							<label
								key={m.id}
								className={cn(
									"flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all",
									metodo === m.id ? "border-brand-2 bg-brand-2/[0.07]" : "border-border hover:border-brand/40",
								)}
							>
								<input type="radio" value={m.id} className="sr-only" {...form.register("metodoPago")} />
								{m.id === "transferencia" ? <Landmark className="mt-0.5 size-5 text-brand" /> : <Wallet className="mt-0.5 size-5 text-brand" />}
								<span>
									<span className="block font-semibold">{m.nombre}</span>
									<span className="text-sm text-muted-foreground">{m.descripcion}</span>
								</span>
							</label>
						))}
					</div>
				</fieldset>
			)}

			{!pagoConfigurado && (
				<p className="flex gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
					<Info className="mt-0.5 size-4 shrink-0 text-destructive" />
					Datos de pago pendientes de carga (src/data/pago.ts). No transfieras hasta que figuren los datos reales.
				</p>
			)}

			{metodo === "transferencia" && (
				<div className="flex flex-col gap-2.5">
					<CopyField label="Alias" valor={transferencia.alias} destacado />
					<CopyField label="CBU / CVU" valor={transferencia.cbu} />
					<div className="grid gap-2.5 sm:grid-cols-2">
						<CopyField label="Titular" valor={transferencia.titular} />
						<CopyField label="Banco" valor={transferencia.banco} />
					</div>
					{transferencia.cuenta && <CopyField label="Caja de ahorro en pesos" valor={transferencia.cuenta} />}
					{transferencia.cuil && <CopyField label="CUIL" valor={transferencia.cuil} />}
				</div>
			)}

			{metodo === "mercadopago" && linkMercadoPago && (
				<a
					href={linkMercadoPago}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#009ee3] px-6 py-4 font-semibold text-white hover:brightness-110"
				>
					Pagar con Mercado Pago <ExternalLink className="size-4" />
				</a>
			)}

			<p className="flex gap-2 text-sm text-muted-foreground">
				<Info className="mt-0.5 size-4 shrink-0 text-brand" />
				Hacé el pago ahora y guardá el comprobante (captura o PDF). En el siguiente paso lo subís.
			</p>
		</div>
	);
}
