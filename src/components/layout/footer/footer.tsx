import { AtSign, Mail, MapPin, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LogoImage } from "@/components/ui/logo-image";
import { ANIO_SITIO, VERSION_SITIO, evento } from "@/data/evento";
import { logos, navegacion } from "@/data/sitio";

const linksFooter = [...navegacion, { href: "/inscripcion", label: "Inscripción" }];

/** Footer Systemium (misma línea visual que Aquatiempo). */
export default function Footer() {
	const { contacto, sede } = evento;

	return (
		<footer className="relative mt-24 overflow-hidden border-t border-border">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0"
				style={{
					background:
						"radial-gradient(1100px 420px at 10% 0%, color-mix(in srgb, var(--brand) 16%, transparent) 0%, transparent 55%), radial-gradient(900px 360px at 90% 10%, color-mix(in srgb, var(--brand-2) 12%, transparent) 0%, transparent 55%), linear-gradient(180deg, #070b16 0%, #04060d 100%)",
				}}
			/>

			<div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
				<div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr] md:items-start">
					{/* Systemium */}
					<div className="flex items-center gap-5">
						<div className="group relative size-28 shrink-0 sm:size-36">
							<Image
								src="/img/logosystemium.png"
								alt="Systemium"
								fill
								sizes="(min-width: 640px) 144px, 112px"
								className="object-contain transition-transform duration-300 group-hover:scale-[1.04]"
							/>
						</div>
						<div className="min-w-0">
							<p className="text-xs tracking-[0.26em] text-foreground/50">EVENTO</p>
							<p className="mt-1 font-display text-lg font-semibold tracking-tight">
								{evento.nombre} <span className="text-brand">{evento.edicion}</span>
							</p>
							<p className="mt-2 max-w-sm text-sm leading-6 text-foreground/65">
								Clínica Meolans y torneo master del {evento.organizador}.
							</p>
						</div>
					</div>

					{/* Navegación */}
					<div>
						<p className="text-xs tracking-[0.26em] text-foreground/50">NAVEGACIÓN</p>
						<div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-foreground/65">
							{linksFooter.map((item) => (
								<Link key={item.href} href={item.href} className="group inline-flex items-center gap-2 hover:text-foreground">
									<span className="size-1.5 rounded-full bg-foreground/25 transition-colors group-hover:bg-brand" />
									<span className="truncate">{item.label}</span>
								</Link>
							))}
						</div>
					</div>

					{/* Contacto */}
					<div>
						<p className="text-xs tracking-[0.26em] text-foreground/50">CONTACTO</p>
						<ul className="mt-4 space-y-3 text-sm text-foreground/65">
							<li>
								<a href={sede.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex gap-2 hover:text-foreground">
									<MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
									<span>
										{sede.nombre}
										<br />
										{sede.ciudad}
									</span>
								</a>
							</li>
							{contacto.whatsapp && (
								<li>
									<a href={`https://wa.me/${contacto.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
										<MessageCircle className="size-4 text-brand" /> WhatsApp
									</a>
								</li>
							)}
							{contacto.email && (
								<li>
									<a href={`mailto:${contacto.email}`} className="inline-flex items-center gap-2 hover:text-foreground">
										<Mail className="size-4 text-brand" /> {contacto.email}
									</a>
								</li>
							)}
							{contacto.instagram && (
								<li>
									<a href={`https://instagram.com/${contacto.instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
										<AtSign className="size-4 text-brand" /> @{contacto.instagram}
									</a>
								</li>
							)}
						</ul>
					</div>
				</div>

				<div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-8">
					{logos.map((logo) => (
						<LogoImage key={logo.id} logo={logo} className="h-12 w-16" />
					))}
				</div>

				<div className="mt-10 rounded-3xl border border-foreground/10 bg-foreground/[0.03] px-5 py-4 backdrop-blur sm:rounded-full sm:px-8">
					<div className="flex flex-col gap-2 text-xs text-foreground/60 sm:flex-row sm:items-center sm:justify-between">
						<p>
							© {ANIO_SITIO} {evento.organizador} — Todos los derechos reservados.
						</p>
						<p className="font-medium text-foreground/75">Versión {VERSION_SITIO}</p>
						<p>
							Diseño &amp; desarrollo: <span className="font-semibold text-foreground">Systemium</span>
							<span className="mx-2 text-foreground/30">•</span>
							Software original. Prohibida su reproducción.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
