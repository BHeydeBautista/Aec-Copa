import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
	"relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-brand text-brand-foreground shadow-[0_8px_30px_-8px_var(--brand)] hover:-translate-y-0.5 hover:bg-[#a5bbe3] hover:shadow-[0_12px_36px_-8px_var(--brand)]",
				water:
					"bg-gradient-to-r from-brand to-brand-2 text-brand-foreground shadow-[0_10px_34px_-10px_var(--brand-2)] hover:-translate-y-0.5 hover:brightness-110",
				outline:
					"border border-foreground/15 bg-foreground/[0.03] text-foreground backdrop-blur hover:border-brand/50 hover:bg-brand/10",
				ghost: "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
			},
			size: {
				sm: "h-9 px-4 text-sm",
				default: "h-11 px-6 text-sm",
				lg: "h-13 px-8 text-base",
				icon: "size-10",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
	return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
