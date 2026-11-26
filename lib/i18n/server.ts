import type { Entry } from "@/lib/translate";

// Messages Convex functions throw at the user (shown through the toaster or
// an inline error, which translate them).
export const SERVER: Record<string, Entry> = {
  "Giriş yapmalısın.": "You need to sign in.",
  // Boards
  "Bu kartı düzenleyemezsin.": "You can't edit this card.",
  "Yazı bulunamadı.": "Writing not found.",
  "Panolar dolu; yeni kart için önce birini kaldır.": "Your boards are full; remove a card to add a new one.",
  "Bu kayıt eklenemez.": "This entry can't be added.",
  "Bir görsel seç.": "Choose a picture.",
  "Not çok uzun.": "The note is too long.",
  "Liste çok uzun.": "The list is too long.",
  // Books and chapters
  "Bu kitabı düzenleyemezsin.": "You can't edit this book.",
  "Bu yazıyı silemezsin.": "You can't delete this writing.",
  "Bu yazıya yalnızca yazarı ekleme yapabilir.": "Only the author can add to this writing.",
  "Bu kitaba dal ekleyemezsin.": "You can't add a branch to this book.",
  "Kök bölümü sadece kitabın sahibi yazabilir.": "Only the book's owner can write the first chapter.",
  "Sadece yayınlanmış bir bölümden kendi dalını açabilirsin.": "You can only branch from a published chapter.",
  "Kitap bulunamadı.": "Book not found.",
  "Bu bölümü düzenleyemezsin.": "You can't edit this chapter.",
  "Bölüm bulunamadı.": "Chapter not found.",
  "Sadece kitabın sahibi bir dalı gizleyebilir.": "Only the book's owner can hide a branch.",
  "Bu bölümü silemezsin.": "You can't delete this chapter.",
  "Bu bölümün devamı var; önce devamındaki bölümleri sil.": "This chapter has chapters after it; delete those first.",
  "Sadece kitabın sahibi resmi hattı seçebilir.": "Only the book's owner can choose the main line.",
  "Bu kitabın kapağını değiştiremezsin.": "You can't change this book's cover.",
  // World
  "Bunu düzenleyemezsin.": "You can't edit this.",
  "Bu yazıya bir şey ekleyemezsin.": "You can't add anything to this writing.",
  "Bir ad yazmalısın.": "You need to write a name.",
  "Ad çok uzun.": "The name is too long.",
  "Kısa açıklama çok uzun.": "The short description is too long.",
  "Bilinmeyen bir alan.": "Unknown field.",
  "Bu alan çok uzun.": "This field is too long.",
  "Çok fazla alan.": "Too many fields.",
  "Buraya yalnızca bir tane seçilebilir.": "Only one can be chosen here.",
  "Çok fazla bağlantı.": "Too many links.",
  "Kendisine bağlanamaz.": "It can't be linked to itself.",
  "Bu bağlantı kurulamaz.": "This link can't be made.",
  "Buraya bu tür seçilemez.": "This kind can't be chosen here.",
  "Görsel sınırına ulaştın; yenisi için birini kaldır.": "You've reached the picture limit; remove one to add another.",
  "Bu karakteri düzenleyemezsin.": "You can't edit this character.",
  // Goals
  "Bu hedef izin verilen aralığın dışında.": "This goal is outside the allowed range.",
  "Geçersiz saat dilimi.": "Invalid time zone.",
  "Geçersiz gün.": "Invalid day.",
  // Reports and social
  "Bir sebep yazmalısın.": "You need to give a reason.",
  "Bildirim bulunamadı.": "Report not found.",
  "Bu bildirimi çözemezsin.": "You can't resolve this report.",
  "Hedef bulunamadı.": "Not found.",
  "Yorum boş olamaz.": "A comment can't be empty.",
};
