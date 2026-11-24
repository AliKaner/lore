import { convexAuthNextjsProxy, nextjsProxyRedirect } from "@/lib/convexAuth";

export default convexAuthNextjsProxy(async (request, { isAuthenticated }) => {
  const { pathname } = request.nextUrl;
  if ((pathname === "/" || pathname === "/giris") && (await isAuthenticated())) {
    return nextjsProxyRedirect(request, "/kesfet");
  }
  return undefined;
});

export const config = {
  matcher: ["/((?!auth(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
