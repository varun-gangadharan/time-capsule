import type { ReactNode } from "react";

export default function PaperPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br from-retro-page to-retro-titlebar-to border-[2.5px] border-black/80 rounded-xl p-6 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
