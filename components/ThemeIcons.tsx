import type { ThemeId } from "@/lib/themes";

// One small drawing per colour theme, in that theme's own colours (not the
// current theme's), so the picker shows what each one is.

function Booktion() {
  return (
    <>
      <path d="M24 13c-4-3-10-4-16-3v24c6-1 12 0 16 3z" fill="#26428b" />
      <path d="M24 13c4-3 10-4 16-3v24c-6-1-12 0-16 3z" fill="#516ac8" />
      <path d="M24 13v24" stroke="#f4f6fb" strokeWidth="1.2" />
      <path d="M32 9.5v9l2.2-1.8 2.2 1.8v-9.4" fill="#e3af64" />
    </>
  );
}

function Strawberry() {
  return (
    <>
      <path d="M24 15c8.5 0 14 4.2 14 11 0 8.6-7.6 16.4-14 18.5C17.6 42.4 10 34.6 10 26c0-6.8 5.5-11 14-11z" fill="#c8283f" />
      <path d="M24 15c8.5 0 14 4.2 14 11 0 8.6-7.6 16.4-14 18.5 4-4 7-11 7-18 0-5-2.5-9-7-11.5z" fill="#a71f33" opacity="0.55" />
      <path d="M24 17l-7.5-4 5 .2L19 7.5l5 4 5-4-2.5 5.7 5-.2z" fill="#4f8a3c" />
      <path d="M24 12.5V6" stroke="#4f8a3c" strokeWidth="2" strokeLinecap="round" />
      {[
        [18, 23],
        [24, 22],
        [30, 23],
        [15, 29],
        [21, 29],
        [27, 29],
        [33, 29],
        [19, 35],
        [25, 35],
        [30, 35],
        [24, 40],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="0.9" ry="1.3" fill="#ffd9a0" />
      ))}
    </>
  );
}

function Frog() {
  return (
    <>
      <ellipse cx="24" cy="30" rx="16" ry="11.5" fill="#3b7a29" />
      <circle cx="15" cy="18.5" r="6.5" fill="#3b7a29" />
      <circle cx="33" cy="18.5" r="6.5" fill="#3b7a29" />
      <circle cx="15" cy="18.5" r="4" fill="#fbfdf7" />
      <circle cx="33" cy="18.5" r="4" fill="#fbfdf7" />
      <circle cx="16" cy="19" r="2" fill="#18301a" />
      <circle cx="32" cy="19" r="2" fill="#18301a" />
      <path d="M15.5 31c5 4.5 12 4.5 17 0" fill="none" stroke="#18301a" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12.5" cy="29" r="2" fill="#d9b836" opacity="0.8" />
      <circle cx="35.5" cy="29" r="2" fill="#d9b836" opacity="0.8" />
    </>
  );
}

function Horse() {
  return (
    <>
      <path
        d="M31 7l-1.6 4.4C24 13 18.5 18 15 24.5l-4.6 7.2c-1.2 2-.4 4.3 1.8 4.8l3.4.8c1.6.4 3-.3 3.8-1.6l3-4.6c.9 2.9.7 6-.6 9.2L19.5 44h18c1-6.5 1-13-.6-19.2-1.2-4.6-3-8.6-5.2-11.8z"
        fill="#8a4b22"
      />
      <path
        d="M31 7c3.6 3.4 6.4 8 7.6 13.4 1.4 6.4 1.4 14.6.4 23.6h-3c1-7.6 1.2-15-.4-21.2C34.4 17.2 32.6 12 29.4 9z"
        fill="#2e1f14"
      />
      <circle cx="23.2" cy="20" r="1.5" fill="#fcf8f1" />
      <path d="M13 34.5l3.2.6" stroke="#2e1f14" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M17 26.5c2.4 2.6 3.8 5.3 4.2 8" fill="none" stroke="#c99a4b" strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
}

function Sky() {
  return (
    <>
      <g stroke="#f2b544" strokeWidth="2" strokeLinecap="round">
        <path d="M31 5v3M42 16h-3M38.8 8.2l-2.1 2.1M23.2 8.2l2.1 2.1" />
      </g>
      <circle cx="31" cy="17" r="7.5" fill="#f2b544" />
      <path
        d="M13 39a7.5 7.5 0 0 1-1-14.9 9.5 9.5 0 0 1 18-2.6 7 7 0 0 1 8.5 6.8A5.4 5.4 0 0 1 37 39z"
        fill="#f9fcff"
        stroke="#9ec3e6"
        strokeWidth="1.4"
      />
      <path d="M17 33h12" stroke="#1d6aab" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
    </>
  );
}

function Moon() {
  return (
    <>
      <path d="M29 7.5a16.5 16.5 0 1 0 11.8 27.8A13.5 13.5 0 0 1 29 7.5z" fill="#e3af64" />
      <path d="M12 12l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z" fill="#f6f3e7" />
      <path d="M38 11l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z" fill="#8fa2e6" />
      <path d="M41 24l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5z" fill="#f6f3e7" />
      <circle cx="9" cy="28" r="0.9" fill="#8fa2e6" />
    </>
  );
}

function Rose() {
  return (
    <>
      <path d="M24 29c0 5 .4 10 0 15" stroke="#66836a" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 37c-3-4-8-4.4-10.5-2.6 2.4 3.4 7.6 4 10.5 2.6z" fill="#66836a" />
      <path d="M24 34c2.6-3.2 6.8-3.6 9-2.2-2 2.9-6.4 3.4-9 2.2z" fill="#66836a" opacity="0.85" />
      <path d="M13 17c0-6 5-9.5 11-9.5S35 11 35 17c0 6.6-5 12-11 12S13 23.6 13 17z" fill="#9a4757" />
      <path d="M17 16c1.5-4 4.5-5.5 7.5-5.5 3.6 0 6.5 2.6 6.5 6.3 0 4.2-3.3 7.2-7 7.2-3 0-5.4-2-5.4-4.8 0-2.4 1.8-4.2 4-4.2 1.9 0 3.3 1.3 3.3 3"
        fill="none" stroke="#e3a1a8" strokeWidth="1.7" strokeLinecap="round" />
    </>
  );
}

function Fire() {
  return (
    <>
      <path
        d="M25.5 4c1.4 6-3.2 8.6-6 12.4C16.8 20 14 24 14 29.5 14 37 19 43 24.5 43S35 37.6 35 30.5c0-4.6-2.2-8-4.4-10.4.4 3-.8 5.6-2.8 6.6 1-6.4-.6-15.6-2.3-22.7z"
        fill="#ff7a2f"
      />
      <path
        d="M24.5 43c-3.8 0-6.5-3-6.5-7 0-4.4 3.6-6.8 5.4-10.4 1.8 2.4 1.4 5.2 3.6 6.4.6-1.4.8-2.8.6-4.2 2.2 2.2 3.4 4.6 3.4 8 0 4.2-2.8 7.2-6.5 7.2z"
        fill="#ffc247"
      />
      <path d="M24.6 43c-1.6 0-2.8-1.4-2.8-3.2 0-2.2 1.6-3.4 2.8-5.4 1.2 2 2.8 3.2 2.8 5.4 0 1.8-1.2 3.2-2.8 3.2z" fill="#fff3d6" />
    </>
  );
}

function Heart() {
  return (
    <>
      <path d="M24 40.5C11.5 32.6 8 25 10.6 18.6 13.2 12.4 20.6 11.6 24 17c3.4-5.4 10.8-4.6 13.4 1.6C40 25 36.5 32.6 24 40.5z" fill="#ff8cc6" />
      <path d="M24 40.5c-6-3.8-9.6-7.6-11.4-11.2 4.6 4.4 12 4.6 18.6.4 3.4-2.2 5.8-5.6 6.4-9.4 1 5.8-2.8 12.6-13.6 20.2z" fill="#c4217c" opacity="0.5" />
      <ellipse cx="16.5" cy="20.5" rx="2.4" ry="1.5" transform="rotate(-35 16.5 20.5)" fill="#fffafd" opacity="0.85" />
      <path d="M38 6l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#9461dc" />
      <path d="M9 34l.7 1.7 1.7.7-1.7.7L9 38.8l-.7-1.7-1.7-.7 1.7-.7z" fill="#9461dc" opacity="0.8" />
    </>
  );
}

const DRAWINGS: Record<ThemeId, () => React.JSX.Element> = {
  booktion: Booktion,
  cilek: Strawberry,
  kurbaga: Frog,
  at: Horse,
  gokyuzu: Sky,
  karanlik: Moon,
  gul: Rose,
  ates: Fire,
  pembik: Heart,
};

export default function ThemeIcon({ id, className = "h-6 w-6" }: { id: ThemeId; className?: string }) {
  const Drawing = DRAWINGS[id];
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <Drawing />
    </svg>
  );
}
