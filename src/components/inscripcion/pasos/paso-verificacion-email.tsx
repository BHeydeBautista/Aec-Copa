"use client";

import { MailCheck } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { InscripcionFormController } from "@/hooks/use-inscripcion-form";

export function PasoVerificacionEmail({ ctrl }: { ctrl: InscripcionFormController }) {
	const { codigoEmail, setCodigoEmail, emailNormalizado, errorVerificacion, reenviarCodigoEmail } = ctrl;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start gap-4 border-b border-border/80 pb-5">
				<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
					<MailCheck className="size-5" aria-hidden />
				</span>
				<div>
					<p className="font-medium">Revisá tu correo</p>
					<p className="mt-1 break-all text-sm text-muted-foreground">{emailNormalizado}</p>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">
						Te enviamos un código de 6 dígitos. Dura 10 minutos; si no aparece, revisá la carpeta de spam.
					</p>
				</div>
			</div>

			<Field id="codigoEmail" label="Código de verificación" error={errorVerificacion} hint="Ingresá los 6 números del mensaje.">
				<Input
					id="codigoEmail"
					type="text"
					inputMode="numeric"
					autoComplete="one-time-code"
					maxLength={6}
					placeholder="000000"
					className="max-w-52 font-mono text-lg tracking-[0.3em] tabular-nums"
					value={codigoEmail}
					onChange={(event) => setCodigoEmail(event.target.value.replace(/\D/g, "").slice(0, 6))}
					aria-invalid={!!errorVerificacion}
					aria-describedby="codigoEmail-msg"
				/>
			</Field>

			<div aria-live="polite" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
				<span>¿No llegó?</span>
				<button
					type="button"
					onClick={() => void reenviarCodigoEmail()}
					className="min-h-11 font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
				>
					Enviar otro código
				</button>
			</div>
		</div>
	);
}
