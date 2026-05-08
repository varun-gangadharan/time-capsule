import type { ReactNode } from "react";

export default function StickerLabel({
  icon,
  label,
  bgClass = "bg-white/50",
}: {
  icon: ReactNode;
  label: string;
  bgClass?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${bgClass} border-2 border-black/50 px-3.5 py-1.5 rounded-full text-xs`}
    >
      <span className="text-black/70 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
      <span className="text-black/70 font-bold uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}
