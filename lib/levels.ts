const TITLES: { minLevel: number; title: string; badge: string }[] = [
  { minLevel: 21, title: "Efsanevi Okuyucu", badge: "👑" },
  { minLevel: 11, title: "Usta Okuyucu", badge: "🏆" },
  { minLevel: 6, title: "Hikaye Avcısı", badge: "🏹" },
  { minLevel: 3, title: "Meraklı Okuyucu", badge: "🔎" },
  { minLevel: 1, title: "Çırak Okuyucu", badge: "📖" },
];

export function levelInfo(level: number, xp: number) {
  const match = TITLES.find((entry) => level >= entry.minLevel) ?? TITLES[TITLES.length - 1];
  const xpIntoLevel = xp % 100;
  return {
    title: match.title,
    badge: match.badge,
    xpIntoLevel,
    xpForNextLevel: 100,
    progressPercent: xpIntoLevel,
  };
}
