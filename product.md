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

### Evren (karakterler, yerler ve fazlası)

Yazarın dünyasındaki her adın kendi sayfası. Tek tablo (`entities`), türler
`convex/entityKinds.ts` içinde tanımlı; form bu tanımdan çizilir, sunucu da
aynı tanımla doğrular. Yeni bir tür ya da alan eklemek = o dosyaya bir satır.

- [x] **Sekiz tür**: Karakter, Mekan, Ülke / krallık, Irk / halk, Topluluk
      (lonca, tarikat, ordu…), Yapı, Silah, Eşya. Her türün kendi bölümleri
      ve alanları var.
- [x] **Karakter**: yaş *ya da* doğum yılı (yazar hangisini biliyorsa),
      cinsiyet, unvan, meslek; **baba ve anne** (kardeşler, çocuklar ve
      büyükanne-büyükbabalar bunlardan kendiliğinden çıkar); eş; ırk,
      ülke/krallık, topluluk, yaşadığı yer; tıklayınca açılan **fiziksel
      özellikler** (boy, kilo, yapı, göz, saç, ten, ayırt edici işaret);
      kişilik, ne istiyor, geçmiş.
- [x] **Ülke**: yönetim şekli (öneriler: krallık, imparatorluk, sultanlık,
      cumhuriyet… ya da serbest), hükümdar, başkent, nüfus, kuruluş, dil,
      inanç, **harita yükleme**, yaşayan ırklar, müttefik/düşman ülkeler,
      amacı ve tarihi. Yapıda plan, mekanda harita alanı var.
- [x] **Bağlantılar**: bir alan başka bir kayda bağlanır ("Babası → Aras",
      "Irkı → Elf"). Seçici yazarken arar; yoksa "“Elf” adında yeni ırk"
      ile yerinde oluşturur. Karşı tarafta ters adla görünür (ülkede
      "Halkından", karakterde "Silahları").
- [x] **Görseller**: birden fazla görsel, sürükle-bırak; ilki kapak,
      "Kapak yap" ile değişir. Alan görselleri (harita, plan) ayrı tutulur.
- [x] **Kendi alanların**: her kayda yazarın istediği kadar serbest alan.
- [x] **Otomatik kayıt**: yazmayı bırakınca kaydedilir, "Kaydedildi" işareti.
- [x] **Sayfalar**: `/evren` (tür sekmeleri, arama, kapaklı kartlar,
      "Yeni ekle"), `/evren/[id]` (düzenleme), `/kitap/[id]/evren/[id]`
      (okur görünümü: yalnızca doldurulan alanlar, yalnızca o yazıya dahil
      kayıtlara bağlantılar). `/karakterler` ve `/mekanlar` buraya yönlenir.
- [x] **Yazarken**: seçim araç çubuğunda Karakter, Mekan ve "···" (diğer
      türler); üst çubukta **Evren** çekmecesi — yazının kayıtları, yeni
      ekleme, evrenden başka bir kaydı bu yazıya ekleme ve kaydı metinden
      ayrılmadan doldurma.
- [x] Vurgu: karakterler karamel düz, yerler (mekan/ülke/yapı) safir noktalı,
      diğerleri safir kesikli altı çizgi.
- [x] Gizlilik: kayıtlar yaratıcısına ait; okur ancak kaydın dahil olduğu,
      görebildiği bir yazı üzerinden görür. Yalnızca kendi kayıtların
      bağlanabilir. Silince görseller, bağlantılar, favoriler ve yazı
      bağları temizlenir.

### Renk temaları

- [x] Dokuz tema: **Booktion** (varsayılan, sistemin açık/koyu ayarına uyar),
      **Çilek**, **Kurbağa**, **At**, **Gökyüzü**, **Karanlık**, **Gül**,
      **Ateş** (koyu) ve **PEMBİK**. Paletler `app/globals.css` içinde
      `[data-theme]` ile, adlar ve çizimler `lib/themes.ts` ve
      `components/ThemeIcons.tsx` içinde.
- [x] Her temanın kendi çizimi (çilek, kurbağa, at başı, bulutlu güneş, hilal,
      gül, alev, kalp); seçici bu çizimleri temanın kendi renginde gösterir.
- [x] Seçici üst çubukta (düğme o anki temanın çizimini taşır), yazma
      ekranında ve Hesap sayfasında. Seçim bu cihazda saklanır ve hesaba
      yazılır (`users.setTheme`); başka cihazda giriş yapınca gelir.
- [x] Sayfa açılırken tema `<head>` içindeki küçük betikle boyanmadan önce
      uygulanır, varsayılan tema bir an bile görünmez. `dark:` stilleri
      koyu temalarda da çalışır (`data-scheme`).

### Okuma ve yazma hedefleri

- [x] Günlük **yazma hedefi** (kelime; 250 / 500 / 1.000 / 2.000 ya da
      serbest) ve günlük **okuma hedefi** (dakika; 10 / 20 / 30 / 60 ya da
      serbest). İkisi de kaldırılabilir.
- [x] Yazılan kelime, bölüm kaydedildikçe sayılır (net: silinen kelime düşer);
      hangi yazıda olursa olsun bölümü yazan kişiye yazılır.
- [x] Okuma süresi, bölüm okuma sayfasında okur sekmeyi açık tutup sayfayla
      ilgilendikçe (kaydırma, fare, klavye) yarım dakikada bir sayılır;
      90 saniye hareketsizlikte durur. İki sekmeden gelen çift sayım atılır.
- [x] Gün yazarın kendi saat dilimine göre (`users.tzOffset`, cihazdan
      gelir); gece yarısı onun gece yarısıdır.
- [x] Yazılarım'da hedef kartı: bugünün halkası, "3 günlük seri", son yedi
      günün çubukları ve hedef çizgisi. Yazma ekranının üst çubuğunda küçük
      halka ("320/500"), okuma sayfasında "Bugün 12/20 dk". Hedef o sayfa
      açıkken tamamlanırsa bir kere kutlama bildirimi çıkar.

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
- [x] Favori evren kayıtları (karakter, ülke…)
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

### Yazma akışı

- [x] **Yazılarım = masa** (`books.myDesk`): en son çalışılan yazı en üstte
      büyük "Kaldığın yerden devam et" kartında (son bölüm, taslak mı, bölüm ve
      kelime sayısı, "2 saat önce düzenlendi", Devam et → doğrudan o bölümün
      editörü); diğerleri altta. Selamlama ve toplam kelime. Sayılar
      `books.wordCount/chapterCount/lastEditedAt` alanlarında, yalnızca sahibin
      kendi bölümleriyle güncellenir (`convex/desk.ts`); eski kayıtlar için
      `npx convex run migrations:backfillDeskStats`
- [x] **Okurken sayfa çevirme**: bölüm sonunda "← Önceki" ve ana hattı izleyen
      "Sonraki →" kartları, ← → tuşlarıyla da; ana hattın dışındakiler "Buradan
      ayrılan başka dallar" olarak ayrı
- [x] **Gizli yazıda yayınlama**: "Yayınla"ya basınca "Yazın şu an gizli"
      sorulur — "Bağlantıyla aç ve yayınla" ya da "Gizli kalsın, yine de
      yayınla"; yazı başına "bir daha sorma"
- [ ] Bölüm sıralaması: ağaçta sıra yalnızca aynı yerden ayrılan dallar
      arasında anlamlı; şimdilik "ana hat yap" yeterli

### Güven

- [x] **Hesap kurtarma = ikinci cihaz** (`/hesap`): giriş anahtarlarının
      listesi, adlandırma, kaldırma (son anahtar kaldırılamaz) ve "Cihaz ya da
      anahtar ekle" (telefon QR ile eklenir). @convex-dev/auth'un kendi passkey
      yönetimi kullanılıyor (`convex/auth.ts`). Tek cihazı olan yazara
      Yazılarım'da "Hesabını güvenceye al" hatırlatması (7 gün ertelenebilir).
      Kurtarma kodu bilinçli olarak yok: kütüphane, uygulama kodunun kendi
      başına oturum açmasını yasaklıyor; e-posta ile kurtarma ileride
      `email-magic-link` yöntemiyle eklenebilir
- [x] **Sürüm geçmişi** (`convex/versions.ts`, yazma ekranında "Geçmiş"):
      metin değişmeden önceki hali saklanır — en fazla 10 dakikada bir, her
      yayında mutlaka; bölüm başına son 50 sürüm. Önizle → "Bu sürüme dön"
      editörü doldurur, hiçbir şey kaydedilmeden üzerine yazılmaz. Yalnızca
      yazarı görür; bölüm silinince sürümleri de silinir
- [x] **Dışa aktarma** (yazı sayfasında "Dışa aktar", yalnızca sahibi):
      Word (.docx, `docx` paketi), PDF (`/kitap/<id>/yazdir` kitap gibi baskı
      sayfası → "PDF olarak kaydet"), Markdown; isteğe bağlı dallar dahil. Yazar
      notları bu dosyalara girmez
- [x] **Tam yedek** (`/hesap`): bütün yazılar, tüm dallar, taslaklar ve
      notlar (dipnot olarak) ayrı Markdown dosyaları hâlinde tek ZIP

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
