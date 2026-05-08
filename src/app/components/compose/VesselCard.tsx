import { motion } from "motion/react";

export type VesselType = "capsule" | "envelope" | "constellation";

const config: Record<VesselType, { label: string; icon: string }> = {
  capsule: { label: "Capsule", icon: "\u{1F48A}" },
  envelope: { label: "Envelope", icon: "\u{2709}\u{FE0F}" },
  constellation: { label: "Constellation", icon: "\u{2728}" },
};

export default function VesselCard({
  type,
  selected,
  onClick,
}: {
  type: VesselType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`p-4 border-[2.5px] rounded-lg font-bold text-xs uppercase tracking-wide transition-all text-center ${
        selected
          ? "bg-gradient-to-b from-retro-yellow-from to-retro-yellow-to border-black shadow-[var(--retro-shadow-selected)]"
          : "bg-white/40 border-black/60 hover:bg-white/70 hover:border-black hover:shadow-[var(--retro-shadow-focus)]"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="text-2xl mb-2" style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif" }}>{config[type].icon}</div>
      <div className="text-black">{config[type].label}</div>
    </motion.button>
  );
}
