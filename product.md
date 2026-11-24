# Ürün Vizyonu — Booktion

Ürünün adı **Booktion**. Git'in dallanma (branch) ve ağaç yapısını, kitap
yazarlığına uyarlayan; ama artık yalnızca kitap yazarlarına değil, her tür
yazara (köşe yazarı, muhabir, deneme yazarı, şair, günlük/journal tutan)
kendi türüne özel bir yazma deneyimi sunan bir platform.
Kullanıcıya "git", "branch", "commit" gibi terimler hiç gösterilmeyecek — yapı
arka planda git mantığıyla çalışacak ama yazar/okuyucu bunu normal bir
"bölüm", "dal", "alternatif hikaye" gibi günlük dille görecek.

Hedef: hem **yazarlar için yazmayı kolaylaştırmak**, hem de **okuyucular için
sosyal bir deneyim** sunmak.

## Tasarım Kararları (stil/akış karşılaştırmasından sonra)

Dört alanda üçer seçenek karşılaştırıldı (bkz. yayınlanmış mockup); seçilenler:

- **Görsel stil → Booktion kimliği.** (Eski "Elyazması" stilinin yerini aldı.)
  Palet kullanıcının verdiği referanstan: Rapture's Light `#F6F3E7`, Milk Tooth
  `#FAEBD7`, Caramel Essence `#E3AF64`, Sapphire Dust `#516AC8`, Blue Oblivion
  `#26428B`, Cosmic Odyssey `#0F1939`. Sayfa zemini soğuk porselen `#F4F6FB`;
  birincil buton Blue Oblivion, metin Cosmic Odyssey, vurgular Caramel.
  Fontlar kitap fontları: başlıklar ve logo **EB Garamond**, gövde ve okuma
  metni **Literata** (ekran için tasarlanmış kitap fontu). Logo şimdilik
  EB Garamond ile "Booktion" + karamel bir eşkenar dörtgen nokta
  (`components/Wordmark.tsx`). Token'lar `app/globals.css` içinde; karanlık mod
  lacivert zemin + karamel vurgu.
- **Bölüm ağacı → Düğüm grafiği.** `ChapterTree.tsx` artık iç içe liste değil,
  gerçek bir git-ağacı gibi kutular ve bağlantı eğrileriyle çiziliyor (basit bir
  "leaf'e sıra ver, üst düğüm çocuklarının ortalaması" yerleşim algoritması).
  Ürünün "dallanma" vaadini en net gösteren seçenek. Çok dallı kitaplarda
  yatay scroll gerekiyor — bilerek kabul edildi.
- **Yazma akışı → Tür seç, anında yaz.** "Yeni yazı" (`/yaz`) önce yazı türünü
  sorar; bir türe tıklanınca (`components/NewBookButton.tsx`) form olmadan
  o türün "Başlıksız …" gizli yazısı oluşur ve editöre düşülür. Başlık,
  açıklama ve görünürlük (`components/BookTitleEditor.tsx`) editörün üstünde
  satır içi düzenlenir — zorunlu bir ilk adım olarak değil.
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

### Yazı Türleri

Her yazının bir türü var (`books.kind`, `convex/writingKinds.ts`); arayüzdeki
etiketler, şablonlar ve başlıklar `lib/writingKinds.ts` içinde.

- [x] 8 tür: Kitap, Öykü, Şiir, Deneme, Köşe yazısı, Röportaj, Journal, Günlük
- [x] Türe özel yazma deneyimi: köşe yazısı "Spot:" satırıyla, röportaj
      "Konuk / S / C" şablonuyla, journal üç soruyla açılır; günlük ve journal
      sayfaları başlığını bugünün tarihinden alır
- [x] Türe göre dil: "Bölüm / Şiir / Yazı / Röportaj / Sayfa", "Hikâye
      haritası / Şiirler ve nazireler / Yazılar / Sayfalar"
- [x] Dal kuralı backend'de: kitap, öykü ve şiir okurlara açık (şiirde dal =
      **nazire**); deneme, köşe yazısı, röportaj, journal ve günlükte yalnızca
      yazar ekleme yapabilir
- [x] Keşfet sayfasında türe göre filtre (`by_visibility_and_kind` index'i)
- [x] Eski kayıtlar için backfill: `npx convex run migrations:backfillBookKinds`
      (türü olmayan kitapları "book" yapar; deploy'dan sonra bir kez çalıştırılmalı)

### Landing Page

- [x] `/` artık tanıtım sayfası (giriş yapmış kullanıcı `/kesfet`'e
      yönlenir). Rakip araştırmasına göre (Ulysses, Novlr, bibisco, Sudowrite,
      Novelcrafter, Dabble, Reedsy, Wattpad, Substack): gerçek ürün arayüzü
      gösteren hero, yazı türleri ızgarası, Ulysses tarzı "… için" kullanım
      blokları (köşe yazarı/muhabir, günlük/journal), kurmaca/dallanma bölümü,
      okurlar, fiyatlar (Premium "Yakında"), SSS
- [ ] Gerçek kullanıcı yorumları ve sayılar (henüz yok — uydurulmadı)
- [ ] Premium içeriği ve fiyatı netleşecek (sayfadaki Premium maddeleri öneri)

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

## Version 2

Şimdilik kodlanmayacak; v2'de ele alınacak:

- [ ] **Kapak tasarım aracı** — kitaplar için platform içinde kapak tasarlama
- [ ] **Kolay editörlük bölümleri** — kitaplar için editör/redaktör iş akışı
      (düzeltme önerileri, editör notları, onay)
- [ ] **Kolay basım** — kitabı baskıya hazır hale getirme ve basım siparişi
- [ ] **Reklam / tanıtım** — yazarların kitaplarını platformda öne çıkarması
- [ ] **Okurlarla söyleşi** — yazar ile okurların canlı ya da yazılı soru-cevap
      buluşmaları

## Test Altyapısı

- [x] `convex/*.test.ts` — `convex-test` + Vitest ile 42 test (yazı türleri,
      tür filtresi, köşe yazısı/şiir dal kuralları ve backfill dahil): kitap/bölüm
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
