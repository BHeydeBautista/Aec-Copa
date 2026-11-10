"use client";

import { motion, type HTMLMotionProps } from "motion/react";

interface RevealProps extends HTMLMotionProps<"div"> {
	delay?: number;
	y?: number;
}

/** Aparece suavemente al entrar en pantalla. */
export function Reveal({ delay = 0, y = 24, children, ...props }: RevealProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
			{...props}
		>
			{children}
		</motion.div>
	);
}
