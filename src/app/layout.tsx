import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/layout/footer/footer";
import Navbar from "@/components/layout/navbar/navbar";
import { Toaster } from "@/components/ui/toaster";
import { evento } from "@/data/evento";
import "./globals.css";

const body = Geist({ variable: "--font-body", subsets: ["latin"] });
const heading = Bricolage_Grotesque({ variable: "--font-heading", subsets: ["latin"] });
// Condensada tipo tablero de tiempos: horarios, números de andarivel y precios.
// Monoespaciada para los tickets de precios.
const mono = Geist_Mono({ variable: "--font-mono-geist", subsets: ["latin"] });
const marcador = Big_Shoulders({ variable: "--font-scoreboard", subsets: ["latin"], weight: ["600", "800"] });

export const metadata: Metadata = {
	title: {
		default: `${evento.nombre} ${evento.edicion} · Clínica Meolans | ${evento.organizadorCorto}`,
		template: `%s | ${evento.nombre} ${evento.organizadorCorto}`,
	},
	description: evento.descripcion,
	icons: { icon: "/logos/aec.png" },
	openGraph: {
		title: `${evento.nombre} & Clínica Meolans`,
		description: evento.descripcion,
		images: ["/logos/aec.png"],
		locale: "es_AR",
		type: "website",
	},
};

export const viewport: Viewport = {
	themeColor: "#060a14",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="es-AR" className={`${body.variable} ${heading.variable} ${marcador.variable} ${mono.variable} antialiased`}>
			<body className="flex min-h-svh flex-col">
				<Navbar />
				<main className="flex-1">{children}</main>
				<Footer />
				<Toaster />
			</body>
		</html>
	);
}
