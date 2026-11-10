"use client";

import { FileText, Trash, Upload } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from "react";
import { formatearTamanoArchivo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
	valor?: File;
	onChange: (archivo: File | undefined) => void;
	onBlur?: () => void;
	aceptar: string[];
	maxMb: number;
	error?: string;
	id?: string;
}

export function FileDropzone({ valor, onChange, onBlur, aceptar, maxMb, error, id }: FileDropzoneProps) {
	const idGenerado = useId();
	const inputId = id ?? idGenerado;
	const inputRef = useRef<HTMLInputElement>(null);
	const [arrastrando, setArrastrando] = useState(false);
	const preview = useMemo(
		() => (valor && valor.type.startsWith("image/") ? URL.createObjectURL(valor) : null),
		[valor],
	);

	useEffect(() => {
		if (!preview) return;
		return () => URL.revokeObjectURL(preview);
	}, [preview]);

	const elegir = (lista: FileList | null) => {
		const archivo = lista?.[0];
		if (archivo) onChange(archivo);
	};

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		setArrastrando(false);
		elegir(e.dataTransfer.files);
	};

	const quitar = () => {
		onChange(undefined);
		if (inputRef.current) inputRef.current.value = "";
	};

	return (
		<div className="flex flex-col gap-2">
			<input
				ref={inputRef}
				id={inputId}
				type="file"
				accept={aceptar.join(",")}
				className="sr-only"
				aria-invalid={!!error}
				aria-describedby={`${inputId}-msg`}
				onChange={(e) => elegir(e.target.files)}
				onBlur={onBlur}
			/>

			<AnimatePresence mode="wait" initial={false}>
				{valor ? (
					<motion.div
						key="archivo"
						initial={{ opacity: 0, scale: 0.97 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.97 }}
						className={cn("flex items-center gap-4 rounded-2xl border p-3", error ? "border-destructive" : "border-success/40 bg-success/[0.06]")}
					>
						<div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-2">
							{preview ? (
								// eslint-disable-next-line @next/next/no-img-element -- preview local (blob:)
								<img src={preview} alt="Vista previa del comprobante" className="size-full object-cover" />
							) : (
								<FileText className="size-8 text-brand" />
							)}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium">{valor.name}</p>
							<p className="text-xs text-muted-foreground">{formatearTamanoArchivo(valor.size)}</p>
							<button type="button" onClick={() => inputRef.current?.click()} className="mt-1 text-xs font-semibold text-brand hover:underline">
								Cambiar archivo
							</button>
						</div>
						<button
							type="button"
							onClick={quitar}
							aria-label="Quitar archivo"
							className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
						>
							<Trash className="size-4" />
						</button>
					</motion.div>
				) : (
					<motion.label
						key="vacio"
						htmlFor={inputId}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onDragOver={(e) => {
							e.preventDefault();
							setArrastrando(true);
						}}
						onDragLeave={() => setArrastrando(false)}
						onDrop={onDrop}
						className={cn(
							"flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all",
							arrastrando ? "scale-[1.01] border-brand-2 bg-brand-2/10" : error ? "border-destructive/60" : "border-foreground/15 hover:border-brand/50 hover:bg-brand/5",
						)}
					>
						<span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand/25 to-brand-2/20 text-brand-2">
							<Upload className="size-6" />
						</span>
						<span className="font-semibold">
							Arrastrá el comprobante o <span className="text-brand-2 underline-offset-4 hover:underline">elegilo</span>
						</span>
						<span className="text-xs text-muted-foreground">JPG, PNG, WEBP o PDF · hasta {maxMb} MB</span>
					</motion.label>
				)}
			</AnimatePresence>

			{error && (
				<p id={`${inputId}-msg`} role="alert" className="text-xs text-destructive">
					{error}
				</p>
			)}
		</div>
	);
}
