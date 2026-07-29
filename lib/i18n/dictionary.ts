export type Locale = "tr" | "en";

type Entry = { tr: string; en: string };

export const dictionary: Record<string, Entry> = {
  // Header
  "nav.home": { tr: "Anasayfa", en: "Home" },
  "nav.faqs": { tr: "SSS", en: "FAQs" },
  "nav.admin": { tr: "Yönetim", en: "Admin" },
  "header.becomeWriter": { tr: "Lore Yazarı Ol", en: "Become a Writer" },

  // ShareButton
  "share.share": { tr: "Paylaş", en: "Share" },
  "share.copied": { tr: "Kopyalandı!", en: "Copied!" },

  // CommentSection
  "comments.likes": { tr: "{count} Beğeni", en: "{count} Likes" },
  "comments.viewsLabel": { tr: "görüntülenme", en: "views" },
  "comments.leaveComment": { tr: "Bir Yorum Bırak", en: "Leave a Comment" },
  "comments.name": { tr: "İsim", en: "Name" },
  "comments.namePlaceholder": { tr: "Adınız ve soyadınız", en: "Your full name" },
  "comments.email": { tr: "E-posta (Yayınlanmayacak)", en: "Email (won't be published)" },
  "comments.emailPlaceholder": { tr: "ornek@mail.com", en: "example@mail.com" },
  "comments.yourComment": { tr: "Yorumunuz", en: "Your Comment" },
  "comments.commentPlaceholder": { tr: "Düşüncelerinizi paylaşın...", en: "Share your thoughts..." },
  "comments.submitting": { tr: "Gönderiliyor...", en: "Submitting..." },
  "comments.submit": { tr: "Yorum Gönder", en: "Post Comment" },
  "comments.successMsg": { tr: "Yorumunuz başarıyla gönderildi!", en: "Your comment was posted successfully!" },
  "comments.title": { tr: "Yorumlar ({count})", en: "Comments ({count})" },
  "comments.empty": { tr: "Henüz yorum yapılmamış. İlk yorumu siz yapın!", en: "No comments yet. Be the first to comment!" },
  "comments.errNameLength": { tr: "Lütfen geçerli bir isim girin (en az 2 karakter).", en: "Please enter a valid name (at least 2 characters)." },
  "comments.errEmail": { tr: "Lütfen geçerli bir e-posta adresi girin.", en: "Please enter a valid email address." },
  "comments.errContentLength": { tr: "Lütfen bir yorum yazın (en az 3 karakter).", en: "Please write a comment (at least 3 characters)." },
  "comments.errCooldown": { tr: "Çok hızlı yorum yazıyorsunuz! Lütfen 15 saniye bekleyin.", en: "You're commenting too fast! Please wait 15 seconds." },
  "comments.errGeneric": { tr: "Yorum gönderilirken bir hata oluştu.", en: "Something went wrong while posting your comment." },

  // WriterRequestModal
  "writerModal.title": { tr: "Lore Yazarı Ol", en: "Become a Lore Writer" },
  "writerModal.subtitle": {
    tr: "Evrenlerimize yeni hikayeler, karakterler ve efsaneler eklemek için başvuruda bulunun. Kadim yazıcıların arasına katılın.",
    en: "Apply to add new stories, characters, and legends to our universes. Join the ranks of the ancient scribes.",
  },
  "writerModal.name": { tr: "İsim", en: "Name" },
  "writerModal.namePlaceholder": { tr: "Adınız ve soyadınız", en: "Your full name" },
  "writerModal.email": { tr: "E-posta", en: "Email" },
  "writerModal.emailPlaceholder": { tr: "ornek@mail.com", en: "example@mail.com" },
  "writerModal.reasonLabel": { tr: "Neden yazar olmak istiyorsunuz? (İsteğe bağlı)", en: "Why do you want to become a writer? (optional)" },
  "writerModal.reasonPlaceholder": {
    tr: "Hangi evrenlerle ilgilisiniz? Yazarlık deneyiminizden bahsedin...",
    en: "Which universes interest you? Tell us about your writing experience...",
  },
  "writerModal.errNameLength": { tr: "Lütfen geçerli bir isim girin (en az 2 karakter).", en: "Please enter a valid name (at least 2 characters)." },
  "writerModal.errEmail": { tr: "Lütfen geçerli bir e-posta adresi girin.", en: "Please enter a valid email address." },
  "writerModal.errCooldown": { tr: "Çok hızlı başvuru gönderiyorsunuz! Lütfen 2 dakika bekleyin.", en: "You're applying too fast! Please wait 2 minutes." },
  "writerModal.errGeneric": { tr: "Başvuru gönderilirken bir hata oluştu.", en: "Something went wrong while submitting your application." },
  "writerModal.successMsg": { tr: "Başvurunuz başarıyla gönderildi! Pencere kapatılıyor...", en: "Your application was submitted successfully! Closing window..." },
  "writerModal.cancel": { tr: "İptal", en: "Cancel" },
  "writerModal.submitting": { tr: "Gönderiliyor...", en: "Submitting..." },
  "writerModal.submit": { tr: "Başvuruyu Gönder", en: "Submit Application" },

  // Home
  "home.title": { tr: "Evrenini Seç", en: "Choose Your Universe" },
  "home.subtitle": { tr: "Evrenlerimizi şekillendiren zengin lore ve hikayeleri keşfet", en: "Discover the rich lore and stories that shape our universes" },
  "home.emptyTitle": { tr: "Henüz hiç evren eklenmedi.", en: "No universes have been added yet." },
  "home.emptySubtitle": { tr: "Yakında burada keşfedebileceğin evrenler olacak.", en: "Universes to explore will appear here soon." },
  "home.books": { tr: "Kitap", en: "Books" },
  "home.categories": { tr: "Kategori", en: "Categories" },
  "home.entries": { tr: "Lore Girdisi", en: "Lore Entries" },

  // FAQ
  "faq.title": { tr: "Sıkça Sorulan Sorular", en: "Frequently Asked Questions" },
  "faq.subtitle": { tr: "Lore ve site hakkında sık sorulan soruların cevapları", en: "Find answers to common questions about our lore and website" },
  "faq.stillHaveQuestions": { tr: "Hâlâ sorunuz mu var?", en: "Still have questions?" },
  "faq.contactUs": { tr: "Bize Ulaşın", en: "Contact Us" },
  "faq.q1": { tr: "Bu site ne hakkında?", en: "What is this website about?" },
  "faq.a1": {
    tr: "Bu site, kurgusal evrenimizin zengin lore'unu ve hikayelerini keşfetmeye ve paylaşmaya adanmıştır. Dünyamızı oluşturan çeşitli karakterleri, mekanları ve olayları keşfedebilirsin.",
    en: "This website is dedicated to exploring and sharing the rich lore and stories of our fictional universe. You can discover various characters, locations, and events that make up our world.",
  },
  "faq.q2": { tr: "Lore'da nasıl gezinirim?", en: "How do I navigate the lore?" },
  "faq.a2": {
    tr: "Bir evreni seçerek içindeki farklı lore girdilerine göz atabilirsin. Her girdi, karakterler, mekanlar veya olaylar hakkında detaylı bilgi içerir. Hikayenin tamamını okumak için bir karta tıklaman yeterli.",
    en: "You can pick a universe and browse through its different lore entries. Each entry contains detailed information about characters, locations, or events. Click on any card to read the full story.",
  },
  "faq.q3": { tr: "Lore'a katkıda bulunabilir miyim?", en: "Can I contribute to the lore?" },
  "faq.a3": {
    tr: "Evet! Üst menüdeki \"Lore Yazarı Ol\" butonundan başvurabilirsin — onaylanan yazarlar kendi karakterlerini, girdilerini ve bölümlerini ekleyebiliyor.",
    en: "Yes! Click the \"Become a Writer\" button in the header to apply — approved writers can add their own characters, entries, and chapters.",
  },
  "faq.q4": { tr: "İçerikler ücretsiz mi?", en: "Is this content free to access?" },
  "faq.a4": {
    tr: "Evet, bu sitedeki tüm lore içeriği tamamen ücretsiz. Hikayelerimizi herkesle paylaşmaya inanıyoruz.",
    en: "Yes, all lore content on this website is completely free to access and read. We believe in sharing our stories with everyone.",
  },
  "faq.q5": { tr: "Yeni içerik ne sıklıkla ekleniyor?", en: "How often is new content added?" },
  "faq.a5": {
    tr: "Lore'umuzu düzenli olarak yeni hikayeler, karakterler ve olaylarla güncelliyoruz. Yeni içerikleri keşfetmek için sık sık uğra.",
    en: "We regularly update our lore with new stories, characters, and events. Check back frequently to discover new content.",
  },
  "faq.q6": { tr: "Lore'u başkalarıyla paylaşabilir miyim?", en: "Can I share the lore with others?" },
  "faq.a6": {
    tr: "Kesinlikle! Lore'umuzu arkadaşlarınla ve ailenle paylaşmaktan çekinme. Hikayeleri yaymanı ve topluluğumuzu büyütmeni destekliyoruz.",
    en: "Absolutely! Feel free to share our lore with friends and family. We encourage spreading the stories and building our community.",
  },

  // Universe page
  "universe.notFound": { tr: "Evren Bulunamadı", en: "Universe Not Found" },
  "universe.backHome": { tr: "Anasayfaya Dön", en: "Back to Home" },
  "universe.tabLore": { tr: "Lore", en: "Lore" },
  "universe.tabBooks": { tr: "Kitaplar", en: "Books" },
  "universe.tabBoardGames": { tr: "Kutu Oyunları", en: "Board Games" },
  "universe.allCategories": { tr: "Tüm Kategoriler", en: "All Categories" },
  "universe.typeAll": { tr: "Tümü", en: "All" },
  "universe.typeCharacter": { tr: "Karakterler", en: "Characters" },
  "universe.typeCity": { tr: "Şehirler", en: "Cities" },
  "universe.typeItem": { tr: "Eşyalar", en: "Items" },
  "universe.typeStory": { tr: "Hikayeler", en: "Stories" },
  "universe.typeOther": { tr: "Diğer", en: "Other" },
  "universe.typeLocation": { tr: "Mekanlar", en: "Locations" },
  "universe.typeFaction": { tr: "Hizipler", en: "Factions" },
  "universe.noEntries": { tr: "Girdi bulunamadı.", en: "No entries found." },
  "universe.noBoardGames": { tr: "Bu evrende henüz kutu oyunu yok.", en: "No board games in this universe yet." },
  "universe.noBooks": { tr: "Bu evrende henüz kitap yok.", en: "No books in this universe yet." },
  "universe.playersOne": { tr: "{min} oyuncu", en: "{min} players" },
  "universe.playersRange": { tr: "{min}–{max} oyuncu", en: "{min}–{max} players" },
  "universe.pages": { tr: "{count} Sayfa", en: "{count} Pages" },
  "universe.readingTime": { tr: "{count} dk okuma", en: "{count} min read" },

  // Lore detail page
  "lore.notFound": { tr: "Girdi Bulunamadı", en: "Lore Not Found" },
  "lore.backHome": { tr: "Anasayfaya Dön", en: "Back to Home" },
  "lore.backToUniverse": { tr: "{name}'e Geri Dön", en: "Back to {name}" },
  "lore.universeLabel": { tr: "Evren: {name}", en: "Universe: {name}" },
  "lore.relatedEntries": { tr: "İlgili Girdiler", en: "Related Entries" },
  "lore.back": { tr: "Geri", en: "Back" },
  "lore.pendingBanner": {
    tr: "📝 Taslak — bu içerik henüz admin onayı bekliyor, sadece bu linke sahip olanlar görebilir.",
    en: "📝 Draft — this content is awaiting admin approval, only people with this link can see it.",
  },

  // Book page
  "book.notFound": { tr: "Kitap Bulunamadı", en: "Book Not Found" },
  "book.backHome": { tr: "Anasayfaya Dön", en: "Back to Home" },
  "book.backToUniverse": { tr: "{name}'e Geri Dön", en: "Back to {name}" },
  "book.readFirst": { tr: "İlk Bölümü Oku", en: "Read First Chapter" },
  "book.readLast": { tr: "Son Bölümü Oku", en: "Read Last Chapter" },
  "book.savePdf": { tr: "PDF / Kitap Olarak Kaydet", en: "Save as PDF / Book" },
  "book.chapters": { tr: "Bölümler", en: "Chapters" },
  "book.noChapters": { tr: "Henüz bölüm yok.", en: "No chapters yet." },
  "book.pages": { tr: "{count} Sayfa", en: "{count} Pages" },
  "book.readingTime": { tr: "{count} dk okuma", en: "{count} min read" },
  "book.chapterLabel": { tr: "Bölüm {n}", en: "Chapter {n}" },

  // Chapter page
  "chapter.backToBook": { tr: "Kitaba Geri Dön", en: "Back to Book" },
  "chapter.notFound": { tr: "Bölüm Bulunamadı", en: "Chapter Not Found" },
  "chapter.views": { tr: "{count} Görüntülenme", en: "{count} Views" },
  "chapter.words": { tr: "{count} Kelime", en: "{count} Words" },
  "chapter.readingTime": { tr: "{count} dk okuma", en: "{count} min read" },
  "chapter.chapterOf": { tr: "Bölüm {current} / {total}", en: "Chapter {current} / {total}" },
  "chapter.prev": { tr: "← Önceki Bölüm", en: "← Previous Chapter" },
  "chapter.next": { tr: "Sonraki Bölüm →", en: "Next Chapter →" },
  "chapter.allChapters": { tr: "Tüm Bölümler", en: "All Chapters" },
  "chapter.current": { tr: "Şu An", en: "Current" },
  "chapter.chapterLabel": { tr: "Bölüm {n}", en: "Chapter {n}" },
  "chapter.pendingBanner": {
    tr: "📝 Taslak — bu bölüm henüz admin onayı bekliyor, sadece bu linke sahip olanlar görebilir.",
    en: "📝 Draft — this chapter is awaiting admin approval, only people with this link can see it.",
  },

  // Board game page
  "boardgame.notFound": { tr: "Oyun Bulunamadı", en: "Game Not Found" },
  "boardgame.backHome": { tr: "Anasayfaya Dön", en: "Back to Home" },
  "boardgame.playersOne": { tr: "{min} oyuncu", en: "{min} players" },
  "boardgame.playersRange": { tr: "{min}–{max} oyuncu", en: "{min}–{max} players" },
  "boardgame.tabCards": { tr: "Kartlar", en: "Cards" },
  "boardgame.tabRules": { tr: "Kurallar", en: "Rules" },
  "boardgame.allCards": { tr: "Tüm Kartlar", en: "All Cards" },
  "boardgame.levelsCount": { tr: "{count} seviye", en: "{count} levels" },
  "boardgame.levelWord": { tr: "Seviye", en: "Level" },
  "boardgame.all": { tr: "Tümü", en: "All" },
  "boardgame.levelN": { tr: "Seviye {n}", en: "Level {n}" },
  "boardgame.noCards": { tr: "Kart bulunamadı.", en: "No cards found." },
  "boardgame.noRules": { tr: "Henüz kural eklenmedi.", en: "No rules added yet." },
};
