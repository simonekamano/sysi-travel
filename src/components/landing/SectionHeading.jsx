import { cn } from "@/lib/utils";

export default function SectionHeading({ eyebrow, title, text, tone = "dark", align = "center", className }) {
  const isLight = tone === "light";

  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow ? (
        <p className={cn("eyebrow", isLight ? "text-gold" : "text-gold-deep")}>{eyebrow}</p>
      ) : null}
      <h2
        className={cn(
          "text-[clamp(1.9rem,3.6vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.015em]",
          isLight ? "text-ivory" : "text-petrol"
        )}
      >
        {title}
      </h2>
      {text ? (
        <p
          className={cn(
            "max-w-2xl text-[1.02rem] leading-relaxed",
            isLight ? "text-ivory/75" : "text-petrol/70"
          )}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}