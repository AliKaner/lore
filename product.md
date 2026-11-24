# Ürün Vizyonu

Git'in dallanma (branch) ve ağaç yapısını, kitap yazarlığına uyarlayan bir platform.
Kullanıcıya "git", "branch", "commit" gibi terimler hiç gösterilmeyecek — yapı
arka planda git mantığıyla çalışacak ama yazar/okuyucu bunu normal bir
"bölüm", "dal", "alternatif hikaye" gibi günlük dille görecek.

Hedef: hem **yazarlar için yazmayı kolaylaştırmak**, hem de **okuyucular için
sosyal bir deneyim** sunmak.

## Tasarım Kararları (stil/akış karşılaştırmasından sonra)

Dört alanda üçer seçenek karşılaştırıldı (bkz. yayınlanmış mockup); seçilenler:

- **Görsel stil → Elyazması.** Sıcak kağıt tonu zemin (`#f6efe1`), mürekkep-
  ahşap metin, Fraunces serif başlıklar + Inter gövde metni, derin mor-ahududu
  (`#6b3f68`) vurgu rengi. "Taş tonu/sade" seçeneği bırakıldı — ürün bir kitap
  platformu olduğu için elyazması kimliği daha güçlü. Tüm renkler `app/globals.css`
  içinde `--background/--surface/--foreground/--muted/--border/--accent` token'ları
  olarak tanımlı, `lib/ui.ts` bunları kullanıyor; karanlık mod da var.
- **Bölüm ağacı → Düğüm grafiği.** `ChapterTree.tsx` artık iç içe liste değil,
  gerçek bir git-ağacı gibi kutular ve bağlantı eğrileriyle çiziliyor (basit bir
  "leaf'e sıra ver, üst düğüm çocuklarının ortalaması" yerleşim algoritması).
  Ürünün "dallanma" vaadini en net gösteren seçenek. Çok dallı kitaplarda
  yatay scroll gerekiyor — bilerek kabul edildi.
- **Yazma akışı → Anında Yaz.** "Yeni kitap" artık ayrı bir form sayfası değil;
  tıklanınca (`components/NewBookButton.tsx`) direkt "Başlıksız hikaye" / gizli
  bir kitap oluşturuyor ve editöre düşürüyor. Başlık, açıklama ve görünürlük
  (`components/BookTitleEditor.tsx`) editörün üstünde satır içi düzenleniyor —
  istendiğinde, zorunlu bir ilk adım olarak değil. `/kitap/yeni` sayfası kaldırıldı.
- **Keşfet düzeni → değişmedi.** Kapak rafı ve kategorili akış, kitapların
  çoğunun henüz kapağı olmaması nedeniyle şu an için zayıf kalıyordu; dikey
  liste kalmaya devam ediyor.

## Özellikler

İşaretliler (`[x]`) kodlandı ve çalışıyor; boş kutular (`[ ]`) henüz yapılmadı.

### Yazarlık / Bölüm Ağacı

- [x] Bölüm bölüm yazım (kitap tek parça değil, bölümlerden oluşuyor)
- [x] Bölümler git ağacı gibi dallanıyor (linked-list değil — bir bölümden
      birden fazla farklı hikaye koluna ayrılabiliyor)
- [x] Bir kitabın tüm bölüm ağacını görme (hikaye haritası)
- [x] Bir bölümün "resmi hat" (ana dal) olarak işaretlenmesi — kitap sahibi
      bölüm sayfasındaki "ana hat yap" butonunu kullanıyor
- [x] Var olan bir bölümü düzenleme — `/duzenle` ekranı, sadece yazarı girebiliyor
- [ ] Bölüm sıralamasını sürükle-bırakla değiştirme

### Paketlenebilir Varlıklar

- [x] Karakter oluşturma ve bir kitaba "paket" gibi dahil etme
- [x] Mekan oluşturma ve bir kitaba "paket" gibi dahil etme
- [x] Aynı karakter/mekanın birden fazla kitapta kullanılabilmesi
- [x] Karakter/mekan görselleri kitap sayfasındaki listede gösteriliyor

### Sosyal Yapı

- [x] Public kitaplar — herkes bölümleri okuyabiliyor
- [x] Fan-fiction / dallanma — herhangi bir kullanıcı, public bir kitabın
      yayınlanmış bir bölümünden kendi dalını açıkça yazabiliyor (kitap
      sahibinin onayı gerekmiyor)
- [x] Like (kitap ve bölüm için)
- [x] Yorumlar (kitap ve bölüm için)
- [x] Paylaşma (link kopyalama + paylaşım sayacı)
- [x] Favoriler — favori kitaplar
- [x] Favori karakterler
- [x] Favori mekanlar
- [x] Moderasyon — kitap/bölüm bildirme (`ReportButton`), kitap sahibi için
      `/moderasyon` ekranı: bildirimi çözüldü işaretleme, uygunsuz bir dalı
      gizleme (taslağa düşürme)

### Okuyucu Tarafı

- [x] Okunan kitaplar listesi / kişisel kitaplık
- [x] Kitaplık seviyesi — okudukça XP kazanıp seviye atlama
- [x] Seviye rozetleri (📖 🔎 🏹 🏆 👑) + unvan + ilerleme çubuğu — Header,
      profil ve kütüphane sayfalarında

### Görseller / Medya

- [x] Profil fotoğrafı (pp) yükleme + profilde gösterim
- [x] Duvar kağıdı (wallpaper) yükleme + profilde banner olarak gösterim
- [x] Kitap kapağı yükleme (kitap sayfasında, sadece sahibi) + keşfet
      akışında ve kitap sayfasında gösterim

### Sonra Detaylandırılacak

- [ ] Sosyal medya entegrasyonu / dışarı paylaşım tarafı netleştirilecek

## Test Altyapısı

- [x] `convex/*.test.ts` — `convex-test` + Vitest ile 36 test: kitap/bölüm
      yetkilendirme (dallanma kuralı, taslak görünürlüğü, düzenleme/ana hat/
      gizleme), karakter/mekan paketleme, like/yorum/favori/paylaşım, okuma
      ilerlemesi + seviye hesaplama, moderasyon. Passkey girişi gerçek bir
      WebAuthn seremonisi istediği için, testler girişi `@convex-dev/auth`'un
      kendi iç `_internal_dangerous_signIn` fonksiyonuyla taklit ediyor
      (`convex/testUtils.test.ts`) — bu üçüncü taraf paketin iç detayına
      bağımlı, versiyon güncellemesinde kırılabilir.
- `npm test` tek seferlik, `npm run test:watch` (veya arka planda zaten
  çalışan izleyici) her değişiklikte otomatik tekrar çalışıyor.

## Tutarlılık + UX Turu

- [x] Ortak stil sözlüğü (`lib/ui.ts`): birincil/ikincil buton, pill, kart,
      input stilleri artık tek yerden geliyor; her sayfada farklı
      padding/boyut yoktu artık aynı.
- [x] Yükleme durumları: sorgular hâlâ yüklenirken boş ekran yerine
      "Yükleniyor…" gösteriliyor (`components/Loading.tsx`).
- [x] Hata bildirimi: tüm hızlı aksiyonlar (like/favori/paylaş/bildir/ana hat/
      dal gizleme/paket ekleme/profil kaydet/görsel yükleme) artık başarısız
      olursa sağ-altta bir toast ile görünür oluyor (`components/Toaster.tsx`),
      sessizce yutulmuyor.
- [x] Anlık geri bildirim: beğeni ve favori artık optimistic update ile
      tıklandığı an değişiyor, sunucu cevabını beklemiyor.
- [x] Mobil uyum: header ve aksiyon satırları artık `flex-wrap`, dar ekranda
      taşmıyor.
- [x] Akış: yazma/düzenleme sayfalarına geri dönüş linki eklendi; giriş
      gerektiren sayfalar (yeni kitap, karakter/mekan oluşturma, bölüm
      yazma/düzenleme, kütüphanem, moderasyon) artık formu göstermeden önce
      "giriş yapman gerekiyor" uyarısı veriyor.
- [x] **Kritik düzeltme**: `listMyFavorites`, `listMine` (karakter/mekan/
      kitap), `myLibrary`, `listForMyBooks` sorguları giriş yapmamış bir
      ziyaretçi için hata fırlatıyordu — Convex'te bu, yakalanmazsa sayfayı
      çökertir. Kitap sayfasındaki favori butonu üzerinden herkes (giriş
      yapmamış dahil) bunu tetikleyebiliyordu. Backend'de nazikçe boş liste
      dönecek şekilde, frontend'de de gereksiz yere sorgu atmayacak şekilde
      (`"skip"`) düzeltildi; bir test de eklendi.

## Durum

1–6 arası adımlar (kapak yükleme, karakter/mekan görselleri, bölüm düzenleme,
ana hat butonu, moderasyon, seviye rozetleri) tamamlandı; `npx convex dev
--once --typecheck enable` ve `npm run build` temiz geçiyor. Kalan tek açık
madde **sosyal medya entegrasyonu** — kapsamı netleşmeden kodlanmayacak.
