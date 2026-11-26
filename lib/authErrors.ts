// Readable (Turkish; translated where shown) messages for the error codes of
// sign-in, sign-up and changing a password. Never show a raw code like
// OTHER_ERROR. `{n}` is filled with the length the rule asks for.
export const AUTH_MESSAGES: Record<string, string> = {
  PASSWORD_TOO_SHORT: "Şifre en az {n} karakter olmalı.",
  PASSWORD_TOO_LONG: "Şifre en fazla {n} karakter olabilir.",
  PASSWORD_HAS_SURROUNDING_WHITESPACE: "Şifrenin başında ya da sonunda boşluk olamaz.",
  PASSWORD_TOO_COMMON: "Bu şifre çok yaygın, kolayca tahmin edilir. Daha özgün bir şifre seç.",
  INVALID_CREDENTIALS: "Şifre yanlış.",
  RATE_LIMITED: "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.",
  USER_NOT_FOUND: "Bu kullanıcı adıyla bir hesap yok. Yeni hesap açmak için “Hesap aç”a geç.",
  USERNAME_TAKEN: "Bu kullanıcı adı alınmış. Senin hesabınsa “Giriş yap”a geç.",
  USERNAME_TOO_SHORT: "Kullanıcı adı çok kısa.",
  USERNAME_TOO_LONG: "Kullanıcı adı çok uzun.",
  USERNAME_HAS_INVALID_CHARACTERS: "Kullanıcı adında kullanılamayan karakterler var.",
  USERNAME_HAS_SURROUNDING_WHITESPACE: "Kullanıcı adının başında ya da sonunda boşluk olamaz.",
  NOT_LOGGED_IN: "Oturumun kapanmış; tekrar giriş yap.",
  OTHER_ERROR: "Giriş şu an yapılamıyor. Biraz sonra tekrar dene.",
};

export const AUTH_FALLBACK = "Bir sorun oldu. Tekrar dene.";

type AuthError = { error: string; minimumLength?: number; maximumLength?: number };

// The message and the values to fill in; pass both to `t()`.
export function authErrorMessage(error: AuthError | undefined | null): [string, { n: number }] {
  if (!error) return [AUTH_FALLBACK, { n: 0 }];
  return [AUTH_MESSAGES[error.error] ?? AUTH_FALLBACK, { n: error.minimumLength ?? error.maximumLength ?? 0 }];
}
