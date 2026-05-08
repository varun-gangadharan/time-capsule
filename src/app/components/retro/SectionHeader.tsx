export default function SectionHeader({
  title,
  subtitle,
  size = "lg",
}: {
  title: string;
  subtitle?: string;
  size?: "lg" | "md";
}) {
  const heading =
    size === "lg"
      ? "text-3xl sm:text-5xl font-black text-black mb-3 sm:mb-4 tracking-tight leading-tight"
      : "text-2xl sm:text-4xl font-black text-black mb-2 tracking-tight";

  return (
    <div className="text-center mb-8">
      <h1
        className={heading}
        style={{ textShadow: "var(--retro-title-shadow)" }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-black/60 font-medium max-w-md mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
