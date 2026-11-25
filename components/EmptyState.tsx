import type { ReactNode } from "react";

export type EmptyArt = "locked" | "lost" | "blank" | "cast";

const delay = (seconds: number) => ({ animationDelay: `${seconds}s` });

// A small story map drawn in the brand's thread style; each variant ends the
// branch differently so the picture says what the page says.
function Art({ variant }: { variant: EmptyArt }) {
  const line = "anim-draw fill-none";
  return (
    <svg
      viewBox="0 0 200 132"
      aria-hidden="true"
      className="h-28 w-auto overflow-visible sm:h-36"
    >
      {/* trunk */}
      <path
        d="M100 124 C100 104 100 96 100 84"
        pathLength={1}
        className={line}
        stroke="var(--caramel)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="96.5" y="120.5" width="7" height="7" transform="rotate(45 100 124)" fill="var(--caramel)" className="anim-pop" />

      {/* left branch, always there */}
      <path
        d="M100 84 C100 66 62 70 56 50"
        pathLength={1}
        className={line}
        style={delay(0.35)}
        stroke="var(--sapphire)"
        strokeOpacity="0.7"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="51" y="45" width="10" height="10" rx="2" fill="var(--surface)" stroke="var(--sapphire)" strokeOpacity="0.7" strokeWidth="1.4" className="anim-pop" style={delay(0.8)} />

      {variant === "blank" ? (
        <>
          {/* nothing written yet: the main line waits, dashed */}
          <path d="M100 84 C100 62 100 46 100 26" fill="none" stroke="var(--caramel)" strokeWidth="1.8" strokeDasharray="3 6" strokeLinecap="round" className="anim-pop" style={delay(0.5)} />
          <rect x="91" y="8" width="18" height="18" rx="3" fill="none" stroke="var(--caramel)" strokeWidth="1.6" strokeDasharray="3 4" className="anim-pop" style={delay(0.9)} />
          <path d="M100 13 V21 M96 17 H104" stroke="var(--caramel)" strokeWidth="1.6" strokeLinecap="round" className="anim-pop" style={delay(1.1)} />
        </>
      ) : (
        <>
          <path
            d="M100 84 C100 60 140 64 146 40"
            pathLength={1}
            className={line}
            style={delay(0.5)}
            stroke="var(--caramel)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {variant === "lost" ? (
            <>
              {/* the branch trails off into nothing */}
              <path d="M146 40 C150 26 160 22 170 14" fill="none" stroke="var(--caramel)" strokeWidth="1.8" strokeDasharray="2 6" strokeLinecap="round" className="anim-pop" style={delay(1)} />
              <circle cx="176" cy="9" r="7" fill="none" stroke="var(--muted)" strokeOpacity="0.6" strokeWidth="1.4" strokeDasharray="2 3" className="anim-pop" style={delay(1.2)} />
            </>
          ) : variant === "locked" ? (
            <g className="anim-pop" style={delay(1)}>
              {/* the next chapter sits behind a lock */}
              <rect x="132" y="24" width="28" height="24" rx="4" fill="var(--surface)" stroke="var(--caramel)" strokeWidth="1.8" />
              <path d="M139 24 V18 a7 7 0 0 1 14 0 V24" fill="none" stroke="var(--caramel)" strokeWidth="1.8" />
              <circle cx="146" cy="34" r="2.4" fill="var(--caramel)" />
              <path d="M146 36 V41" stroke="var(--caramel)" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          ) : (
            <g className="anim-pop" style={delay(1)}>
              {/* a cast of figures waiting to be named */}
              <circle cx="146" cy="30" r="6" fill="none" stroke="var(--caramel)" strokeWidth="1.8" />
              <path d="M135 48 a11 10 0 0 1 22 0" fill="none" stroke="var(--caramel)" strokeWidth="1.8" strokeLinecap="round" />
            </g>
          )}
        </>
      )}
    </svg>
  );
}

// The one way Booktion shows "nothing here yet", "you need to sign in" or
// "this doesn't exist": centred in the page, with a picture, a plain
// sentence and a way forward — never a lone line of grey text.
export default function EmptyState({
  art = "blank",
  eyebrow,
  title,
  children,
  actions,
  compact = false,
}: {
  art?: EmptyArt;
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={`relative mx-auto flex flex-col items-center overflow-hidden text-center ${
        compact
          ? "max-w-md py-10"
          : "my-[clamp(1.5rem,calc((100vh-560px-10rem)/2),14rem)] min-h-[min(62vh,560px)] max-w-xl justify-center rounded-2xl border border-border bg-surface px-6 py-14 shadow-[0_1px_0_rgba(15,25,57,0.03),0_24px_60px_-32px_rgba(15,25,57,0.25)] sm:px-14"
      }`}
    >
      {!compact && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,var(--caramel),transparent)] opacity-70"
        />
      )}
      <Art variant={art} />
      {eyebrow && (
        <p className="anim-rise mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-sapphire">
          {eyebrow}
        </p>
      )}
      <h2
        className={`anim-rise font-display text-3xl leading-tight text-foreground sm:text-[2.1rem] ${
          eyebrow ? "mt-2" : "mt-8"
        }`}
        style={delay(0.08)}
      >
        {title}
      </h2>
      {children && (
        <div className="anim-rise mt-3 max-w-md leading-relaxed text-muted" style={delay(0.16)}>
          {children}
        </div>
      )}
      {actions && (
        <div
          className="anim-rise mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3"
          style={delay(0.24)}
        >
          {actions}
        </div>
      )}
    </section>
  );
}
