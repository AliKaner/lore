// How long a text takes to read: at an average pace, and in flow (speed
// reading, one word at a time).
export const AVERAGE_WPM = 220;
export const FLOW_WPM = 450;

type T = (text: string, vars?: Record<string, string | number>) => string;

export function readingTime(words: number, wpm: number, t: T, num: (n: number) => string) {
  const minutes = words / wpm;
  if (minutes < 1) return t("~1 dk");
  if (minutes < 60) return t("~{n} dk", { n: Math.round(minutes) });
  const hours = Math.round((minutes / 60) * 10) / 10;
  return t("~{n} saat", { n: num(hours) });
}
