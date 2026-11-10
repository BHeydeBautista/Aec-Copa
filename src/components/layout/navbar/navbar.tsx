"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LogoImage } from "@/components/ui/logo-image";
import { evento } from "@/data/evento";
import { logosPrincipales, navegacion } from "@/data/sitio";
import { useActiveSection } from "@/hooks/use-active-section";
import { useScrolled } from "@/hooks/use-scrolled";
import { cn } from "@/lib/utils";

const idsSecciones = navegacion.flatMap((l) => (l.seccionId ? [l.seccionId] : []));

export default function Navbar() {
	const pathname = usePathname();
	const scrolled = useScrolled();
	const seccionActiva = useActiveSection(idsSecciones);
	const [abierto, setAbierto] = useState(false);
	const enHome = pathname === "/";

	useEffect(() => {
		document.body.style.overflow = abierto ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [abierto]);

	return (
		<header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
			<nav
				aria-label="Principal"
				className={cn(
					"mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-full border px-3 pl-4 transition-all duration-500 sm:px-4",
					scrolled || !enHome || abierto
						? "border-border bg-background/70 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl"
						: "border-transparent bg-transparent",
				)}
			>
				<Link href="/" className="flex items-center gap-2.5" onClick={() => setAbierto(false)}>
					{logosPrincipales.map((logo, i) => (
						<span key={logo.id} className="flex items-center gap-2.5">
							{i > 0 && <span className="h-6 w-px bg-foreground/15" aria-hidden />}
							<LogoImage logo={logo} className="size-9" priority />
						</span>
					))}
					<span className="ml-1 hidden leading-tight sm:block">
						<span className="block font-display text-sm font-bold tracking-tight">{evento.nombre}</span>
						<span className="block text-[11px] text-muted-foreground">{evento.organizador}</span>
					</span>
				</Link>

				<ul className="hidden items-center gap-1 rounded-full border border-border bg-surface/50 p-1 md:flex">
					{navegacion.map((link) => {
						const activo = enHome && seccionActiva === link.seccionId;
						return (
							<li key={link.href} className="relative">
								<Link
									href={link.href}
									className={cn(
										"relative z-10 block rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
										activo ? "text-foreground" : "text-muted-foreground hover:text-foreground",
									)}
								>
									{link.label}
								</Link>
								{activo && (
									<motion.span
										layoutId="nav-activo"
										className="absolute inset-0 rounded-full bg-brand/15"
										transition={{ type: "spring", stiffness: 380, damping: 32 }}
									>
										<span className="absolute -top-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-brand shadow-[0_0_12px_2px_var(--brand)]" />
									</motion.span>
								)}
							</li>
						);
					})}
				</ul>

				<div className="flex items-center gap-2">
					<Link href="/inscripcion" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
						Inscribirme
					</Link>
					<button
						type="button"
						className="grid size-10 place-items-center rounded-full border border-border bg-surface/60 md:hidden"
						onClick={() => setAbierto((v) => !v)}
						aria-expanded={abierto}
						aria-controls="menu-movil"
						aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
					>
						{abierto ? <X className="size-5" /> : <Menu className="size-5" />}
					</button>
				</div>
			</nav>

			<AnimatePresence>
				{abierto && (
					<motion.div
						id="menu-movil"
						initial={{ opacity: 0, y: -12 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -12 }}
						transition={{ duration: 0.2 }}
						className="mx-auto mt-2 max-w-6xl rounded-3xl border border-border bg-background/95 p-3 backdrop-blur-xl md:hidden"
					>
						<ul className="flex flex-col">
							{navegacion.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										onClick={() => setAbierto(false)}
										className="block rounded-2xl px-4 py-3 text-base font-medium text-foreground/90 hover:bg-foreground/5"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
						<Link
							href="/inscripcion"
							onClick={() => setAbierto(false)}
							className={cn(buttonVariants({ size: "lg" }), "mt-2 w-full")}
						>
							Inscribirme
						</Link>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}
