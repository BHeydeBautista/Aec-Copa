import Hero from "@/components/hero/hero";
import Cronograma from "@/components/sections/cronograma/cronograma";
import Faq from "@/components/sections/faq/faq";
import LogosStrip from "@/components/sections/logos/logos-strip";
import Precios from "@/components/sections/precios/precios";

export default function HomePage() {
	return (
		<>
			<Hero />
			<LogosStrip />
			<Cronograma />
			<Precios />
			<Faq />
		</>
	);
}
