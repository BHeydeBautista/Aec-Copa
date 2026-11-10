"use client";

import { ArrowRight, MoveRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef } from "react";
import { cronograma, pestanasCronograma } from "@/data/cronograma";
import { evento } from "@/data/evento";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { aplanarCronograma } from "@/lib/cronograma";
import { formatearFechaLarga } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { ItemLineaTiempoView } from "./item-linea-tiempo";

/**
 * Cronograma con scroll horizontal: la sección se fija (pin) y el scroll vertical
 * desliza la pista hacia los costados. Cada actividad dibuja su tallo y revela su texto
 * cuando entra en pantalla (ScrollTrigger con containerAnimation).
 */
export default function Cronograma() {
	const seccionRef = useRef<HTMLElement>(null);
	const pistaRef = useRef<HTMLDivElement>(null);
	const reducirMovimiento = useReducedMotion();
	const items = useMemo(() => aplanarCronograma(cronograma), []);

	useGSAP(
		() => {
			const seccion = seccionRef.current;
			const pista = pistaRef.current;
			if (!seccion || !pista) return;

			const distancia = () => Math.max(0, pista.scrollWidth - window.innerWidth);

			const deslizar = gsap.to(pista, {
				x: () => -distancia(),
				ease: "none",
				scrollTrigger: {
					trigger: seccion,
					start: "top top",
					end: () => `+=${distancia()}`,
					pin: true,
					scrub: 0.6,
					anticipatePin: 1,
					invalidateOnRefresh: true,
				},
			});

			gsap.fromTo(
				".tl-linea",
				{ scaleX: 0 },
				{
					scaleX: 1,
					ease: "none",
					scrollTrigger: {
						trigger: seccion,
						start: "top 60%",
						end: () => `+=${distancia() + window.innerHeight * 0.4}`,
						scrub: true,
						invalidateOnRefresh: true,
					},
				},
			);

			const elementos = gsap.utils.toArray<HTMLElement>(".item-tl");
			if (reducirMovimiento) return;

			for (const el of elementos) {
				const tallo = el.querySelector(".tl-stem");
				const punto = el.querySelector(".tl-dot");
				const textos = el.querySelectorAll(".tl-reveal");
				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: el,
						containerAnimation: deslizar,
						start: "left 92%",
						end: "left 55%",
						scrub: true,
					},
				});
				if (tallo) tl.fromTo(tallo, { scaleY: 0 }, { scaleY: 1, ease: "none", duration: 0.4 });
				if (punto) tl.fromTo(punto, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3 }, "<");
				tl.fromTo(textos, { yPercent: 110 }, { yPercent: 0, stagger: 0.08, duration: 0.6, ease: "power2.out" }, "<0.1");
			}
		},
		{ scope: seccionRef, dependencies: [reducirMovimiento, items.length] },
	);

	return (
		<section
			ref={seccionRef}
			id="cronograma"
			style={
				{ "--tl-fondo": "#e3f0f1", "--tl-tinta": "#14284d", "--tl-tenue": "#4b5f7c" } as React.CSSProperties
			}
			className="bg-azulejo relative overflow-hidden text-[var(--tl-tinta)]"
		>
			<div className="flex h-svh flex-col justify-center pt-16">
				<div ref={pistaRef} className="flex h-[min(76svh,640px)] w-max items-stretch pr-[8vw] pl-[6vw] will-change-transform">
					{/* Panel de entrada con la foto aérea del natatorio */}
					<div className="mr-[12vw] flex w-[86vw] shrink-0 flex-col justify-center sm:mr-[7vw] sm:w-[46vw] lg:w-[36vw]">
						<div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border-4 border-white shadow-[0_18px_40px_-18px_rgb(20_40_77/0.55)]">
							<Image
								src="/img/natatorio-aec.webp"
								alt="Vista aérea del natatorio del Atlético Echagüe Club"
								fill
								sizes="(min-width: 1024px) 36vw, (min-width: 640px) 46vw, 86vw"
								className="object-cover"
							/>
							<span className="absolute bottom-2 left-2 rounded-sm bg-[var(--tl-tinta)] px-2 py-1 font-marcador text-sm font-semibold tracking-wider text-white uppercase">
								Natatorio AEC · 50 m
							</span>
						</div>
						<h2 className="mt-6 font-display text-[10vw] leading-[0.95] font-extrabold tracking-tight sm:text-[5vw] lg:text-[3.6vw]">
							Cronograma
						</h2>
						<ul className="mt-4 space-y-2 text-[15px]">
							{pestanasCronograma.map((p) => {
								const fecha = p.id === "clinica" ? evento.fechaClinica : evento.fechaCopa;
								return (
									<li key={p.id} className="flex items-start gap-3">
										<span className={cn("mt-1.5 h-3 w-1.5 shrink-0 rounded-sm", p.id === "clinica" ? "bg-[#2a78b0]" : "bg-[#cf3a44]")} />
										<span>
											<span className="block font-semibold">{p.label}</span>
											<span className="block text-sm text-[var(--tl-tenue)]">{formatearFechaLarga(fecha)}</span>
										</span>
									</li>
								);
							})}
						</ul>
						<p className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--tl-tenue)]">
							Seguí scrolleando <MoveRight className="size-4" />
						</p>
					</div>

					{/* Línea de tiempo: la franja del fondo de la pileta, con su "T" al final */}
					<div className="relative flex h-full">
						<div aria-hidden className="absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-[var(--tl-tinta)]/10" />
						<div aria-hidden className="tl-linea absolute top-1/2 right-0 left-0 h-1.5 origin-left -translate-y-1/2 rounded-full bg-[var(--tl-tinta)]">
							<span className="absolute top-1/2 right-0 h-10 w-1.5 -translate-y-1/2 rounded-full bg-[var(--tl-tinta)]" />
						</div>
						{items.map((item) => (
							<ItemLineaTiempoView key={item.id} item={item} />
						))}
					</div>

					{/* Panel final */}
					<div className="ml-[8vw] flex w-[78vw] shrink-0 flex-col items-start justify-center sm:w-[38vw] lg:w-[28vw]">
						<p className="text-[11px] font-bold tracking-[0.22em] text-[#cf3a44] uppercase">Lugares limitados</p>
						<h3 className="mt-3 font-display text-[9vw] leading-[0.95] font-bold sm:text-[4vw] lg:text-[3vw]">
							Reservá tu andarivel
						</h3>
						<Link
							href="/#precios"
							className="mt-6 inline-flex h-12 items-center gap-2 rounded-md bg-[var(--tl-tinta)] px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
						>
							Ver entradas <ArrowRight className="size-4" />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
