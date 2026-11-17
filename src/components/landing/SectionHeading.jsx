import { cn } from "@/lib/utils";

// The heading of a section. Centred on phones and tablets, where it fills the width; from
// 1280 px a centred heading with a text puts its title on the left and its text on the right,
// so neither stays a narrow column in the middle of a wide screen.
export default function SectionHeading({ eyebrow, title, text, tone = "dark", align = "center", className }) {
  const isLight = tone === "light";
  const centered = align === "center";
  const split = centered && Boolean(text);

  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        centered ? "mx-auto items-center text-center" : "items-start text-left",
        split && "xl:grid xl:max-w-none xl:grid-cols-2 xl:items-end xl:gap-x-16 xl:text-left",
        className
      )}
    >
      <div className={cn("flex flex-col gap-4", centered ? "items-center" : "items-start", split && "xl:items-start")}>
        {eyebrow ? <p className={cn("eyebrow", isLight ? "text-gold" : "text-gold-deep")}>{eyebrow}</p> : null}
        <h2
          className={cn(
            "text-[clamp(1.9rem,3.6vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.015em] [text-wrap:balance]",
            isLight ? "text-ivory" : "text-petrol"
          )}
        >
          {title}
        </h2>
      </div>
      {text ? (
        <p
          className={cn(
            "max-w-2xl text-[1.02rem] leading-relaxed",
            split && "xl:max-w-none xl:pb-1",
            isLight ? "text-ivory/75" : "text-petrol/70"
          )}
        >
          {text}
        </p>
      ) : null}
    </div>
  );
}
