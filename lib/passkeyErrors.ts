// Turkish messages for the error codes of the passkey flows.
const MESSAGES: Record<string, string> = {
  CEREMONY_ABORTED: "İşlemi iptal ettin ya da süre doldu.",
  PASSKEY_ALREADY_REGISTERED: "Bu cihaz ya da anahtar zaten hesabına ekli.",
  WEBAUTHN_UNSUPPORTED: "Bu tarayıcı passkey desteklemiyor. Güncel bir tarayıcı dene.",
  TOO_MANY_PASSKEYS: "Hesabına en fazla sayıda cihaz ekli; önce birini kaldır.",
  LAST_PASSKEY: "Son giriş anahtarın kaldırılamaz; önce başka bir cihaz ekle.",
  CHALLENGE_EXPIRED: "Süre doldu. Tekrar dene.",
  UNKNOWN_CREDENTIAL: "Bu anahtar hesabına ait değil.",
  PASSKEY_NOT_FOUND: "Bu anahtar artık yok.",
  NOT_LOGGED_IN: "Oturumun kapanmış; tekrar giriş yap.",
  INVALID_NAME: "Bu ad kullanılamıyor.",
  ALREADY_PENDING: "Bir işlem zaten sürüyor.",
};

export function passkeyErrorMessage(error: { error: string } | undefined | null) {
  if (!error) return "Bir sorun oldu. Tekrar dene.";
  return MESSAGES[error.error] ?? "Bir sorun oldu. Tekrar dene.";
}
