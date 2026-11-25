import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import Wordmark from "@/components/Wordmark";
import BranchField from "@/components/BranchField";
import { KIND_ORDER, KINDS } from "@/lib/writingKinds";

const ctaPrimary =
  "inline-flex h-12 items-center justify-center rounded-sm bg-accent px-6 text-[15px] font-medium text-accent-contrast transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[0_14px_30px_-12px_rgba(38,66,139,0.65)]";
const ctaSecondary =
  "inline-flex h-12 items-center justify-center rounded-sm border border-foreground/25 px-6 text-[15px] font-medium text-foreground transition-colors hover:border-foreground/60";
const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const eyebrow =
  "text-xs font-semibold uppercase tracking-[0.16em] text-sapphire";

// Keep the branches away from the headline and let them dissolve at the
// section's edge so the hero flows into the next section.
const heroBranchMask: CSSProperties = {
  maskImage:
    "radial-gradient(ellipse 46% 30% at 50% 24%, transparent 40%, black 85%), linear-gradient(to bottom, black 78%, transparent)",
  WebkitMaskImage:
    "radial-gradient(ellipse 46% 30% at 50% 24%, transparent 40%, black 85%), linear-gradient(to bottom, black 78%, transparent)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

const ctaBranchMask: CSSProperties = {
  maskImage:
    "radial-gradient(ellipse 38% 46% at 50% 50%, transparent 45%, black 90%), linear-gradient(to bottom, transparent, black 30%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 38% 46% at 50% 50%, transparent 45%, black 90%), linear-gradient(to bottom, transparent, black 30%)",
  maskComposite: "intersect",
  WebkitMaskComposite: "source-in",
};

type MapNode = {
  x: number;
  y: number;
  w: number;
  chapter: number;
  title: string;
  author?: string;
  main?: boolean;
  selected?: boolean;
  delay: number;
};

const mapNodes: MapNode[] = [
  { x: 102, y: 0, w: 120, chapter: 1, title: "Sis", main: true, delay: 1.5 },
  { x: 102, y: 80, w: 120, chapter: 2, title: "Fener", main: true, delay: 1.95 },
  { x: 0, y: 170, w: 100, chapter: 3, title: "Dönüş", main: true, delay: 2.55 },
  { x: 112, y: 170, w: 100, chapter: 3, title: "Kayıp Tekne", author: "deniz", selected: true, delay: 2.65 },
  { x: 224, y: 170, w: 100, chapter: 3, title: "Fırtına", author: "mert", delay: 2.75 },
  { x: 0, y: 260, w: 100, chapter: 4, title: "Mektup", main: true, delay: 3.2 },
  { x: 112, y: 260, w: 100, chapter: 4, title: "Ada", author: "deniz", delay: 3.3 },
];

const mapLines: { d: string; main: boolean; delay: number }[] = [
  { d: "M162 48 V80", main: true, delay: 1.7 },
  { d: "M162 128 C162 152 50 146 50 170", main: true, delay: 2.2 },
  { d: "M162 128 V170", main: false, delay: 2.25 },
  { d: "M162 128 C162 152 274 146 274 170", main: false, delay: 2.3 },
  { d: "M50 218 V260", main: true, delay: 2.9 },
  { d: "M162 218 V260", main: false, delay: 2.95 },
];

function StoryMap() {
  return (
    <div className="relative mx-auto h-[350px] w-[324px]">
      <svg
        viewBox="0 0 324 350"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <g fill="none" strokeLinecap="round">
          {mapLines.map((line) => (
            <path
              key={line.d}
              d={line.d}
              pathLength={1}
              className="anim-draw"
              style={{ animationDelay: `${line.delay}s` }}
              stroke={line.main ? "var(--caramel)" : "var(--sapphire)"}
              strokeWidth={line.main ? 2.5 : 1.5}
            />
          ))}
        </g>
      </svg>
      {mapNodes.map((node) => (
        <div
          key={`${node.chapter}-${node.title}`}
          style={{ left: node.x, top: node.y, width: node.w, animationDelay: `${node.delay}s` }}
          className={`anim-pop absolute flex h-12 flex-col justify-center rounded-sm px-2 ${
            node.main
              ? "bg-caramel text-ink"
              : "border border-sapphire bg-surface text-foreground"
          } ${node.selected ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
        >
          <span className={`truncate text-[10px] font-semibold tracking-wide ${node.main ? "uppercase text-ink/70" : "text-muted"}`}>
            {node.author ? `@${node.author}` : `Bölüm ${node.chapter}`}
          </span>
          <span className="truncate text-[12px] font-semibold tracking-[-0.01em]">{node.title}</span>
        </div>
      ))}
      <div
        className="anim-rise absolute bottom-0 left-0 flex gap-4 text-[11px] text-muted"
        style={{ animationDelay: "3.4s" }}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-caramel" /> Ana hat
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-px w-4 bg-sapphire" /> Okur dalları
        </span>
      </div>
    </div>
  );
}

const threadEnds = [
  { x: 22, y: 120, opacity: 0.55, d: "M96 46 C96 84 46 88 22 120" },
  { x: 166, y: 116, opacity: 0.4, d: "M96 66 C96 96 142 98 166 116" },
];

function SectionThread({ align = "left" }: { align?: "left" | "center" }) {
  return (
    <div className={container}>
      <div
        aria-hidden="true"
        className={`thread relative mx-auto h-32 w-48 ${align === "left" ? "sm:mx-0 sm:-ml-[90px]" : ""}`}
      >
      <svg
        viewBox="0 0 192 128"
        fill="none"
        strokeLinecap="round"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <path className="thread-line" pathLength={1} d="M96 0 V128" stroke="var(--caramel)" strokeWidth={2} />
        {threadEnds.map((end) => (
          <path
            key={end.d}
            className="thread-line thread-line-late"
            pathLength={1}
            d={end.d}
            stroke="var(--sapphire)"
            strokeOpacity={end.opacity}
            strokeWidth={1.2}
          />
        ))}
      </svg>
      {threadEnds.map((end) => (
        <span
          key={end.d}
          className="thread-node absolute size-1.5 rotate-45 bg-sapphire/70"
          style={{ left: end.x - 3, top: end.y - 3 }}
        />
      ))}
      <span className="thread-node absolute bottom-0 left-1/2 size-3 -translate-x-1/2 translate-y-1/2 rotate-45 bg-caramel" />
      </div>
    </div>
  );
}

function FloatingCard({
  className,
  delay,
  floatOffset,
  children,
}: {
  className: string;
  delay: number;
  floatOffset: number;
  children: ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className={`anim-pop absolute z-10 hidden lg:block ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="anim-float flex items-center gap-3 rounded-md border border-border bg-surface/95 px-4 py-3 shadow-[0_24px_50px_-20px_rgba(15,25,57,0.45)] backdrop-blur"
        style={{ animationDelay: `${floatOffset}s` }}
      >
        {children}
      </div>
    </div>
  );
}

function ProductWindow({ social }: { social: boolean }) {
  return (
    <div
      role="img"
      aria-label="Booktion arayüzü: solda bir kitabın dallanan bölüm haritası, sağda bir okurun açtığı 'Kayıp Tekne' dalının okuma ekranı"
      className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_40px_90px_-40px_rgba(15,25,57,0.45)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <span className="font-serif text-[15px] font-medium">Kuzey Limanı</span>
        <div className="flex gap-4 text-xs text-muted">
          <span className="border-b-2 border-accent pb-1 font-semibold text-foreground">Hikâye haritası</span>
          <span className="pb-1">Karakterler</span>
          <span className="pb-1">Mekânlar</span>
        </div>
      </div>
      <div className="grid md:grid-cols-[384px_1fr]">
        <div className="overflow-x-auto border-b border-border bg-background/60 px-6 py-7 md:border-b-0 md:border-r">
          <StoryMap />
        </div>
        <div className="flex flex-col gap-4 px-6 py-7 sm:px-10">
          <span className="text-[11px] uppercase tracking-wider text-muted">
            Bölüm 2&apos;den ayrılan dal
          </span>
          <span className="font-display text-4xl leading-none">Kayıp Tekne</span>
          <span className="flex items-center gap-2.5 text-[13px] text-muted">
            <span className="flex size-7 items-center justify-center rounded-full bg-sapphire-soft text-[11px] font-semibold text-accent">
              DA
            </span>
            Deniz Aksoy · 12 dk okuma
          </span>
          <span
            className="anim-rise font-serif text-[17px] leading-[1.75] text-foreground/90"
            style={{ animationDelay: "2.4s" }}
          >
            Fenerin ışığı üçüncü kez döndüğünde Selin iskelede bağlı teknenin
            gitmiş olduğunu fark etti. Halat, sanki biri onu acele etmeden,
            düğümü düğüm üstüne çözerek bırakmış gibi suda yüzüyordu.
          </span>
          <span
            className="anim-rise font-serif text-[17px] leading-[1.75] text-foreground/90"
            style={{ animationDelay: "2.9s" }}
          >
            Babası bu limandan hiçbir teknenin habersiz çıkmadığını söylerdi.
            <span className="anim-blink ml-0.5 inline-block h-5 w-px translate-y-1 bg-accent" />
          </span>
          <span
            className="anim-rise mt-2 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-4 text-[13px] text-muted"
            style={{ animationDelay: "3.3s" }}
          >
            {social ? (
              <>
                <span>248 beğeni</span>
                <span>31 yorum</span>
                <span className="ml-auto rounded-sm border border-accent px-3 py-1.5 font-medium text-accent">
                  Bu bölümden dal aç
                </span>
              </>
            ) : (
              <>
                <span>Bağlantıyla paylaşıldı</span>
                <span className="ml-auto rounded-sm border border-accent px-3 py-1.5 font-medium text-accent">
                  Devam bölümü yaz
                </span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function EditorMock() {
  return (
    <div
      role="img"
      aria-label="Bölüm editörü: başlık satır içinde düzenleniyor, kitap gizli ve taslak durumda"
      className="rounded-lg border border-border bg-surface p-7 shadow-[0_30px_70px_-45px_rgba(15,25,57,0.5)]"
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full bg-caramel-soft px-2.5 py-1 font-semibold text-foreground">Gizli · yalnızca sen</span>
        <span className="rounded-full border border-border px-2.5 py-1 text-muted">Taslak</span>
        <span className="ml-auto text-muted">1.284 kelime</span>
      </div>
      <div className="mt-5 border-b border-dashed border-border-hover pb-2 font-display text-3xl">
        Başlıksız hikâye<span className="anim-blink ml-0.5 inline-block h-7 w-px translate-y-1 bg-accent" />
      </div>
      <div className="mt-4 flex gap-1.5 text-xs text-muted">
        <span className="rounded-sm border border-border px-2 py-1 font-semibold">K</span>
        <span className="rounded-sm border border-border px-2 py-1 italic">İ</span>
        <span className="rounded-sm border border-border px-2 py-1">Başlık</span>
        <span className="rounded-sm border border-border px-2 py-1">Alıntı</span>
      </div>
      <p className="mt-4 font-serif text-[16px] leading-[1.75] text-foreground/85">
        Liman o sabah sisin altında kaybolmuştu. Selin fenerin merdivenlerini
        sayarak çıktı; yüz on iki basamak, her zamanki gibi.
      </p>
    </div>
  );
}

function MainLineMock() {
  const branches = [
    { title: "Dönüş", author: "Sen", main: true },
    { title: "Kayıp Tekne", author: "Deniz Aksoy" },
    { title: "Fırtına", author: "Mert Kaya" },
  ];
  return (
    <div
      role="img"
      aria-label="Bölüm 3'ün üç dalı listeleniyor; biri ana hat olarak işaretli, diğerleri için ana hat yapma ve gizleme seçenekleri var"
      className="rounded-lg border border-border bg-surface p-7 shadow-[0_30px_70px_-45px_rgba(15,25,57,0.5)]"
    >
      <span className="text-[11px] uppercase tracking-wider text-muted">Bölüm 2 · Fener — devam eden dallar</span>
      <ul className="mt-4 flex flex-col divide-y divide-border">
        {branches.map((branch) => (
          <li key={branch.title} className="flex items-center gap-3 py-3.5">
            <span className={`size-2.5 rotate-45 ${branch.main ? "bg-caramel" : "border border-sapphire"}`} />
            <span className="flex flex-col">
              <span className="font-serif text-[16px] font-medium">{branch.title}</span>
              <span className="text-xs text-muted">{branch.author}</span>
            </span>
            {branch.main ? (
              <span className="ml-auto rounded-full bg-caramel-soft px-2.5 py-1 text-[11px] font-semibold text-foreground">
                Ana hat
              </span>
            ) : (
              <span className="ml-auto flex gap-3 text-xs">
                <span className="font-medium text-accent">Ana hat yap</span>
                <span className="text-muted">Gizle</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PackagesMock() {
  const items = [
    { initials: "SA", name: "Selin Aras", kind: "Karakter", books: "3 kitapta" },
    { initials: "KR", name: "Kaptan Rıza", kind: "Karakter", books: "1 kitapta" },
    { initials: "KL", name: "Kuzey Limanı", kind: "Mekân", books: "2 kitapta" },
  ];
  return (
    <div
      role="img"
      aria-label="Karakter ve mekân kartları; her biri birden fazla kitapta kullanılıyor ve yeni bir kitaba eklenebiliyor"
      className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface px-6 shadow-[0_30px_70px_-45px_rgba(15,25,57,0.5)]"
    >
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-4 py-4">
          <span
            className={`flex size-12 shrink-0 items-center justify-center rounded-sm font-display text-xl ${
              item.kind === "Mekân" ? "bg-caramel-soft text-foreground" : "bg-sapphire-soft text-accent"
            }`}
          >
            {item.initials}
          </span>
          <span className="flex flex-col">
            <span className="font-serif text-[16px] font-medium">{item.name}</span>
            <span className="text-xs text-muted">
              {item.kind} · {item.books}
            </span>
          </span>
          <span className="ml-auto shrink-0 text-xs font-medium text-accent">+ Kitaba ekle</span>
        </div>
      ))}
    </div>
  );
}

function ReaderMock() {
  return (
    <div
      role="img"
      aria-label="Okur paneli: seviye ilerlemesi ve bir bölümün altındaki yorumlar"
      className="flex flex-col gap-4"
    >
      <div className="rounded-lg border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-display text-2xl text-on-ink">Meraklı Okuyucu</span>
          <span className="text-xs text-on-ink/70">Seviye 4</span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[68%] rounded-full bg-caramel" />
        </div>
        <span className="mt-2 block text-xs text-on-ink/70">Hikaye Avcısı unvanına 2 seviye</span>
      </div>
      <div className="rounded-lg border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm">
        <span className="text-[11px] uppercase tracking-wider text-on-ink/60">Bölüm 3 · Kayıp Tekne — yorumlar</span>
        <div className="mt-4 flex flex-col gap-4 text-sm">
          <div className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-caramel text-[11px] font-semibold text-ink">EK</span>
            <span className="flex flex-col gap-1">
              <span className="font-semibold text-on-ink">Ece K.</span>
              <span className="text-on-ink/80">Teknenin kimin elinde olduğunu ben yazacağım, bekleyin.</span>
            </span>
          </div>
          <div className="flex gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sapphire text-[11px] font-semibold text-white">MK</span>
            <span className="flex flex-col gap-1">
              <span className="font-semibold text-on-ink">Mert Kaya</span>
              <span className="text-on-ink/80">Fırtına dalından buraya bağlansa çok iyi olur.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const mockCard =
  "rounded-lg border border-border bg-surface p-7 shadow-[0_30px_70px_-45px_rgba(15,25,57,0.5)]";

function InterviewMock() {
  return (
    <div
      role="img"
      aria-label="Röportaj şablonu: en üstte konuk bilgisi, altında soru ve cevaplar"
      className={mockCard}
    >
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="uppercase tracking-wider text-muted">Röportaj</span>
        <span className="rounded-full border border-border px-2.5 py-1 text-muted">Taslak</span>
      </div>
      <div className="mt-4 font-display text-3xl leading-tight">“Liman şehirleri unutmaz”</div>
      <div className="mt-5 flex flex-col gap-3 font-serif text-[15px] leading-relaxed text-foreground/90">
        <p>
          <strong className="font-semibold">Konuk:</strong> Nermin Ata, fener bekçisi, 64
        </p>
        <p>
          <strong className="font-semibold text-sapphire">S:</strong> Kırk yıl aynı ışığı yakmak nasıl bir şey?
        </p>
        <p>
          <strong className="font-semibold text-accent">C:</strong> Her gece başka bir gemi geçiyor. Işık aynı, deniz hiç aynı değil.
        </p>
        <p>
          <strong className="font-semibold text-sapphire">S:</strong>
          <span className="ml-1 anim-blink inline-block h-4 w-px translate-y-0.5 bg-accent" />
        </p>
      </div>
    </div>
  );
}

function JournalMock() {
  return (
    <div
      role="img"
      aria-label="Journal sayfası: başlık olarak bugünün tarihi, üç soru ve yalnızca sen etiketi"
      className={mockCard}
    >
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="uppercase tracking-wider text-muted">Journal</span>
        <span className="rounded-full bg-caramel-soft px-2.5 py-1 font-semibold text-foreground">Yalnızca sen</span>
      </div>
      <div className="mt-4 font-display text-3xl leading-tight">25 Kasım 2026 Çarşamba</div>
      <div className="mt-5 flex flex-col gap-4">
        {[
          ["Bugün aklımı ne meşgul etti?", "Sabah sisi ve bitmeyen o cümle."],
          ["Neye minnettarım?", "Annemin telefonu, sıcak çay."],
          ["Yarın için tek bir niyet", ""],
        ].map(([prompt, answer]) => (
          <div key={prompt} className="flex flex-col gap-1">
            <span className="font-display text-lg text-sapphire">{prompt}</span>
            <span className="min-h-5 font-serif text-[15px] text-foreground/85">
              {answer || <span className="anim-blink inline-block h-4 w-px translate-y-0.5 bg-accent" />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureRow({
  label,
  title,
  children,
  visual,
  flip = false,
}: {
  label: string;
  title: ReactNode;
  children: ReactNode;
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className={`reveal flex flex-col gap-4 ${flip ? "md:order-2" : ""}`}>
        <span className={eyebrow}>{label}</span>
        <h3 className="font-display text-4xl leading-[1.05] font-normal sm:text-[44px]">{title}</h3>
        <p className="max-w-md text-[17px] leading-relaxed text-muted">{children}</p>
      </div>
      <div className={`reveal-late ${flip ? "md:order-1" : ""}`}>{visual}</div>
    </div>
  );
}

const faqs: { q: string; a: string; only?: "open" | "closed" }[] = [
  {
    q: "Okumak ücretli mi?",
    a: "Hayır. Paylaşılan her yazı ücretsiz okunur; okumak için hesap bile gerekmez. Yazmak için giriş yapman yeterli.",
  },
  {
    q: "Başka yazarların yazılarını nerede bulurum?",
    a: "Şimdilik bir yazıyı yalnızca yazarının paylaştığı bağlantıyla okuyabilirsin. Keşfet, beğeniler, yorumlar ve okur dalları Booktion'da 100 yazı olduğunda açılacak.",
    only: "closed",
  },
  {
    only: "open",
    q: "Başkası kitabımdan dal açabilir mi?",
    a: "Herkese açık kitap, öykü ve şiirlerde, yayınlanmış bir bölümden herkes kendi dalını açabilir — bu Booktion'ın kalbi. Ana hattı yalnızca sen belirlersin; uygunsuz bir dalı gizleyebilir, bildirimleri moderasyon ekranından yönetebilirsin.",
  },
  {
    q: "Günlüğümü ve taslaklarımı kim görebilir?",
    a: "Yalnızca sen. Her yeni yazı gizli başlar; görünürlüğü ne zaman açacağına sen karar verirsin.",
  },
  {
    only: "open",
    q: "Köşe yazıma ya da röportajıma başkası ekleme yapabilir mi?",
    a: "Hayır. Okurların dal açabildiği türler yalnızca kurmaca ve şiir: kitap, öykü ve şiir. Deneme, köşe yazısı, röportaj, journal ve günlükte yalnızca yazar yazar; okurlar okur, beğenir ve yorum yapar.",
  },
  {
    q: "Şifre neden yok?",
    a: "Booktion geçiş anahtarı (passkey) kullanır. Bir kullanıcı adı seçersin, cihazının parmak izi, yüz tanıma ya da ekran kilidiyle girersin. Hesabın yoksa ilk girişte açılır.",
  },
];

export default async function Landing() {
  const community = await fetchQuery(api.books.communityStatus, {});
  const visibleFaqs = faqs.filter(
    (faq) => faq.only === undefined || (faq.only === "open") === community.open,
  );
  return (
    <div className="bg-background text-foreground">
      <header className="border-b border-border">
        <div className={`${container} flex h-[72px] items-center justify-between gap-6`}>
          <Link href="/" className="text-[28px]" aria-label="Booktion ana sayfa">
            <Wordmark />
          </Link>
          <nav aria-label="Sayfa bölümleri" className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#turler" className="hover:text-foreground">Yazı türleri</a>
            <a href="#kurmaca" className="hover:text-foreground">Kurmaca</a>
            {community.open && (
              <a href="#okurlar" className="hover:text-foreground">Okurlar</a>
            )}
            <a href="#fiyatlar" className="hover:text-foreground">Fiyatlar</a>
            <a href="#sss" className="hover:text-foreground">SSS</a>
          </nav>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/giris" className="hidden text-muted hover:text-foreground sm:inline">
              Giriş yap
            </Link>
            <Link
              href="/giris"
              className="inline-flex h-10 items-center rounded-sm bg-accent px-4 font-medium text-accent-contrast hover:bg-accent-hover"
            >
              Ücretsiz başla
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden pb-28 pt-20 sm:pt-28">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <BranchField
              className="absolute inset-0 h-full w-full"
              roots={14}
              maxBranches={340}
              originY={0.66}
              style={heroBranchMask}
            />
            <div
              className="grain absolute inset-0 opacity-[0.2] mix-blend-multiply"
              style={{
                maskImage: "linear-gradient(to bottom, black 60%, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent)",
              }}
            />
          </div>
          <div className={`${container} flex flex-col items-center text-center`}>
            <span className={`${eyebrow} anim-rise`}>Kitaptan günlüğe, her yazar için</span>
            <h1 className="mt-6 max-w-4xl font-display text-[54px] leading-[0.98] font-normal tracking-[-0.01em] sm:text-[88px]">
              {["Her", "yazıya", "kendi"].map((word, i) => (
                <span
                  key={word}
                  className="anim-rise inline-block"
                  style={{ animationDelay: `${0.12 + i * 0.09}s` }}
                >
                  {word}
                  {" "}
                </span>
              ))}
              <em className="anim-rise inline-block text-sapphire" style={{ animationDelay: "0.42s" }}>
                masası.
              </em>
            </h1>
            <p
              className="anim-rise mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl"
              style={{ animationDelay: "0.55s" }}
            >
              Romanını, köşe yazını, röportajını ya da günlüğünü Booktion&apos;da
              yaz. Her tür kendi şablonuyla, kendi düzeniyle gelir — kurmacada
              ise hikâyen dallanır.
            </p>
            <div
              className="anim-rise mt-10 flex flex-wrap justify-center gap-3"
              style={{ animationDelay: "0.7s" }}
            >
              <Link href="/giris" className={ctaPrimary}>
                Ücretsiz yazmaya başla
              </Link>
              {community.open ? (
                <Link href="/kesfet" className={ctaSecondary}>
                  Okumaya göz at
                </Link>
              ) : (
                <a href="#turler" className={ctaSecondary}>
                  Yazı türlerine bak
                </a>
              )}
            </div>
            <p className="anim-rise mt-5 text-sm text-muted" style={{ animationDelay: "0.8s" }}>
              Ücretsiz · Şifre yok, kredi kartı yok · Okumak her zaman ücretsiz
            </p>
            <div
              className="anim-rise mt-10 w-full max-w-3xl overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_14%,black_86%,transparent)]"
              style={{ animationDelay: "0.9s" }}
            >
              <ul aria-label="Yazı türleri" className="anim-marquee flex w-max gap-2 py-1">
                {[...KIND_ORDER, ...KIND_ORDER].map((kind, i) => (
                  <li
                    key={`${kind}-${i}`}
                    aria-hidden={i >= KIND_ORDER.length ? true : undefined}
                    className="whitespace-nowrap rounded-full border border-border bg-surface/80 px-4 py-1.5 font-display text-[18px] text-foreground/85"
                  >
                    {KINDS[kind].label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={`${container} relative mt-16 [perspective:1800px] sm:mt-20`}>
            <div className="anim-settle" style={{ animationDelay: "1s" }}>
              <ProductWindow social={community.open} />
            </div>
            <FloatingCard className="left-[44%] -top-9" delay={3.6} floatOffset={0}>
              <span aria-hidden="true" className="size-2.5 rotate-45 bg-caramel" />
              <span className="flex flex-col text-left">
                <span className="text-[13px] font-semibold">Ana hat seçildi</span>
                <span className="text-xs text-muted">Bölüm 3 · Dönüş</span>
              </span>
            </FloatingCard>
            <FloatingCard className="left-[3%] -bottom-12" delay={3.9} floatOffset={-2.5}>
              <span className="flex size-8 items-center justify-center rounded-sm bg-sapphire-soft font-display text-sm text-accent">
                SA
              </span>
              <span className="flex flex-col text-left">
                <span className="text-[13px] font-semibold">Selin Aras</span>
                <span className="text-xs text-muted">Karakter · 3 kitapta</span>
              </span>
            </FloatingCard>
            <FloatingCard className="right-[12%] -bottom-12" delay={4.2} floatOffset={-5}>
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 text-accent">
                <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="flex flex-col text-left">
                <span className="text-[13px] font-semibold">Taslak kaydedildi</span>
                <span className="text-xs text-muted">1.284 kelime</span>
              </span>
            </FloatingCard>
          </div>
        </section>

        <section id="turler" className="scroll-mt-6 pb-24 sm:pb-32">
          <SectionThread />
          <div className={`${container} mt-12 flex flex-col gap-14`}>
            <div className="reveal flex max-w-3xl flex-col gap-5">
              <span className={eyebrow}>Yazı türleri</span>
              <h2 className="font-display text-5xl leading-[1.02] font-normal sm:text-6xl">
                Sekiz tür, sekiz ayrı masa.
              </h2>
              <p className="max-w-2xl text-lg leading-relaxed text-muted">
                Ne yazacağını seçtiğin an şablon, başlık, kimin görebileceği ve
                okurların neler yapabileceği ona göre ayarlanır. Ayar menüsü
                yok — doğrudan yazarsın.
              </p>
            </div>
            <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {KIND_ORDER.map((kind) => {
                const cfg = KINDS[kind];
                return (
                  <li
                    key={kind}
                    className="reveal group relative flex flex-col gap-3 bg-surface p-7 transition-colors duration-300 hover:bg-background"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-0 h-0.5 w-0 bg-caramel transition-all duration-500 group-hover:w-full"
                    />
                    <span className="font-display text-[28px] leading-none transition-colors duration-300 group-hover:text-accent">
                      {cfg.label}
                    </span>
                    <span className="text-[15px] leading-relaxed text-muted">{cfg.pitch}</span>
                    <ul className="mt-auto flex flex-col gap-1.5 pt-3 text-sm text-foreground/80">
                      {cfg.traits.map((trait) => (
                        <li key={trait} className="flex gap-2.5">
                          <span aria-hidden="true" className="mt-[7px] size-1.5 shrink-0 rotate-45 bg-caramel" />
                          {trait}
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="bg-surface pb-24 sm:pb-32">
          <SectionThread />
          <div className={`${container} mt-12 flex flex-col gap-24 sm:gap-32`}>
            <FeatureRow
              label="Köşe yazarları ve muhabirler için"
              title={<>Röportajın <em>soru–cevapla</em>, köşe yazın spotla açılır.</>}
              visual={<InterviewMock />}
            >
              Röportaj, konuğu en üstte tanıtan soru–cevap şablonuyla başlar;
              köşe yazısı bir spot satırıyla. Bütün yazıların tek bir köşede,
              sırayla durur. Kimse izinsiz ekleme yapamaz — yazının sesi
              yalnızca senin.
            </FeatureRow>
            <FeatureRow
              label="Günlük ve journal tutanlar için"
              title="Her gün, kimsenin görmediği bir sayfa."
              visual={<JournalMock />}
              flip
            >
              Yeni sayfa başlığını bugünün tarihinden alır. Journal üç soruyla
              açılır: seni ne meşgul etti, neye minnettarsın, yarın için tek bir
              niyet. İkisi de gizli başlar; paylaşmak tamamen senin kararın.
            </FeatureRow>
          </div>
        </section>

        <section id="kurmaca" className="scroll-mt-6 pb-24 sm:pb-32">
          <SectionThread />
          <div className={`${container} mt-12 flex flex-col gap-24 sm:gap-32`}>
            <div className="reveal flex max-w-3xl flex-col gap-5">
              <span className={eyebrow}>Kitap, öykü ve şiir için</span>
              <h2 className="font-display text-5xl leading-[1.02] font-normal sm:text-6xl">
                Kurmacada hikâye dallanır. Haritayı Booktion tutar.
              </h2>
              {!community.open && (
                <p className="max-w-2xl text-[15px] text-muted">
                  Okur dalları, beğeniler ve yorumlar Booktion&apos;da{" "}
                  {community.threshold} yazı olduğunda açılacak. O zamana kadar
                  dalları sen yazarsın, okurların paylaştığın bağlantıyla okur.
                </p>
              )}
            </div>
            <FeatureRow
              label="Yazmak"
              title="Formu doldurma, doğrudan yaz."
              visual={<EditorMock />}
            >
              Yeni kitap tek tıkla açılır ve seni editöre bırakır. Başlık,
              açıklama ve görünürlük satır içinde — istediğin an düzenlersin,
              zorunlu bir ilk adım olarak değil. Kitap sen açana kadar gizli kalır.
            </FeatureRow>
            <FeatureRow
              label="Ana hat"
              title={<>Resmî devamı <em>sen</em> seçersin.</>}
              visual={<MainLineMock />}
              flip
            >
              Bir bölümden kaç dal çıkarsa çıksın, kitabın ana hattını tek tıkla
              belirlersin. Uygunsuz bir dalı gizlemek de aynı kolaylıkta;
              bildirilen içerikler moderasyon ekranında seni bekler.
            </FeatureRow>
            <FeatureRow
              label="Paketler"
              title="Karakterlerin her kitapta seninle."
              visual={<PackagesMock />}
            >
              Bir karakteri ya da mekânı bir kez oluştur, görseliyle birlikte
              istediğin kitaba paket gibi ekle. Aynı liman, aynı kaptan — bütün
              evreninde tutarlı.
            </FeatureRow>
          </div>
        </section>

        {community.open && (
        <section id="okurlar" className="glow-night scroll-mt-6 py-24 text-on-ink sm:py-32">
          <div className={`${container} grid items-center gap-14 md:grid-cols-[1.1fr_1fr] md:gap-20`}>
            <div className="reveal flex flex-col gap-6">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-caramel">
                Okurlar için
              </span>
              <h2 className="font-display text-5xl leading-[1.02] font-normal sm:text-6xl">
                Okur burada yalnızca okumaz — <em className="text-caramel">yazar.</em>
              </h2>
              <ul className="mt-2 flex flex-col gap-5 text-[17px] leading-relaxed text-on-ink/80">
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-caramel" />
                  <span><strong className="font-semibold text-on-ink">Bir bölümü sevdin mi?</strong> Devamını sen yaz; bir şiire nazireyle karşılık ver. Herkese açık kurmacada kimseden izin beklemezsin.</span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-caramel" />
                  <span><strong className="font-semibold text-on-ink">Beğen, yorumla, paylaş.</strong> Kitapları, karakterleri ve mekânları favorilerine ekle.</span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rotate-45 bg-caramel" />
                  <span><strong className="font-semibold text-on-ink">Okudukça seviye atla.</strong> Çırak Okuyucu olarak başla, Efsanevi Okuyucu unvanına kadar yüksel.</span>
                </li>
              </ul>
            </div>
            <div className="reveal-late">
              <ReaderMock />
            </div>
          </div>
        </section>
        )}

        <section id="fiyatlar" className="scroll-mt-6 pb-24 sm:pb-32">
          <SectionThread align="center" />
          <div className={`${container} mt-12 flex flex-col items-center gap-14`}>
            <div className="reveal flex max-w-2xl flex-col items-center gap-5 text-center">
              <span className={eyebrow}>Fiyatlar</span>
              <h2 className="font-display text-5xl leading-[1.02] font-normal sm:text-6xl">
                Okumak ücretsiz. <em className="text-sapphire">Yazmak da.</em>
              </h2>
              <p className="text-lg text-muted">
                Daha büyük evrenler kuranlar için Premium yolda.
              </p>
            </div>
            <div className="reveal-late grid w-full max-w-4xl gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-7 rounded-lg border border-border bg-surface p-9">
                <div className="flex flex-col gap-2">
                  <span className="font-serif text-xl font-medium">Booktion</span>
                  <span className="font-display text-5xl">Ücretsiz</span>
                </div>
                <ul className="flex flex-col gap-3 text-[15px] text-foreground/85">
                  {(community.open
                    ? [
                        "Sekiz yazı türünün hepsi",
                        "Sınırsız okuma, beğeni ve yorum",
                        "İstediğin kadar yazı ve bölüm",
                        "Herkese açık kitaplardan dal açma",
                        "Karakter ve mekân paketleri",
                      ]
                    : [
                        "Sekiz yazı türünün hepsi",
                        "İstediğin kadar yazı ve bölüm",
                        "Bağlantıyla paylaşma",
                        "Karakter ve mekân paketleri",
                      ]
                  ).map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rotate-45 bg-sapphire" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/giris" className={`${ctaPrimary} mt-auto`}>
                  Ücretsiz yazmaya başla
                </Link>
              </div>
              <div className="flex flex-col gap-7 rounded-lg bg-ink p-9 text-on-ink">
                <div className="flex flex-col gap-2">
                  <span className="flex items-center gap-3">
                    <span className="font-serif text-xl font-medium">Booktion Premium</span>
                    <span className="rounded-full bg-caramel px-2.5 py-0.5 text-[11px] font-semibold text-ink">
                      Yakında
                    </span>
                  </span>
                  <span className="font-display text-5xl">Yazar evi</span>
                </div>
                <ul className="flex flex-col gap-3 text-[15px] text-on-ink/85">
                  {[
                    "Sınırsız karakter ve mekân kütüphanesi",
                    "Kitapların için okur istatistikleri",
                    "Özel kapak ve sayfa temaları",
                    "Yeni özelliklere erken erişim",
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rotate-45 bg-caramel" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto text-sm text-on-ink/70">
                  Fiyat lansmanda açıklanacak. Bugün açtığın hesap aynen devam eder.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="sss" className="scroll-mt-6 bg-surface pb-24 sm:pb-28">
          <SectionThread />
          <div className={`${container} mt-12 grid gap-12 md:grid-cols-[1fr_1.6fr]`}>
            <div className="reveal flex flex-col gap-5">
              <span className={eyebrow}>Sık sorulanlar</span>
              <h2 className="font-display text-5xl leading-[1.02] font-normal">Merak edilenler</h2>
            </div>
            <div className="reveal-late flex flex-col divide-y divide-border border-y border-border">
              {visibleFaqs.map((faq) => (
                <details key={faq.q} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-serif text-xl font-medium [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span aria-hidden="true" className="text-2xl font-light text-sapphire transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden bg-caramel-soft py-28 sm:py-36">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <BranchField className="absolute inset-0 h-full w-full" roots={9} maxBranches={200} style={ctaBranchMask} />
            <div
              className="grain absolute inset-0 opacity-[0.25] mix-blend-multiply"
              style={{
                maskImage: "linear-gradient(to bottom, transparent, black 35%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent, black 35%)",
              }}
            />
          </div>
          <div className={`${container} reveal flex flex-col items-center gap-8 text-center`}>
            <h2 className="max-w-3xl font-display text-5xl leading-[1.02] font-normal sm:text-7xl">
              İlk sayfanı bu akşam yaz.
            </h2>
            <Link href="/giris" className={ctaPrimary}>
              Ücretsiz yazmaya başla
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className={`${container} flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between`}>
          <Wordmark className="text-2xl" />
          <nav aria-label="Alt bağlantılar" className="flex flex-wrap gap-6 text-sm text-muted">
            {community.open && (
              <Link href="/kesfet" className="hover:text-foreground">Keşfet</Link>
            )}
            <Link href="/giris" className="hover:text-foreground">Giriş yap</Link>
            <a href="#sss" className="hover:text-foreground">SSS</a>
          </nav>
          <span className="text-sm text-muted">© 2026 Booktion</span>
        </div>
      </footer>
    </div>
  );
}
