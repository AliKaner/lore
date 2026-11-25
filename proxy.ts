import { convexAuthNextjsProxy, nextjsProxyRedirect } from "@/lib/convexAuth";
import { safeNext } from "@/lib/safeNext";

export default convexAuthNextjsProxy(async (request, { isAuthenticated }) => {
  const { pathname, searchParams } = request.nextUrl;
  if ((pathname === "/" || pathname === "/giris") && (await isAuthenticated())) {
    const target = pathname === "/giris" ? safeNext(searchParams.get("next")) : "/yazilarim";
    return nextjsProxyRedirect(request, target);
  }
  return undefined;
});

export const config = {
  matcher: ["/((?!auth(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
