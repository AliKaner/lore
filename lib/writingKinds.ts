import type { WritingKind } from "@/convex/writingKinds";

export type KindConfig = {
  label: string;
  untitled: string;
  pitch: string;
  traits: string[];
  unit: string;
  unitTitlePlaceholder: string;
  firstUnitCta: string;
  continueCta: string;
  mapLabel: string;
  branchCta?: string;
  branchIntro?: string;
  template?: string;
  datedTitle?: boolean;
};

export const KIND_ORDER: WritingKind[] = [
  "book",
  "story",
  "poetry",
  "essay",
  "column",
  "interview",
  "journal",
  "diary",
];

export const KINDS: Record<WritingKind, KindConfig> = {
  book: {
    label: "Kitap",
    untitled: "Başlıksız kitap",
    pitch: "Roman ve uzun anlatı. Bölümler dallanır, harita her yolu gösterir.",
    traits: ["Hikâye haritası ve ana hat", "Karakter ve mekân paketleri", "Okurlar kendi dallarını açar"],
    unit: "Bölüm",
    unitTitlePlaceholder: "Bölüm başlığı",
    firstUnitCta: "İlk bölümü yaz",
    continueCta: "Devam bölümü yaz",
    mapLabel: "Hikâye haritası",
    branchCta: "Buradan kendi hikâyeni yaz",
    branchIntro:
      "Bu bölümden devam eden, kendi yazdığın yeni bir hikâye kolu açıyorsun. Yazarın onayına gerek yok.",
  },
  story: {
    label: "Öykü",
    untitled: "Başlıksız öykü",
    pitch: "Tek oturuşta okunan kısa anlatı; okurlar farklı sonlar yazabilir.",
    traits: ["Kısa, odaklı anlatı", "Okurlar başka sonlar yazar"],
    unit: "Bölüm",
    unitTitlePlaceholder: "Öykünün başlığı",
    firstUnitCta: "Öyküyü yaz",
    continueCta: "Devamını yaz",
    mapLabel: "Öykünün yolları",
    branchCta: "Başka bir son yaz",
    branchIntro: "Bu bölümden sonra öykünün nasıl biteceğini sen yazıyorsun.",
  },
  poetry: {
    label: "Şiir",
    untitled: "Başlıksız şiir dosyası",
    pitch: "Bir şiir dosyası; her şiir kendi sayfasında, okurlar nazireyle karşılık verir.",
    traits: ["Her şiir ayrı sayfa", "Okurlar nazire yazar"],
    unit: "Şiir",
    unitTitlePlaceholder: "Şiirin adı",
    firstUnitCta: "İlk şiiri yaz",
    continueCta: "Yeni şiir ekle",
    mapLabel: "Şiirler ve nazireler",
    branchCta: "Nazire yaz",
    branchIntro: "Bu şiire kendi şiirinle karşılık veriyorsun — eski bir gelenek, yeni bir sayfa.",
  },
  essay: {
    label: "Deneme",
    untitled: "Başlıksız deneme",
    pitch: "Bir düşünceyi sonuna kadar götüren, tek yazarlı metin.",
    traits: ["Tek yazarlı, odaklı metin", "İstersen bölümlere ayır"],
    unit: "Bölüm",
    unitTitlePlaceholder: "Denemenin başlığı",
    firstUnitCta: "Denemeyi yaz",
    continueCta: "Yeni bölüm ekle",
    mapLabel: "Bölümler",
  },
  column: {
    label: "Köşe yazısı",
    untitled: "Başlıksız köşe",
    pitch: "Senin köşen. Spot satırıyla açılan yazılar tek adreste, sırayla.",
    traits: ["Spot satırıyla başlayan yazı", "Bütün yazıların tek köşede"],
    unit: "Yazı",
    unitTitlePlaceholder: "Yazının başlığı",
    firstUnitCta: "İlk yazıyı yaz",
    continueCta: "Yeni yazı ekle",
    mapLabel: "Yazılar",
    template: "<p><strong>Spot:</strong> </p><p></p>",
  },
  interview: {
    label: "Röportaj",
    untitled: "Başlıksız röportaj",
    pitch: "Soru–cevap düzeniyle başlayan, konuğunu en üstte tanıtan söyleşiler.",
    traits: ["Soru–cevap şablonu", "Konuk bilgisi en üstte"],
    unit: "Röportaj",
    unitTitlePlaceholder: "Röportajın başlığı",
    firstUnitCta: "İlk röportajı yaz",
    continueCta: "Yeni röportaj ekle",
    mapLabel: "Röportajlar",
    template:
      "<p><strong>Konuk:</strong> </p><p><strong>S:</strong> </p><p><strong>C:</strong> </p><p><strong>S:</strong> </p><p><strong>C:</strong> </p>",
  },
  journal: {
    label: "Journal",
    untitled: "Journal",
    pitch: "Her gün üç soruyla açılan sayfa: düşün, fark et, niyet et.",
    traits: ["Her sayfa üç soruyla açılır", "Başlık olarak bugünün tarihi"],
    unit: "Sayfa",
    unitTitlePlaceholder: "Sayfa başlığı",
    firstUnitCta: "Bugünün sayfasını yaz",
    continueCta: "Bugünün sayfasını yaz",
    mapLabel: "Sayfalar",
    template:
      "<h2>Bugün aklımı ne meşgul etti?</h2><p></p><h2>Neye minnettarım?</h2><p></p><h2>Yarın için tek bir niyet</h2><p></p>",
    datedTitle: true,
  },
  diary: {
    label: "Günlük",
    untitled: "Günlüğüm",
    pitch: "Tarihli sayfalar, kimsenin görmediği bir defter — sen açmadıkça.",
    traits: ["Başlık olarak bugünün tarihi", "Gizli başlar, istersen paylaşırsın"],
    unit: "Sayfa",
    unitTitlePlaceholder: "Sayfa başlığı",
    firstUnitCta: "Bugünü yaz",
    continueCta: "Bugünü yaz",
    mapLabel: "Sayfalar",
    datedTitle: true,
  },
};

export function kindConfig(book: { kind?: WritingKind }): KindConfig {
  return KINDS[book.kind ?? "book"];
}
