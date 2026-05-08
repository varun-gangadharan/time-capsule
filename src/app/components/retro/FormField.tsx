import type { ReactNode } from "react";

export default function FormField({
  label,
  optional,
  hint,
  error,
  children,
}: {
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-bold text-black mb-2.5 uppercase tracking-wide">
        {label}
        {optional && <span className="text-black/50 text-xs ml-1">(Optional)</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-[#d4183d] mt-1 font-bold">{error}</p>
      )}
      {hint && !error && <p className="text-xs text-black/50 mt-1 font-medium">{hint}</p>}
    </div>
  );
}
