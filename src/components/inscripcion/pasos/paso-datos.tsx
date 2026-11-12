"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { InscripcionFormController } from "@/hooks/use-inscripcion-form";
import type { InscripcionFormInput } from "@/lib/validations/inscripcion.schema";

interface Campo {
	name: keyof InscripcionFormInput & ("nombre" | "apellido" | "dni" | "email" | "telefono" | "club");
	label: string;
	placeholder: string;
	type?: string;
	inputMode?: "numeric" | "email" | "tel" | "text";
	autoComplete?: string;
	opcional?: boolean;
	ancho?: boolean;
	hint?: string;
}

const CAMPOS: Campo[] = [
	{ name: "nombre", label: "Nombre", placeholder: "José", autoComplete: "given-name" },
	{ name: "apellido", label: "Apellido", placeholder: "Meolans", autoComplete: "family-name" },
	{ name: "dni", label: "DNI", placeholder: "30123456", inputMode: "numeric", hint: "Sin puntos" },
	{ name: "telefono", label: "Teléfono / WhatsApp", placeholder: "343 412 3456", type: "tel", inputMode: "tel", autoComplete: "tel" },
	{ name: "email", label: "Email", placeholder: "tu@email.com", type: "email", inputMode: "email", autoComplete: "email", ancho: true },
	{ name: "club", label: "Club / equipo", placeholder: "Atlético Echagüe Club", opcional: true, ancho: true, autoComplete: "organization" },
];

export function PasoDatos({ ctrl }: { ctrl: InscripcionFormController }) {
	const { register, formState } = ctrl.form;
	const emailDomain = ctrl.emailNormalizado.split("@").at(-1) ?? "";
	const usaMicrosoftEmail = /^(hotmail|outlook|live|msn)\.[a-z0-9.-]+$/.test(emailDomain);

	return (
		<div className="grid gap-5 sm:grid-cols-2">
			{CAMPOS.map((c) => {
				const error = formState.errors[c.name]?.message;
				return (
					<Field
						key={c.name}
						id={c.name}
						label={c.label}
						error={error}
						hint={
							c.name === "email" && usaMicrosoftEmail
								? "Hotmail/Outlook puede demorar o filtrar el código. Si no llega, revisá spam o probá con Gmail."
								: c.hint
						}
						opcional={c.opcional}
						className={c.ancho ? "sm:col-span-2" : undefined}
					>
						<Input
							id={c.name}
							type={c.type ?? "text"}
							inputMode={c.inputMode}
							autoComplete={c.autoComplete}
							placeholder={c.placeholder}
							aria-invalid={!!error}
							aria-describedby={`${c.name}-msg`}
							{...register(c.name)}
						/>
					</Field>
				);
			})}
		</div>
	);
}
