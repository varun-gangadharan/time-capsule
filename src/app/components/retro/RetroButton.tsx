import { motion } from "motion/react";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-retro-mint-from to-retro-mint-to text-black font-black border-[3px] border-black rounded-[var(--retro-radius-button)] shadow-[var(--retro-shadow-button)] tracking-wide",
  secondary:
    "bg-white/50 border-[2.5px] border-black/80 rounded-lg font-bold text-sm uppercase tracking-wide text-black hover:bg-white hover:shadow-[var(--retro-shadow-focus)] transition-all",
  ghost:
    "bg-white/50 border-[2.5px] border-black/60 rounded-lg font-bold text-sm uppercase tracking-wide text-black/70 hover:bg-white/80 hover:border-black/80 hover:text-black transition-all",
};

const variantMotion: Record<
  Variant,
  Pick<ComponentProps<typeof motion.button>, "whileHover" | "whileTap" | "transition">
> = {
  primary: {
    whileHover: { y: 2, x: 2, boxShadow: "3px 3px 0px 0px rgba(0,0,0,1)" },
    whileTap: { y: 5, x: 5, boxShadow: "0px 0px 0px 0px rgba(0,0,0,1)" },
    transition: { duration: 0.1 },
  },
  secondary: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  },
  ghost: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  },
};

export default function RetroButton({
  variant = "primary",
  className = "",
  children,
  disabled,
  ...props
}: {
  variant?: Variant;
} & Omit<ComponentProps<typeof motion.button>, "whileHover" | "whileTap">) {
  const sizeClass =
    variant === "primary" ? "px-10 py-4 text-base" : "px-6 py-3";

  const motion_props = disabled ? {} : variantMotion[variant];

  return (
    <motion.button
      className={`whitespace-nowrap ${variantClasses[variant]} ${sizeClass} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      {...motion_props}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
