import type { PasoFormulario } from "@/types";

export const pasosFormulario: PasoFormulario[] = [
	{ id: "entrada", titulo: "Entrada", descripcion: "Elegí qué entrada querés." },
	{ id: "datos", titulo: "Tus datos", descripcion: "Para identificarte en la acreditación." },
	{ id: "verificacion", titulo: "Email", descripcion: "Confirmá que podés recibir mensajes en esa dirección." },
	{ id: "pago", titulo: "Pago", descripcion: "Transferí el total al club." },
	{ id: "comprobante", titulo: "Comprobante", descripcion: "Subí el comprobante y confirmá." },
];
