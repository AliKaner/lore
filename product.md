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
- [x] Otomatik kayıt (`components/ChapterForm.tsx`): yazmaya başlanınca 1,5 sn
      sonra taslak sunucuya kaydedilir, adres `/duzenle`'ye döner (yenilemek
      taslağı açar). Kaydedilmemiş metin ayrıca cihazda (localStorage) tutulur;
      geri gelince "Geri yükle / Yok say" sorulur. Sekmeyi kapatırken uyarı,
      Ctrl/Cmd+S ile kaydetme. Yayındaki bir metin otomatik değişmez —
      "Güncelle"ye basılana kadar cihazda bekler.
- [x] Kelime sayacı editörün altında, kayıt durumunun yanında
- [x] **Yazma ekranı** (Medium / Wattpad / Apple Pages örneğiyle,
      `components/ChapterForm.tsx`): site menüsü yok, kâğıt renginde geniş tek
      sütun, büyük Garamond başlık (Enter metne geçer), kutusuz metin alanı,
      "Yazmaya başla…" yer tutucusu. Üstte ince bir çubuk: geri, tür · yazı
      adı, kayıt durumu (nokta + kısa yazı, ayrıntısı üzerine gelince), kelime
      sayısı, Notlar çekmecesi, yazı ayarları (ad, açıklama, gizli/açık) ve
      Yayınla/Güncelle. Yazarken çubuk solar, fare oynayınca geri gelir.
      Markdown kısayolları: `##` ara başlık, `>` alıntı, `-` liste
- [x] **Seçim araç çubuğu** (`components/SelectionMenu.tsx`): metni seçince
      üstünde, sağ tıklayınca imlecin yanında açılan animasyonlu lacivert
      çubuk — kalın, italik, ara başlık, alıntı, Not, Karakter, Mekan; sağ
      tıklanan kelime kendiliğinden seçilir, "Cümle" seçimi cümleye genişletir.
      Not ve ad formları çubuğun içinde açılır (Enter kaydeder, Esc geri),
      bu sırada seçili metin vurgulu kalır; kayıtlı bir adda "Selin Aras ·
      karakter" etiketi görünür. Shift+sağ tık tarayıcının kendi menüsünü açar.
      4+ harfli adlar Türkçe ekleriyle de yakalanır ("İskele" → "iskelenin")
- [x] **Yazar notları** (`authorNote` işareti, `lib/editorExtensions.ts`): metinde
      bir yeri seçip not eklenir; editörde fosforlu kalem gibi görünür, altta
      "Bu bölümdeki notların" listesi (tıklayınca o yere gider). Notlar yalnızca
      yazara gider — sunucu başkasına dönen metinden siler (`withoutAuthorNotes`)
- [x] **Karakter ve mekan adlarının vurgulanması**: yazıya dahil edilen
      karakterler düz karamel, mekanlar noktalı safir altı çizgiyle; üzerine
      gelince tam ad ve açıklama. Karakterin yalnızca ilk adı da yakalanır
      ("Selin Aras" → "Selin"). Kitap sahibi metinde bir adı seçip
      "+ Karakter" / "+ Mekan" ile anında ekleyebilir
- [x] Silme (`components/DeleteButton.tsx`, iki adımlı onay): yazı (tüm
      bölümleriyle), bölüm (yalnızca devamı yoksa; ana hatsa sıradaki kardeşe
      geçer), karakter ve mekan (dahil olduğu yazılardan çıkar). Beğeni, yorum,
      okuma kaydı, favori ve bağlantılar `convex/cleanup.ts` ile partiler hâlinde
      temizlenir; kapak/görsel dosyası da silinir
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

- [x] `/` artık tanıtım sayfası (giriş yapmış kullanıcı `/yazilarim`'e
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

> **Topluluk eşiği:** Platformda toplam 100 yazı olana kadar sosyal taraf
> gizli (`books.communityStatus`, `lib/community.ts`). O zamana kadar
> Keşfet, Kütüphanem, Moderasyon, beğeni, yorum, favori, bildirme, başkalarının
> dal açması ve okur seviyeleri görünmüyor; bir yazı yalnızca paylaşılan
> bağlantıyla (`/kitap/<id>`) okunuyor. Giriş yapan kullanıcı "Yazılarım"
> (`/yazilarim`) sayfasına düşüyor. 100'e ulaşınca hepsi kendiliğinden açılıyor.
> Gizleme yalnızca arayüzde; backend fonksiyonları aynı. Eşiğe yalnızca en az
> bir bölümü olan yazılar sayılır (`by_root_chapter` index'i) — tür seçince
> açılan boş "Başlıksız" yazılar sayılmaz.
>
> **Gizlilik:** Gizli bir yazının bölümleri, ağacı, karakter/mekan listesi ve
> yorumları yalnızca sahibine görünür (`convex/access.ts`); bölüm id'sini
> bilmek yetmez. Yazı sonradan gizliye çekilirse dal yazarı yalnızca kendi
> bölümünü görmeye devam eder.

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

- [x] **Okuma modu** (bölüm sayfası): Normal / **Biyonik** (kelimelerin ilk
      yarısı kalın) ve **Akış** — `components/SpeedReader.tsx`, kelimeler
      ekranın ortasında tek tek akar (RSVP), odak harfi karamel; 100–900
      kelime/dk, noktalamada ve paragraf sonunda nefes payı. Klavye: boşluk,
      ← →, ↑ ↓, Esc. Karakter/mekan vurgusu açılıp kapanabilir; tercihler
      cihazda hatırlanır (`lib/readingPrefs.ts`). Kelime sayısı ve tahmini
      okuma süresi gösterilir

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

- [x] `convex/*.test.ts` — `convex-test` + Vitest ile 53 test (gizli yazı erişimi, silme/temizlik
      ve yazar notlarının okurdan gizlenmesi dahil) (yazı türleri,
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
- [x] Giriş duvarı (`proxy.ts`): girişsiz ziyaretçi yalnızca landing (`/`),
      giriş (`/giris`), Keşfet ve paylaşılan okuma bağlantılarını
      (`/kitap/<id>`, `/kitap/<id>/bolum/<id>`) açabilir; geri kalan her sayfa
      sunucuda `/giris?next=…`'e yönlenir. Oturum kontrolü Convex'e sorulur
      (`api.auth.isAuthenticated`). Girişsizken üst menüde yalnızca logo (→ `/`)
      ve "Giriş yap" görünür; çıkış yapınca landing'e dönülür
- [x] Boş durumlar (`components/EmptyState.tsx`): giriş gereken sayfalar,
      bulunamayan yazı/bölüm/yazar, yetkisiz düzenleme, ilk yazı ve boş
      karakter/mekan listeleri artık tek satır gri yazı değil; ortalanmış bir
      kart, küçük bir hikâye-dalı çizimi, açıklama ve bir sonraki adım. Giriş
      sonrası kullanıcı geldiği sayfaya döner (`?next=`, `lib/safeNext.ts` ile
      yalnızca site içi adresler). Bozuk bir bağlantı `app/error.tsx` ile
      "bulunamadı" kartına düşer, sayfa çökmez; `app/not-found.tsx` 404 için
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
