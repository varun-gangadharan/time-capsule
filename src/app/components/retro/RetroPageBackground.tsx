import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function RetroPageBackground({
  children,
  sparkleCount = 8,
}: {
  children: ReactNode;
  sparkleCount?: number;
}) {
  return (
    <div className="min-h-screen bg-retro-page flex items-center justify-center p-4 sm:p-8 overflow-hidden relative">
      {/* Paper grain noise texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "var(--retro-noise-url)",
          backgroundSize: "200px 200px",
        }}
      />

      {/* Floating sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(sparkleCount)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${25 + Math.random() * 50}%`,
              top: `${25 + Math.random() * 50}%`,
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, Math.random() * 8 - 4, 0],
              opacity: [0, 0.35, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut",
            }}
          >
            <div className="w-1 h-1 bg-purple-300 rounded-full" />
          </motion.div>
        ))}
      </div>

      {children}
    </div>
  );
}
