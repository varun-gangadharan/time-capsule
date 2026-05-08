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
      className={`bg-gradient-to-br from-retro-page to-retro-titlebar-to border-[2.5px] border-black/80 rounded-lg p-6 ${className}`}
    >
      {children}
    </div>
  );
}
