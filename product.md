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
- **Yazma akışı → Tür seç, anında yaz.** "Yeni yazı" (`/new`) önce yazı türünü
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
- [x] Var olan bir bölümü düzenleme — `/edit` ekranı, sadece yazarı girebiliyor
- [x] Otomatik kayıt (`components/ChapterForm.tsx`): yazmaya başlanınca 1,5 sn
      sonra taslak sunucuya kaydedilir, adres `/edit`'ye döner (yenilemek
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

- [x] `/` artık tanıtım sayfası (giriş yapmış kullanıcı `/my-writing`'e
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
- [x] **@ ile anma** (`components/entity/MentionText.tsx`, `lib/mentions.ts`):
      kişilik, geçmiş gibi uzun alanlarda `@` yazınca imlecin altında
      evrendeki kayıtlar çıkar (önce karakterler); yoksa "yeni karakter"
      olarak yerinde oluşturulur. Anılan ad alanın içinde renkli görünür,
      altında tıklanabilir çip olarak durur. Kimlikle saklanır
      (`@[id|Ad]`), ad değişince anma da yeni adı gösterir. Okur sayfasında
      o yazıya dahil kayıtlar link olur, diğerleri düz ad kalır.
- [x] **Kendi alanların**: her kayda yazarın istediği kadar serbest alan.
- [x] **Otomatik kayıt**: yazmayı bırakınca kaydedilir, "Kaydedildi" işareti.
- [x] **Sayfalar**: `/world` (tür sekmeleri, arama, kapaklı kartlar,
      "Yeni ekle"), `/world/[id]` (düzenleme), `/book/[id]/world/[id]`
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

- [x] **Zaman çizelgesi** (`/world/timeline`, `convex/events.ts`): olaylar
      yıl (sayı, eksi olabilir) ve kendi takvimindeki tarih etiketiyle; kimler
      katıldı (Evren kayıtları), hangi yazı ve bölümde anlatıldığı. Yıla göre
      dikey çizelge, aynı yıl içinde ↑↓ ile sıra, yazıya göre süzme. Doğum
      yılı girilen karakterlerin o olaydaki yaşı kendiliğinden yazılır.
      Karakter sayfasında "Zaman çizelgesinde" listesi. Yalnızca yazarına özel
- [x] **Soy ağacı** (`convex/family.ts`, `components/entity/FamilyTree.tsx`):
      karakter sayfasında Babası/Annesi/Eşi bağlantılarından üç kuşak yukarı
      ve aşağı; eşler yan yana, çocuklar ebeveynlerinin altında, çizgilerle.
      Okur görünümünde yalnızca o yazıya dahil kişiler

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

### Yazma ekranı: sayfa, panolar, modlar

- [x] **Sayfa görünümü** (üst çubukta "Sayfa"): Serbest ya da A5, B5, A4, B4,
      A3, B3. Metin gerçek kâğıt ölçüsünde, o boyuta uygun kenar boşluğu ve
      yazı boyuyla sayfalara dizilir; bir satır sığmazsa sonraki sayfaya
      geçer, paragraf sayfa sonunda bölünür. Ekrandaki bir sayfa = basılı bir
      sayfa (ölçümle doğrulandı, ±1 px). Sığmayan boyutlar ekrana orantılı
      küçültülür. Sayfa sayısı çubukta görünür. Seçim cihazda saklanır.
      (`lib/paper.ts`, `Pagination` eklentisi + `usePagination`.)
- [x] **Kenar panoları**: sayfanın solunda ve sağında, yer varsa açılır.
      Not, yapılacaklar listesi, evrenden bir kayıt (görsel, özet, birkaç
      bilgiyle; tıklayınca Evren çekmecesinde açılır) ve görsel eklenebilir.
      Kartlar yukarı/aşağı ve öbür panoya taşınır. Her yazarın her yazı için
      kendi panoları, yalnızca kendisi görür (`convex/boards.ts`).
      "Panoları gizle" ile kapanır.
- [x] **Yazma modu** (üst çubukta "Mod"): **Daktilo** — yazılan satır
      ekranda hep aynı yükseklikte kalır, metin yukarı akar; **Odak** —
      üzerinde çalışılan paragraf dışındakiler soluklaşır.
- [x] **Yazma sesleri**: Sessiz (varsayılan), Daktilo (Enter'da zil),
      Mekanik klavye (Brown), Tıkırtılı mekanik (Blue), Yumuşak tuş, Kalem;
      ses düzeyi ayarlanır. Gerçek, açık lisanslı kayıtlar (CC0 ve MIT,
      `public/sounds/typing/CREDITS.txt`); her ses tek küçük dosya, seçilince
      yüklenir. Her vuruş rastgele bir kayıttan, perde ve seviye biraz
      değişerek çalar (`lib/typingSounds.ts`).
- [x] **Yazının dili** (`books.language`, yazı ayarlarında Türkçe | English):
      yeni yazıda arayüz dili; eski yazılarda boşsa arayüz dili geçer.
      Editöre `lang` olarak da verilir.
- [x] **Kelime tamamlama** (`lib/completion.ts`, `WordCompletion` eklentisi;
      Mod menüsünde aç/kapa, varsayılan açık, dokunmatik ekranda kapalı):
      yazılan kelimenin devamı imlecin önünde soluk görünür, Tab (satır
      sonunda → da) ile alınır, Esc ile kapanır. Önce yazarın kendi
      kelimeleri: Evren'deki adlar, sonra metinde en az iki kez geçen
      5+ harfli kelimeler; sonra yazının dilinin listesi
      (`public/words/tr.txt`, `en.txt`: FrequencyWords/OpenSubtitles,
      CC BY-SA 4.0, 4+ harfli ilk 40 bin kelime, küfür ve hakaretler
      çıkarıldı). En az 3 harf yazılınca ve en az 2 harf eklenecekse
      önerir; Türkçe I/ı, İ/i doğru. Hiçbir şey sunucuya gitmez. İlk
      kabul edilene kadar önerinin yanında küçük "Tab" ipucu çıkar
- [x] **Yazım denetimi** (`lib/spellExtension.ts`, `lib/spell.worker.ts`,
      `components/SpellMenu.tsx`; Mod menüsünde aç/kapa, varsayılan açık,
      dokunmatikte kapalı): sözlükte olmayan kelimenin altı dalgalı çizilir,
      tıklayınca öneriler, "Sözlüğüme ekle", "Bu yazıda yoksay". nspell (MIT)
      Web Worker'da; sözlükler `public/dict` (Türkçe: Harun Reşit Zafer, MIT;
      İngilizce: SCOWL, MIT/BSD). Yazılan kelime, Evren adları, büyük harfli
      kısaltmalar ve kelime listesindeki sık kelimeler işaretlenmez (yanlış
      alarmı azaltır). Tarayıcının kendi denetimi bu sırada kapalı. Türkçe
      sözlük ~2 MB (sıkıştırılmış), ilk açılışta bir kez iner
- [x] **Yazma sprinti** (`components/WritingSprint.tsx`, üst çubukta saat
      simgesi): 10/15/25/45 dk, isteğe bağlı kelime hedefi; çubukta geri sayım
      ve "+213/500"; bitince kaç kelime yazıldığı, dakika başına kelimede
      cihazdaki rekor kırıldıysa "Yeni rekor"
- [x] Akış kontrolünden düzeltmeler: boş masada önce "ilk yazın" kartı
      (hedef kartı yazı olunca çıkar); adsız yazıda çubukta "Ad ver"; kapak
      ve görsel yükleme düğmesi tasarıma uygun; dar ekranda çubuk etiketleri
      simgeye iner.

### Dil: İngilizce ve Türkçe

- [x] Varsayılan dil **İngilizce**; üst çubukta ve tanıtım sayfasında **TR | EN**
      düğmesi. Seçim çerezde saklanır (`booktion-dil`), sayfa başlığı ve
      `<html lang>` da değişir.
- [x] Metinler kodda Türkçe yazılır, `t("…")` ile geçer; İngilizceleri
      `lib/i18n/*.ts`. Sunucu bileşenleri `lib/serverI18n.ts`, istemci
      `useT`/`useI18n` kullanır. Sunucu hata mesajları gösterilirken çevrilir.
- [x] Türler (yazı türleri, Evren türlerinin alanları ve önerileri), temalar,
      kâğıt boyutları, sesler ve şablonlar da İngilizce. Sayılar, tarihler ve
      "2 saat önce" dile göre biçimlenir.
- [x] `lib/i18n.test.ts`: çevrilmemiş bir metin, sunucu hatası ya da tür
      etiketi kalırsa test kırılır.

### SEO ve paylaşım

- [x] Favicon, iPhone ikonu, manifest (ana ekrana ekleme), tema rengi.
- [x] Başlık, açıklama, canonical, schema.org verisi; WhatsApp/X/Telegram
      kartları (site kartı; paylaşılan yazı için yazının adı, türü, yazarı).
- [x] `sitemap.xml`, `robots.txt` (özel sayfalar kapalı, paylaşılan yazılar
      noindex), yapay zekâ asistanları için `llms.txt` ve `llms-full.txt`.

### Sosyal Yapı

> **Topluluk eşiği:** Platformda toplam 100 yazı olana kadar sosyal taraf
> gizli (`books.communityStatus`, `lib/community.ts`). O zamana kadar
> Keşfet, Kütüphanem, Moderasyon, beğeni, yorum, favori, bildirme, başkalarının
> dal açması ve okur seviyeleri görünmüyor; bir yazı yalnızca paylaşılan
> bağlantıyla (`/book/<id>`) okunuyor. Giriş yapan kullanıcı "Yazılarım"
> (`/my-writing`) sayfasına düşüyor. 100'e ulaşınca hepsi kendiliğinden açılıyor.
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
      `/moderation` ekranı: bildirimi çözüldü işaretleme, uygunsuz bir dalı
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
- [x] **Kendi yazını okumak**: masada "Oku" (yazıyı ilk bölümden, okurun
      gördüğü gibi açar), yazma ekranının üst çubuğunda "Oku" (bu bölümün okuma
      sayfası; taslaksa önce kaydeder, yayındaki metnin yayınlanmamış
      değişiklikleri cihazda bekler). Okuma sayfasında yazara "Taslak" ya da
      "Yazın gizli: bunu yalnızca sen görüyorsun" etiketi
- [x] **Okurken sayfa çevirme**: bölüm sonunda "← Önceki" ve ana hattı izleyen
      "Sonraki →" kartları, ← → tuşlarıyla da; ana hattın dışındakiler "Buradan
      ayrılan başka dallar" olarak ayrı
- [x] **Gizli yazıda yayınlama**: "Yayınla"ya basınca "Yazın şu an gizli"
      sorulur — "Bağlantıyla aç ve yayınla" ya da "Gizli kalsın, yine de
      yayınla"; yazı başına "bir daha sorma"
- [ ] Bölüm sıralaması: ağaçta sıra yalnızca aynı yerden ayrılan dallar
      arasında anlamlı; şimdilik "ana hat yap" yeterli

### Birlikte yazmak

- [x] **Ortak yazarlar** (`convex/members.ts`, `bookMembers`): yazının sahibi
      kullanıcı adıyla ekler (en fazla 20). Ortak yazar gizli yazıyı görür,
      bölüm yazar (ana hattın devamı ya da dal), mantar panoda plan yapar,
      değişiklik önerir; masasında "Birlikte yazdıkların". Ana hattı seçmek,
      başkasının bölümünü silmek ve dışa aktarma sahipte kalır. Ortak yazar
      ayrılabilir; erişim `convex/access.ts` içinde (`isMember`,
      `canWriteBook`, üye-farkında `viewableBook`)
- [x] **Değişiklik önerisi (pull request gibi)** (`convex/proposals.ts`,
      `components/Proposals.tsx`, `/book/…/chapter/…/propose`): ortak yazar
      yayındaki bir bölümün kendi halini ve bir not gönderir; bölümün yazarı ya
      da yazının sahibi farkı kelime kelime görür (`lib/diff.ts`, +/− sayısı),
      "Birleştir" ya da "Kapat". Birleştirmeden önceki metin sürüm geçmişinde
      kalır; bölüm öneriden sonra değiştiyse uyarır. Yazı sayfasında sahibine
      "N açık öneri"
- [x] **Mantar pano** (`/book/…/board`, `convex/planCards.ts`): sahne/bölüm
      kartları; başlık, kısa özet, renk (iğneyle), durum (Fikir / Yazılıyor /
      Gözden geçir / Bitti), bağlı bölüm. Sürükle-bırakla sıralanır;
      "Bölümlerden kart oluştur" ana hattaki bölümlere kart açar. Sahip ve
      ortak yazarlar birlikte kullanır
- [x] Dallar ve ana hat zaten vardı: herkesin kendi dalı, sahibinin seçtiği
      ana hat ("ana hat yap"), sürüm geçmişi

### Okuma ve dışa aktarma (ek)

- [x] **Sesli okuma** (`components/ReadAloud.tsx`, okuma sayfasında "Sesli
      oku"): tarayıcının sesiyle, yazının dilinde; okunan paragraf işaretlenir,
      tıklanan paragraftan devam eder; duraklat, önceki/sonraki, hız
      0.8–1.5×. Uzun cümleler parçalanır (bazı sesler uzun metinde susuyor)
- [x] **EPUB** (`lib/epub.ts`, "Dışa aktar"da "E-kitap (EPUB)"): EPUB 3 (+
      EPUB 2 içindekiler), kapak, başlık sayfası (yazar adıyla), bölüm başına
      dosya; yazar notları girmez. Kindle'a "Send to Kindle" ile

### Güven

- [ ] **Şifre kurtarma (e-posta)** — hazırlık: Convex Auth'un
      `email-password` yöntemi (aynı `authPassword` bileşeni) e-posta
      doğrulama ve 10 dakikalık sıfırlama bağlantısı sağlıyor; e-postayı
      yalnızca **Resend** ile gönderiyor (`@convex-dev/resend` bileşeni).
      Kullanıcı adıyla açılmış hesap da Hesap sayfasında e-posta ekleyebilir
      (`startChangeEmail` oturum + mevcut şifreyle çalışır), sonra "Şifremi
      unuttum" → `startPasswordRecovery` → `/reset-password` sayfası →
      `completePasswordRecovery`. Gerekenler: (1) Resend hesabı, (2)
      booktions.com'u Resend'de doğrulama (DNS kayıtları), (3)
      `npx convex env set RESEND_API_KEY …` ve `SITE_URL` (dev ve prod),
      (4) `authEmail` ve `resend` bileşenlerini bağlamak, Hesap ve giriş
      sayfalarına akışı eklemek

- [x] **Kullanıcı adı + şifre ile giriş** (`convex/auth.ts`,
      @convex-dev/auth `username-password` yöntemi). `/sign-in`'de "Giriş yap" /
      "Hesap aç" sekmeleri; yeni şifre en az 10 karakter ve çok yaygın şifreler
      reddedilir. `/account`'ta şifre değiştirme (diğer cihazlardaki oturumları
      kapatma seçeneğiyle). Passkey ve cihaz/anahtar yönetimi kaldırıldı.
      E-posta ile şifre sıfırlama yok; ileride `email-password` yöntemiyle
      eklenebilir
- [x] **İngilizce adresler**: `/book/…/chapter/…/write`, `/world`,
      `/my-writing`, `/sign-in`… Eski Türkçe adresler (`/kitap`, `/evren`,
      `/giris`…) `next.config.ts` içinde kalıcı yönlendirmeyle yenisine gider
- [x] **Sürüm geçmişi** (`convex/versions.ts`, yazma ekranında "Geçmiş"):
      metin değişmeden önceki hali saklanır — en fazla 10 dakikada bir, her
      yayında mutlaka; bölüm başına son 50 sürüm. Önizle → "Bu sürüme dön"
      editörü doldurur, hiçbir şey kaydedilmeden üzerine yazılmaz. Yalnızca
      yazarı görür; bölüm silinince sürümleri de silinir
- [x] **Dışa aktarma** (yazı sayfasında "Dışa aktar", yalnızca sahibi):
      Word (.docx, `docx` paketi), PDF (`/book/<id>/print` kitap gibi baskı
      sayfası → "PDF olarak kaydet"), Markdown; isteğe bağlı dallar dahil. Yazar
      notları bu dosyalara girmez
- [x] **Tam yedek** (`/account`): bütün yazılar, tüm dallar, taslaklar ve
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
      ilerlemesi + seviye hesaplama, moderasyon. Testler girişi `@convex-dev/auth`'un
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
      giriş (`/sign-in`), Keşfet ve paylaşılan okuma bağlantılarını
      (`/book/<id>`, `/book/<id>/chapter/<id>`) açabilir; geri kalan her sayfa
      sunucuda `/sign-in?next=…`'e yönlenir. Oturum kontrolü Convex'e sorulur
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
