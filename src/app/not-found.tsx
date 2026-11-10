import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
	return (
		<section className="grid min-h-[70svh] place-items-center px-4 pt-24 text-center">
			<div>
				<p className="font-display text-8xl font-extrabold text-gradient-brand">404</p>
				<h1 className="mt-4 font-display text-2xl font-bold">Esta página se fue a nadar</h1>
				<p className="mt-2 text-muted-foreground">No encontramos lo que buscabas.</p>
				<Link href="/" className={buttonVariants({ className: "mt-8" })}>
					Volver al inicio
				</Link>
			</div>
		</section>
	);
}
