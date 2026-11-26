import type { Entry } from "@/lib/translate";

const plural = (one: string, many: string) => (v: Record<string, string | number>) =>
  (String(v.n) === "1" ? one : many).replace("{n}", String(v.n));

// The landing page (app/page.tsx).
export const LANDING: Record<string, Entry> = {
  // Story map and product window
  "Bölüm {n}": "Chapter {n}",
  "Ana hat": "Main line",
  "Okur dalları": "Reader branches",
  "Sis": "Fog",
  "Fener": "Lighthouse",
  "Dönüş": "Return",
  "Kayıp Tekne": "The Lost Boat",
  "Fırtına": "Storm",
  "Mektup": "The Letter",
  "Ada": "Island",
  "Booktion arayüzü: solda bir kitabın dallanan bölüm haritası, sağda bir okurun açtığı 'Kayıp Tekne' dalının okuma ekranı":
    "The Booktion interface: on the left, a book's branching chapter map; on the right, the reading view of 'The Lost Boat', a branch opened by a reader",
  "Hikâye haritası": "Story map",
  "Karakterler": "Characters",
  "Mekânlar": "Places",
  "Bölüm 2'den ayrılan dal": "A branch from chapter 2",
  "12 dk okuma": "12 min read",
  "Fenerin ışığı üçüncü kez döndüğünde Selin iskelede bağlı teknenin gitmiş olduğunu fark etti. Halat, sanki biri onu acele etmeden, düğümü düğüm üstüne çözerek bırakmış gibi suda yüzüyordu.":
    "When the lighthouse beam swept round for the third time, Selin saw that the boat tied at the pier was gone. The rope floated on the water as if someone had let it go without hurry, untying it knot by knot.",
  "Babası bu limandan hiçbir teknenin habersiz çıkmadığını söylerdi.":
    "Her father used to say no boat ever left this harbour unannounced.",
  "248 beğeni": "248 likes",
  "31 yorum": "31 comments",
  "Bu bölümden dal aç": "Branch from this chapter",
  "Bağlantıyla paylaşıldı": "Shared by link",
  "Devam bölümü yaz": "Write the next chapter",
  // Editor mock
  "Bölüm editörü: başlık satır içinde düzenleniyor, kitap gizli ve taslak durumda":
    "The chapter editor: the title is edited inline, the book is private and in draft",
  "Gizli · yalnızca sen": "Private · only you",
  "Başlıksız hikâye": "Untitled story",
  "Liman o sabah sisin altında kaybolmuştu. Selin fenerin merdivenlerini sayarak çıktı; yüz on iki basamak, her zamanki gibi.":
    "That morning the harbour had vanished under the fog. Selin climbed the lighthouse stairs counting them; a hundred and twelve steps, as always.",
  // Main line mock
  "Sen": "You",
  "Bölüm 3'ün üç dalı listeleniyor; biri ana hat olarak işaretli, diğerleri için ana hat yapma ve gizleme seçenekleri var":
    "Three branches of chapter 3; one is marked as the main line, the others can be made the main line or hidden",
  "Bölüm 2 · Fener — devam eden dallar": "Chapter 2 · Lighthouse — branches that follow",
  "Ana hat yap": "Make main line",
  "Gizle": "Hide",
  // Packages mock
  "Kaptan Rıza": "Captain Rıza",
  "Mekân": "Place",
  "Karakter ve mekân kartları; her biri birden fazla kitapta kullanılıyor ve yeni bir kitaba eklenebiliyor":
    "Character and place cards; each is used in several books and can be added to a new one",
  "{n} kitapta": plural("in {n} book", "in {n} books"),
  "+ Kitaba ekle": "+ Add to a book",
  // Reader mock
  "Okur paneli: seviye ilerlemesi ve bir bölümün altındaki yorumlar":
    "The reader panel: level progress and the comments under a chapter",
  "Hikaye Avcısı unvanına 2 seviye": "2 levels to Story Hunter",
  "Bölüm 3 · Kayıp Tekne — yorumlar": "Chapter 3 · The Lost Boat — comments",
  "Teknenin kimin elinde olduğunu ben yazacağım, bekleyin.": "I'm going to write who has the boat. Just wait.",
  "Fırtına dalından buraya bağlansa çok iyi olur.": "It'd be great if the Storm branch led here.",
  // Interview mock
  "Röportaj şablonu: en üstte konuk bilgisi, altında soru ve cevaplar":
    "The interview template: the guest at the top, questions and answers below",
  "Röportaj": "Interview",
  "“Liman şehirleri unutmaz”": "“Harbour towns never forget”",
  "Konuk:": "Guest:",
  "Nermin Ata, fener bekçisi, 64": "Nermin Ata, lighthouse keeper, 64",
  "S:": "Q:",
  "Kırk yıl aynı ışığı yakmak nasıl bir şey?": "What is it like to light the same lamp for forty years?",
  "C:": "A:",
  "Her gece başka bir gemi geçiyor. Işık aynı, deniz hiç aynı değil.":
    "Every night a different ship goes by. The light is the same; the sea never is.",
  // Journal mock
  "Journal sayfası: başlık olarak bugünün tarihi, üç soru ve yalnızca sen etiketi":
    "A journal page: today's date as the title, three questions and an only-you label",
  "Yalnızca sen": "Only you",
  "25 Kasım 2026 Çarşamba": "Wednesday 25 November 2026",
  "Bugün aklımı ne meşgul etti?": "What was on my mind today?",
  "Sabah sisi ve bitmeyen o cümle.": "The morning fog, and that sentence that won't end.",
  "Neye minnettarım?": "What am I grateful for?",
  "Annemin telefonu, sıcak çay.": "A call from my mother, hot tea.",
  "Yarın için tek bir niyet": "One intention for tomorrow",
  // Header
  "Booktion ana sayfa": "Booktion home",
  "Sayfa bölümleri": "Page sections",
  "Yazı türleri": "Kinds of writing",
  "Kurmaca": "Fiction",
  "Okurlar": "Readers",
  "Fiyatlar": "Pricing",
  "SSS": "FAQ",
  "Ücretsiz başla": "Start free",
  // Hero
  "Kitaptan günlüğe, her yazar için": "From novels to diaries, for every writer",
  "Her yazıya kendi": "A desk for",
  "masası.": "every kind of writing.",
  "Romanını, köşe yazını, röportajını ya da günlüğünü Booktion'da yaz. Her tür kendi şablonuyla, kendi düzeniyle gelir — kurmacada ise hikâyen dallanır.":
    "Write your novel, column, interview or diary on Booktion. Each kind comes with its own template and its own order — and in fiction, your story branches.",
  "Ücretsiz yazmaya başla": "Start writing for free",
  "Okumaya göz at": "Browse what to read",
  "Yazı türlerine bak": "See the kinds of writing",
  "Ücretsiz · Kredi kartı yok · Okumak her zaman ücretsiz": "Free · No credit card · Reading is always free",
  "Ana hat seçildi": "Main line chosen",
  "Bölüm 3 · Dönüş": "Chapter 3 · Return",
  // Kinds section
  "Sekiz tür, sekiz ayrı masa.": "Eight kinds, eight desks.",
  "Ne yazacağını seçtiğin an şablon, başlık, kimin görebileceği ve okurların neler yapabileceği ona göre ayarlanır. Ayar menüsü yok — doğrudan yazarsın.":
    "The moment you choose what to write, the template, the title, who can see it and what readers can do are set to match. No settings menu — you just write.",
  // Columns and journals
  "Köşe yazarları ve muhabirler için": "For columnists and reporters",
  "Röportajın": "Your interview opens with",
  "soru–cevapla": "questions and answers",
  ", köşe yazın spotla açılır.": ", your column with a standfirst.",
  "Röportaj, konuğu en üstte tanıtan soru–cevap şablonuyla başlar; köşe yazısı bir spot satırıyla. Bütün yazıların tek bir köşede, sırayla durur. Kimse izinsiz ekleme yapamaz — yazının sesi yalnızca senin.":
    "An interview starts from a question-and-answer template that introduces the guest at the top; a column starts with a standfirst. All your pieces sit in one column, in order. Nobody can add to them — the voice is yours alone.",
  "Günlük ve journal tutanlar için": "For diarists and journal keepers",
  "Her gün, kimsenin görmediği bir sayfa.": "Every day, a page nobody else sees.",
  "Yeni sayfa başlığını bugünün tarihinden alır. Journal üç soruyla açılır: seni ne meşgul etti, neye minnettarsın, yarın için tek bir niyet. İkisi de gizli başlar; paylaşmak tamamen senin kararın.":
    "A new page takes today's date as its title. The journal opens with three questions: what was on your mind, what you're grateful for, one intention for tomorrow. Both start private; sharing is entirely up to you.",
  // Fiction
  "Kitap, öykü ve şiir için": "For books, stories and poetry",
  "Kurmacada hikâye dallanır. Haritayı Booktion tutar.": "In fiction the story branches. Booktion keeps the map.",
  "Okur dalları, beğeniler ve yorumlar Booktion'da {n} yazı olduğunda açılacak. O zamana kadar dalları sen yazarsın, okurların paylaştığın bağlantıyla okur.":
    "Reader branches, likes and comments open once Booktion has {n} writings. Until then you write the branches and readers read through the link you share.",
  "Yazmak": "Writing",
  "Formu doldurma, doğrudan yaz.": "Skip the form, just write.",
  "Yeni kitap tek tıkla açılır ve seni editöre bırakır. Başlık, açıklama ve görünürlük satır içinde — istediğin an düzenlersin, zorunlu bir ilk adım olarak değil. Kitap sen açana kadar gizli kalır.":
    "A new book opens in one click and drops you in the editor. Title, description and visibility are inline — edit them whenever you like, not as a required first step. The book stays private until you open it.",
  "Resmî devamı": "The official continuation —",
  "sen": "you",
  "seçersin.": "choose it.",
  "Bir bölümden kaç dal çıkarsa çıksın, kitabın ana hattını tek tıkla belirlersin. Uygunsuz bir dalı gizlemek de aynı kolaylıkta; bildirilen içerikler moderasyon ekranında seni bekler.":
    "However many branches grow from a chapter, you set the book's main line in one click. Hiding an unsuitable branch is just as easy; reported content waits for you in moderation.",
  "Paketler": "Packages",
  "Karakterlerin her kitapta seninle.": "Your characters, in every book.",
  "Bir karakteri ya da mekânı bir kez oluştur, görseliyle birlikte istediğin kitaba paket gibi ekle. Aynı liman, aynı kaptan — bütün evreninde tutarlı.":
    "Create a character or a place once and add it, picture and all, to any book like a package. The same harbour, the same captain — consistent across your whole world.",
  // Readers
  "Okurlar için": "For readers",
  "Okur burada yalnızca okumaz —": "Here readers don't just read —",
  "yazar.": "they write.",
  "Bir bölümü sevdin mi?": "Loved a chapter?",
  "Devamını sen yaz; bir şiire nazireyle karşılık ver. Herkese açık kurmacada kimseden izin beklemezsin.":
    "Write what comes next; answer a poem with a poem. In open fiction you don't need anyone's permission.",
  "Beğen, yorumla, paylaş.": "Like, comment, share.",
  "Kitapları, karakterleri ve mekânları favorilerine ekle.": "Add books, characters and places to your favourites.",
  "Okudukça seviye atla.": "Level up as you read.",
  "Çırak Okuyucu olarak başla, Efsanevi Okuyucu unvanına kadar yüksel.":
    "Start as an Apprentice Reader and rise all the way to Legendary Reader.",
  // Pricing
  "Okumak ücretsiz.": "Reading is free.",
  "Yazmak da.": "So is writing.",
  "Daha büyük evrenler kuranlar için Premium yolda.": "Premium is on its way for those building bigger worlds.",
  "Ücretsiz": "Free",
  "Sekiz yazı türünün hepsi": "All eight kinds of writing",
  "Sınırsız okuma, beğeni ve yorum": "Unlimited reading, likes and comments",
  "İstediğin kadar yazı ve bölüm": "As many writings and chapters as you like",
  "Herkese açık kitaplardan dal açma": "Branching from open books",
  "Karakter ve mekân paketleri": "Character and place packages",
  "Bağlantıyla paylaşma": "Sharing by link",
  "Yakında": "Soon",
  "Yazar evi": "Writer's house",
  "Sınırsız karakter ve mekân kütüphanesi": "An unlimited library of characters and places",
  "Kitapların için okur istatistikleri": "Reader statistics for your books",
  "Özel kapak ve sayfa temaları": "Custom cover and page themes",
  "Yeni özelliklere erken erişim": "Early access to new features",
  "Fiyat lansmanda açıklanacak. Bugün açtığın hesap aynen devam eder.":
    "Pricing will be announced at launch. The account you open today carries on as it is.",
  // FAQ
  "Sık sorulanlar": "Frequently asked",
  "Merak edilenler": "Questions",
  "Okumak ücretli mi?": "Does reading cost anything?",
  "Hayır. Paylaşılan her yazı ücretsiz okunur; okumak için hesap bile gerekmez. Yazmak için giriş yapman yeterli.":
    "No. Every shared writing is free to read; you don't even need an account to read. To write, you just sign in.",
  "Başka yazarların yazılarını nerede bulurum?": "Where do I find other writers' work?",
  "Şimdilik bir yazıyı yalnızca yazarının paylaştığı bağlantıyla okuyabilirsin. Keşfet, beğeniler, yorumlar ve okur dalları Booktion'da 100 yazı olduğunda açılacak.":
    "For now you can read a writing only through the link its author shares. Discover, likes, comments and reader branches open once Booktion has 100 writings.",
  "Başkası kitabımdan dal açabilir mi?": "Can someone else branch from my book?",
  "Herkese açık kitap, öykü ve şiirlerde, yayınlanmış bir bölümden herkes kendi dalını açabilir — bu Booktion'ın kalbi. Ana hattı yalnızca sen belirlersin; uygunsuz bir dalı gizleyebilir, bildirimleri moderasyon ekranından yönetebilirsin.":
    "In open books, stories and poems, anyone can branch from a published chapter — that's the heart of Booktion. Only you set the main line; you can hide an unsuitable branch and handle reports in moderation.",
  "Günlüğümü ve taslaklarımı kim görebilir?": "Who can see my diary and drafts?",
  "Yalnızca sen. Her yeni yazı gizli başlar; görünürlüğü ne zaman açacağına sen karar verirsin.":
    "Only you. Every new writing starts private; you decide when to open it.",
  "Köşe yazıma ya da röportajıma başkası ekleme yapabilir mi?": "Can someone else add to my column or interview?",
  "Hayır. Okurların dal açabildiği türler yalnızca kurmaca ve şiir: kitap, öykü ve şiir. Deneme, köşe yazısı, röportaj, journal ve günlükte yalnızca yazar yazar; okurlar okur, beğenir ve yorum yapar.":
    "No. Readers can branch only in fiction and poetry: books, stories and poems. In essays, columns, interviews, journals and diaries only the author writes; readers read, like and comment.",
  "Nasıl giriş yaparım?": "How do I sign in?",
  "Bir kullanıcı adı ve şifre seçip hesabını açarsın; sonra aynı bilgilerle her cihazdan girersin. E-posta ya da telefon numarası istemiyoruz.":
    "You pick a username and a password to open your account, then sign in with them on any device. We don't ask for an email or a phone number.",
  // Closing
  "İlk sayfanı bu akşam yaz.": "Write your first page tonight.",
  "Alt bağlantılar": "Footer links",
};
