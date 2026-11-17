import { cn } from "@/lib/utils";

// The colours of the flag of Guinea: three vertical bands, red, yellow and green.
export const GUINEA_RED = "#CE1126";
export const GUINEA_YELLOW = "#FCD116";
export const GUINEA_GREEN = "#009460";

// The flag of Guinea, drawn rather than the 🇬🇳 emoji, which many Windows computers show as the
// letters « GN ». `label`: what a screen reader says; without it the flag is decorative.
export default function GuineaFlag({ label, className }) {
  return (
    <svg
      viewBox="0 0 3 2"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      className={cn("inline-block h-[0.9em] w-auto shrink-0 rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)]", className)}
    >
      <rect width="1" height="2" x="0" fill={GUINEA_RED} />
      <rect width="1" height="2" x="1" fill={GUINEA_YELLOW} />
      <rect width="1" height="2" x="2" fill={GUINEA_GREEN} />
    </svg>
  );
}

// A thin band in the colours of the flag, across the top of the page.
export function GuineaStripe({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-1 w-full", className)}
      style={{
        background: `linear-gradient(to right, ${GUINEA_RED} 0 33.34%, ${GUINEA_YELLOW} 33.34% 66.67%, ${GUINEA_GREEN} 66.67% 100%)`,
      }}
    />
  );
}
