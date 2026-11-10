"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { useInView } from "motion/react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LogoImage } from "@/components/ui/logo-image";
import { evento } from "@/data/evento";
import { slidesHero } from "@/data/hero";
import { logosPrincipales } from "@/data/sitio";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatearFechaLarga } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { Countdown } from "./countdown";
import { TituloAnimado } from "./titulo-animado";
import VueloDron from "./vuelo/vuelo-dron";

const TOTAL_SECCIONES = slidesHero.length;

/**
 * Hero con vuelo de dron sobre el natatorio. La sección mide ~2.4 pantallas: el contenido queda fijo (sticky)
 * y el scroll avanza el vuelo cuadro a cuadro y cambia de "Copa Challenger" a "Clínica Meolans".
 */
export default function Hero() {
	const seccionRef = useRef<HTMLElement>(null);
	const stickyRef = useRef<HTMLDivElement>(null);
	const barraRef = useRef<HTMLDivElement>(null);
	const estadoRef = useRef({ progreso: 0 });
	const visible = useInView(seccionRef);
	const reducirMovimiento = useReducedMotion();
	const [escenaLista, setEscenaLista] = useState(false);
	const [seccion, setSeccion] = useState(0);
	const [copa, clinica] = slidesHero;
	const alListo = useCallback(() => setEscenaLista(true), []);

	// Entrada inicial (estilo "horizon"): logos, letras del título subiendo y líneas del subtítulo.
	useGSAP(
		() => {
			if (reducirMovimiento) return;
			gsap
				.timeline({ defaults: { ease: "power3.out" } })
				// fromTo con valores finales explícitos: los botones tienen transiciones CSS y un from() leería mal el estado final.
				.fromTo(".intro-logos", { y: -24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9 })
				.fromTo(".letra-copa", { yPercent: 115 }, { yPercent: 0, duration: 1.3, stagger: 0.035, ease: "power4.out" }, "-=0.5")
				.fromTo(".intro-linea", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.15 }, "-=0.9")
				.fromTo(".intro-scroll", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8 }, "-=0.6");
		},
		{ scope: stickyRef, dependencies: [reducirMovimiento] },
	);

	// Scroll: sale el slide de la Copa, entra el de la Clínica, la cámara avanza.
	useGSAP(
		() => {
			gsap.set(".slide-clinica", { autoAlpha: 0 });
			gsap.set(".letra-clinica", { yPercent: 115 });

			gsap
				.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						trigger: seccionRef.current,
						start: "top top",
						end: "bottom bottom",
						scrub: 0.6,
						onUpdate: (self) => {
							estadoRef.current.progreso = self.progress;
							if (barraRef.current) barraRef.current.style.transform = `scaleX(${self.progress})`;
							setSeccion(self.progress >= 0.45 ? 1 : 0);
						},
					},
				})
				.to(".slide-copa", { yPercent: -14, autoAlpha: 0, duration: 0.2 }, 0.22)
				.set(".slide-clinica", { autoAlpha: 1 }, 0.42)
				.to(".letra-clinica", { yPercent: 0, stagger: 0.012, duration: 0.18, ease: "power3.out" }, 0.42)
				.fromTo(
					".clinica-extra",
					{ y: 28, autoAlpha: 0 },
					{ y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.14, ease: "power2.out", immediateRender: true },
					0.55,
				)
				.to({}, { duration: 0.2 });
		},
		{ scope: stickyRef },
	);

	return (
		<section ref={seccionRef} id="inicio" className="relative h-[240svh]">
			<div ref={stickyRef} className="sticky top-0 isolate h-svh overflow-hidden">
				{/* Vuelo de dron (con fondo de respaldo mientras carga el primer cuadro) */}
				<div
					aria-hidden
					className="absolute inset-0 -z-20"
					style={{ background: "radial-gradient(90% 60% at 50% 85%, #082a4a 0%, #060a14 70%)" }}
				/>
				<div
					aria-hidden
					className={cn("absolute inset-0 -z-20 transition-opacity duration-1000", escenaLista ? "opacity-100" : "opacity-0")}
				>
					<VueloDron progresoRef={estadoRef} activo={visible} reducirMovimiento={reducirMovimiento} onListo={alListo} />
				</div>

				{/* Viñeta para legibilidad */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 -z-10"
					style={{
						background:
							"radial-gradient(75% 45% at 50% 48%, rgb(6 10 20 / 0.55) 0%, rgb(6 10 20 / 0.28) 100%), linear-gradient(180deg, rgb(6 10 20 / 0.75) 0%, transparent 22%, transparent 72%, rgb(6 10 20 / 0.95) 100%)",
					}}
				/>

				{/* Slide 1: Copa Challenger */}
				<div className="slide-copa pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 pt-20 pb-16 text-center bajo:pt-16">
					<div className="intro-logos pointer-events-auto flex items-center gap-4 rounded-full border border-foreground/10 bg-background/40 px-5 py-2.5 backdrop-blur-md bajo:hidden">
						{logosPrincipales.map((logo, i) => (
							<span key={logo.id} className="flex items-center gap-4">
								{i > 0 && <span className="h-8 w-px bg-foreground/20" aria-hidden />}
								<LogoImage logo={logo} className="size-11 sm:size-14" sizes="56px" priority />
							</span>
						))}
					</div>

					<p className="intro-linea mt-7 text-[11px] font-semibold tracking-[0.28em] text-brand uppercase sm:text-sm bajo:mt-0">
						{copa.eyebrow}
					</p>

					<TituloAnimado
						lineas={copa.titulo}
						claseLetra="letra-copa"
						clasesLinea={["text-foreground", "text-brand-2"]}
						className="titulo-hero mt-3 font-display leading-[0.88] font-extrabold tracking-tight uppercase [filter:drop-shadow(0_0_28px_rgb(56_212_245/0.35))]"
					/>

					<div className="mt-6 max-w-md space-y-1 text-[15px] leading-6 text-foreground/90 [text-shadow:0_1px_10px_rgb(0_0_0/0.7)] sm:max-w-xl sm:text-lg bajo:mt-3 bajo:text-base">
						{copa.lineas.map((l) => (
							<p key={l} className="intro-linea">
								{l}
							</p>
						))}
					</div>

					<Link
						href="/#precios"
						className={cn(buttonVariants({ variant: "water", size: "lg" }), "intro-linea pointer-events-auto mt-8 bajo:mt-4")}
					>
						Ver entradas
					</Link>
				</div>

				{/* Slide 2: Clínica Meolans */}
				<div className="slide-clinica pointer-events-none invisible absolute inset-0 flex flex-col items-center justify-center px-5 pt-20 pb-16 text-center bajo:pt-16">
					<p className="clinica-extra text-[11px] font-semibold tracking-[0.28em] text-brand-2 uppercase sm:text-sm">
						{clinica.eyebrow}
					</p>

					<TituloAnimado
						as="h2"
						lineas={clinica.titulo}
						claseLetra="letra-clinica"
						clasesLinea={["text-foreground", "text-brand"]}
						className="titulo-hero mt-3 font-display leading-[0.88] font-extrabold tracking-tight uppercase [filter:drop-shadow(0_0_28px_rgb(143_169_216/0.35))]"
					/>

					<p className="clinica-extra mt-5 max-w-md text-[15px] leading-6 text-foreground/90 [text-shadow:0_1px_10px_rgb(0_0_0/0.7)] sm:text-lg bajo:mt-2 bajo:text-base">
						{clinica.lineas.join(" ")}
					</p>

					<ul className="clinica-extra mt-5 flex flex-wrap justify-center gap-2 text-xs sm:text-sm bajo:mt-3">
						<li className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/50 px-3 py-1.5 backdrop-blur-md">
							<CalendarDays className="size-3.5 text-brand-2" /> {formatearFechaLarga(evento.fechaClinica)}
						</li>
						<li className="inline-flex items-center gap-1.5 rounded-full border border-foreground/10 bg-background/50 px-3 py-1.5 backdrop-blur-md">
							<MapPin className="size-3.5 text-brand-2" /> {evento.sede.ciudad}
						</li>
					</ul>

					<div className="clinica-extra mt-6 bajo:mt-3">
						<Countdown fechaIso={evento.fechaClinica} etiqueta="La clínica" />
					</div>

					<div className="clinica-extra pointer-events-auto mt-7 flex w-full max-w-sm gap-3 bajo:mt-4">
						<Link href="/inscripcion" className={cn(buttonVariants({ variant: "water" }), "flex-1")}>
							Inscribirme
						</Link>
						<Link href="/#cronograma" className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>
							Cronograma
						</Link>
					</div>
				</div>

				{/* Indicador de scroll */}
				<div className="intro-scroll pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-center gap-4 px-5 text-[10px] font-semibold tracking-[0.3em] text-foreground/60 uppercase sm:bottom-6 bajo:bottom-3">
					<span>Deslizá</span>
					<div className="h-px w-24 overflow-hidden rounded-full bg-foreground/15 sm:w-40">
						<div ref={barraRef} className="h-full origin-left scale-x-0 bg-gradient-to-r from-brand to-brand-2" />
					</div>
					<span className="tabular-nums">
						{String(seccion + 1).padStart(2, "0")} / {String(TOTAL_SECCIONES).padStart(2, "0")}
					</span>
				</div>
			</div>
		</section>
	);
}
