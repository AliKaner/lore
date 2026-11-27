import { v, type Infer } from "convex/values";

// The named things of a writer's world. Every kind shares one table
// (`entities`); what differs is the form, described here and read by both the
// server (to validate) and the editor (to draw it).

export const entityKindValidator = v.union(
  v.literal("character"),
  v.literal("place"),
  v.literal("country"),
  v.literal("race"),
  v.literal("group"),
  v.literal("building"),
  v.literal("weapon"),
  v.literal("item"),
);

export type EntityKind = Infer<typeof entityKindValidator>;

export type TextField = {
  key: string;
  label: string;
  type: "text";
  placeholder?: string;
  // Offered as you type, but anything may be written.
  suggestions?: string[];
};
export type LongTextField = {
  key: string;
  label: string;
  type: "longtext";
  placeholder?: string;
};
// Either an age or a birth year; the writer picks which one they know.
export type LifespanField = { key: "lifespan"; label: string; type: "lifespan" };
export type LinkField = {
  key: string;
  label: string;
  type: "link";
  kinds: EntityKind[];
  multiple?: boolean;
  // How the link reads from the other side ("Vatandaşları" on a country).
  reverse: string;
};
// A single picture with a purpose, like a country's map.
export type ImageField = { key: string; label: string; type: "image"; hint: string };

export type EntityField = TextField | LongTextField | LifespanField | LinkField | ImageField;

export type EntitySection = {
  title: string;
  fields: EntityField[];
  // Starts folded, opened with a click (physical traits, say).
  folded?: boolean;
};

export type EntityKindConfig = {
  label: string;
  plural: string;
  slug: string;
  // One letter-like glyph for chips and lists.
  glyph: string;
  namePlaceholder: string;
  summaryPlaceholder: string;
  sections: EntitySection[];
};

const longText = (key: string, label: string, placeholder?: string): LongTextField => ({
  key,
  label,
  type: "longtext",
  placeholder,
});
const text = (
  key: string,
  label: string,
  placeholder?: string,
  suggestions?: string[],
): TextField => ({ key, label, type: "text", placeholder, suggestions });

export const ENTITY_KINDS: Record<EntityKind, EntityKindConfig> = {
  character: {
    label: "Karakter",
    plural: "Karakterler",
    slug: "character",
    glyph: "✦",
    namePlaceholder: "Adı",
    summaryPlaceholder: "Tek cümlede kim?",
    sections: [
      {
        title: "Kimlik",
        fields: [
          { key: "lifespan", label: "Yaşı", type: "lifespan" },
          text("gender", "Cinsiyeti", undefined, ["Kadın", "Erkek"]),
          text("title", "Unvanı / lakabı", "Kuzeyin Kurdu"),
          text("role", "Mesleği / rolü", "Harita ustası"),
        ],
      },
      {
        title: "Ailesi",
        fields: [
          { key: "father", label: "Babası", type: "link", kinds: ["character"], reverse: "Çocukları" },
          { key: "mother", label: "Annesi", type: "link", kinds: ["character"], reverse: "Çocukları" },
          {
            key: "spouse",
            label: "Eşi",
            type: "link",
            kinds: ["character"],
            multiple: true,
            reverse: "Eşi",
          },
        ],
      },
      {
        // Who they love, fight, trust: drawn as the relations web.
        title: "İlişkileri",
        fields: [
          { key: "friends", label: "Arkadaşları", type: "link", kinds: ["character"], multiple: true, reverse: "Arkadaşları" },
          { key: "loves", label: "Aşık olduğu", type: "link", kinds: ["character"], multiple: true, reverse: "Ona aşık olanlar" },
          { key: "enemies", label: "Düşmanları", type: "link", kinds: ["character"], multiple: true, reverse: "Düşmanları" },
          { key: "hates", label: "Nefret ettiği", type: "link", kinds: ["character"], multiple: true, reverse: "Ondan nefret edenler" },
          { key: "rivals", label: "Rakipleri", type: "link", kinds: ["character"], multiple: true, reverse: "Rakipleri" },
          { key: "mentors", label: "Akıl hocası", type: "link", kinds: ["character"], multiple: true, reverse: "Öğrencileri" },
        ],
      },
      {
        title: "Bağlılığı",
        fields: [
          { key: "race", label: "Irkı", type: "link", kinds: ["race"], reverse: "Bu ırktan" },
          {
            key: "country",
            label: "Ülkesi / krallığı",
            type: "link",
            kinds: ["country"],
            reverse: "Halkından",
          },
          {
            key: "groups",
            label: "Topluluğu",
            type: "link",
            kinds: ["group"],
            multiple: true,
            reverse: "Üyeleri",
          },
          {
            key: "home",
            label: "Yaşadığı yer",
            type: "link",
            kinds: ["place", "building"],
            reverse: "Burada yaşayanlar",
          },
        ],
      },
      {
        title: "Fiziksel özellikleri",
        folded: true,
        fields: [
          text("height", "Boyu", "1,78 m"),
          text("weight", "Kilosu", "70 kg"),
          text("build", "Yapısı", "İnce, uzun bacaklı"),
          text("eyes", "Göz rengi", "Ela"),
          text("hair", "Saçı", "Kısa, kızıl"),
          text("skin", "Teni", "Güneşten yanık"),
          longText("marks", "Ayırt edici işaretleri", "Sol kaşında yara izi"),
        ],
      },
      {
        title: "Hikâyesi",
        fields: [
          longText("personality", "Kişiliği"),
          longText("goal", "Ne istiyor?"),
          longText("history", "Geçmişi"),
        ],
      },
    ],
  },
  place: {
    label: "Mekan",
    plural: "Mekanlar",
    slug: "place",
    glyph: "◆",
    namePlaceholder: "Mekanın adı",
    summaryPlaceholder: "Tek cümlede nasıl bir yer?",
    sections: [
      {
        title: "Nerede",
        fields: [
          text("type", "Türü", "Liman kenti", ["Şehir", "Köy", "Liman", "Orman", "Dağ", "Nehir", "Çöl", "Ada"]),
          {
            key: "country",
            label: "Bağlı olduğu ülke",
            type: "link",
            kinds: ["country"],
            reverse: "Yerleri",
          },
          {
            key: "within",
            label: "İçinde olduğu yer",
            type: "link",
            kinds: ["place"],
            reverse: "İçindeki yerler",
          },
          text("climate", "İklimi", "Sisli, serin"),
          text("population", "Nüfusu", "Yaklaşık 4.000"),
        ],
      },
      { title: "Harita", fields: [{ key: "map", label: "Harita", type: "image", hint: "Bir harita ya da kroki yükle" }] },
      { title: "Hikâyesi", fields: [longText("look", "Görünüşü"), longText("history", "Tarihi")] },
    ],
  },
  country: {
    label: "Ülke / krallık",
    plural: "Ülkeler",
    slug: "country",
    glyph: "♜",
    namePlaceholder: "Ülkenin adı",
    summaryPlaceholder: "Tek cümlede nasıl bir ülke?",
    sections: [
      {
        title: "Yönetimi",
        fields: [
          text("government", "Yönetim şekli", "Krallık", [
            "Krallık",
            "İmparatorluk",
            "Sultanlık",
            "Cumhuriyet",
            "Teokrasi",
            "Şehir devleti",
            "Kabile birliği",
            "Oligarşi",
          ]),
          { key: "ruler", label: "Hükümdarı", type: "link", kinds: ["character"], reverse: "Yönettiği ülke" },
          { key: "capital", label: "Başkenti", type: "link", kinds: ["place"], reverse: "Başkenti olduğu ülke" },
          text("population", "Nüfusu", "Yaklaşık 2 milyon"),
          text("founded", "Kuruluşu", "Ay Takvimi 312"),
          text("language", "Dili"),
          text("faith", "İnancı"),
        ],
      },
      { title: "Harita", fields: [{ key: "map", label: "Harita", type: "image", hint: "Ülkenin haritasını yükle" }] },
      {
        title: "Halkı ve ilişkileri",
        fields: [
          {
            key: "races",
            label: "Yaşayan ırklar",
            type: "link",
            kinds: ["race"],
            multiple: true,
            reverse: "Yaşadığı ülkeler",
          },
          { key: "allies", label: "Müttefikleri", type: "link", kinds: ["country"], multiple: true, reverse: "Müttefikleri" },
          { key: "enemies", label: "Düşmanları", type: "link", kinds: ["country"], multiple: true, reverse: "Düşmanları" },
        ],
      },
      {
        title: "Amacı ve tarihi",
        fields: [longText("purpose", "Amacı / ideali"), longText("history", "Tarihi")],
      },
    ],
  },
  race: {
    label: "Irk / halk",
    plural: "Irklar",
    slug: "race",
    glyph: "❖",
    namePlaceholder: "Irkın adı",
    summaryPlaceholder: "Tek cümlede kimler?",
    sections: [
      {
        title: "Özellikleri",
        fields: [
          text("lifeLength", "Ömrü", "300 yıla kadar"),
          {
            key: "homeland",
            label: "Anayurdu",
            type: "link",
            kinds: ["country", "place"],
            reverse: "Anayurdu olduğu ırklar",
          },
          longText("look", "Görünüşü"),
          longText("abilities", "Yetenekleri"),
          longText("culture", "Kültürü"),
          longText("history", "Tarihi"),
        ],
      },
    ],
  },
  group: {
    label: "Topluluk",
    plural: "Topluluklar",
    slug: "group",
    glyph: "⚑",
    namePlaceholder: "Topluluğun adı",
    summaryPlaceholder: "Tek cümlede ne yaparlar?",
    sections: [
      {
        title: "Yapısı",
        fields: [
          text("type", "Türü", "Lonca", ["Lonca", "Tarikat", "Ordu", "Hanedan", "Çete", "Konsey", "Okul"]),
          { key: "leader", label: "Lideri", type: "link", kinds: ["character"], reverse: "Yönettiği topluluk" },
          {
            key: "base",
            label: "Merkezi",
            type: "link",
            kinds: ["place", "building"],
            reverse: "Merkezi olduğu topluluklar",
          },
          { key: "country", label: "Bağlı olduğu ülke", type: "link", kinds: ["country"], reverse: "Toplulukları" },
          text("founded", "Kuruluşu"),
          longText("purpose", "Amacı"),
          longText("history", "Tarihi"),
        ],
      },
    ],
  },
  building: {
    label: "Yapı",
    plural: "Yapılar",
    slug: "building",
    glyph: "⌂",
    namePlaceholder: "Yapının adı",
    summaryPlaceholder: "Tek cümlede nasıl bir yapı?",
    sections: [
      {
        title: "Yapısı",
        fields: [
          text("type", "Türü", "Kale", ["Kale", "Saray", "Tapınak", "Kule", "Han", "Köprü", "Ev", "Kütüphane"]),
          {
            key: "location",
            label: "Bulunduğu yer",
            type: "link",
            kinds: ["place", "country"],
            reverse: "Yapıları",
          },
          {
            key: "owner",
            label: "Sahibi",
            type: "link",
            kinds: ["character", "group", "country"],
            reverse: "Sahip olduğu yapılar",
          },
          { key: "builder", label: "Yapan", type: "link", kinds: ["character", "group"], reverse: "Yaptığı yapılar" },
          text("built", "Yapılışı", "300 yıl önce"),
        ],
      },
      { title: "Planı", fields: [{ key: "plan", label: "Plan", type: "image", hint: "Bir plan ya da çizim yükle" }] },
      { title: "Hikâyesi", fields: [longText("purpose", "Amacı"), longText("history", "Tarihi")] },
    ],
  },
  weapon: {
    label: "Silah",
    plural: "Silahlar",
    slug: "weapon",
    glyph: "⚔",
    namePlaceholder: "Silahın adı",
    summaryPlaceholder: "Tek cümlede nasıl bir silah?",
    sections: [
      {
        title: "Özellikleri",
        fields: [
          text("type", "Türü", "Kılıç", ["Kılıç", "Hançer", "Yay", "Mızrak", "Balta", "Asa", "Tabanca", "Tüfek"]),
          { key: "owner", label: "Sahibi", type: "link", kinds: ["character"], reverse: "Silahları" },
          { key: "maker", label: "Yapan", type: "link", kinds: ["character", "group"], reverse: "Yaptığı silahlar" },
          text("material", "Malzemesi", "Gök demiri"),
          text("made", "Yapılışı"),
          longText("power", "Gücü / özellikleri"),
          longText("history", "Tarihi"),
        ],
      },
    ],
  },
  item: {
    label: "Eşya",
    plural: "Eşyalar",
    slug: "item",
    glyph: "◈",
    namePlaceholder: "Eşyanın adı",
    summaryPlaceholder: "Tek cümlede ne?",
    sections: [
      {
        title: "Özellikleri",
        fields: [
          text("type", "Türü", "Yüzük", ["Yüzük", "Kitap", "Harita", "Mektup", "Kolye", "Anahtar"]),
          { key: "owner", label: "Sahibi", type: "link", kinds: ["character", "group"], reverse: "Eşyaları" },
          { key: "location", label: "Nerede", type: "link", kinds: ["place", "building"], reverse: "Buradaki eşyalar" },
          longText("power", "Özellikleri"),
          longText("history", "Tarihi"),
        ],
      },
    ],
  },
};

export const ENTITY_KIND_ORDER: EntityKind[] = [
  "character",
  "place",
  "country",
  "race",
  "group",
  "building",
  "weapon",
  "item",
];

// Slugs used in links before URLs were in English; old bookmarks still work.
const LEGACY_SLUGS: Record<string, EntityKind> = {
  karakter: "character",
  mekan: "place",
  ulke: "country",
  irk: "race",
  topluluk: "group",
  yapi: "building",
  silah: "weapon",
  esya: "item",
};

export function kindFromSlug(slug: string | null | undefined): EntityKind | null {
  if (!slug) return null;
  return ENTITY_KIND_ORDER.find((kind) => ENTITY_KINDS[kind].slug === slug) ?? LEGACY_SLUGS[slug] ?? null;
}

export function fieldsOf(kind: EntityKind): EntityField[] {
  return ENTITY_KINDS[kind].sections.flatMap((section) => section.fields);
}

export function linkField(kind: EntityKind, key: string): LinkField | null {
  const field = fieldsOf(kind).find((f) => f.key === key);
  return field?.type === "link" ? field : null;
}

export function imageField(kind: EntityKind, key: string): ImageField | null {
  const field = fieldsOf(kind).find((f) => f.key === key);
  return field?.type === "image" ? field : null;
}

// Keys stored in `fields` (plain values). The lifespan field stores two keys.
export function valueKeysOf(kind: EntityKind): Map<string, "text" | "longtext"> {
  const keys = new Map<string, "text" | "longtext">();
  for (const field of fieldsOf(kind)) {
    if (field.type === "text") keys.set(field.key, "text");
    if (field.type === "longtext") keys.set(field.key, "longtext");
    if (field.type === "lifespan") {
      keys.set("age", "text");
      keys.set("birthYear", "text");
    }
  }
  return keys;
}

// Where a name is highlighted in the text, grouped by look.
export function markStyleOf(kind: EntityKind): "character" | "place" | "thing" {
  if (kind === "character") return "character";
  if (kind === "place" || kind === "country" || kind === "building") return "place";
  return "thing";
}

export const LIMITS = {
  name: 120,
  summary: 300,
  text: 300,
  longtext: 20_000,
  customFields: 40,
  customLabel: 60,
  images: 24,
  links: 100,
};
