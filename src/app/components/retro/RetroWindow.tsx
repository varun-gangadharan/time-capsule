import { motion } from "motion/react";
import type { ReactNode } from "react";

export default function RetroWindow({
  title,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className={`relative z-10 ${maxWidth} w-full`}>
      <motion.div
        className="bg-retro-window border-[3px] border-black/90 rounded-[var(--retro-radius-window)] shadow-[var(--retro-shadow-window)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Title bar */}
        <div className="bg-gradient-to-r from-retro-titlebar-from to-retro-titlebar-to border-b-[3px] border-black/90 px-5 py-3.5 flex items-center justify-between rounded-t-[11px]">
          <div className="flex gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-retro-dot-red border-[2.5px] border-black" />
            <div className="w-3.5 h-3.5 rounded-full bg-retro-dot-yellow border-[2.5px] border-black" />
            <div className="w-3.5 h-3.5 rounded-full bg-retro-dot-green border-[2.5px] border-black" />
          </div>
          <div className="text-black font-bold text-xs tracking-[0.12em] uppercase truncate min-w-0">
            {title}
          </div>
          <div className="w-16 shrink-0" />
        </div>

        {children}
      </motion.div>
    </div>
  );
}
