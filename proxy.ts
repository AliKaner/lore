import { convexAuthNextjsProxy, nextjsProxyRedirect } from "@/lib/convexAuth";
import { safeNext } from "@/lib/safeNext";

// Pages a signed-out visitor may open. Everything else is the writer's desk
// and sends them to sign in first. Reading a writing through a shared link
// (`/kitap/<id>` and its chapters) stays open — that's how writings are
// shared while the community is closed; Convex still hides private ones.
const PUBLIC_PAGES = [
  /^\/$/,
  /^\/giris$/,
  /^\/kesfet$/,
  /^\/kitap\/[^/]+$/,
  /^\/kitap\/[^/]+\/bolum\/[^/]+$/,
  /^\/kitap\/[^/]+\/evren\/[^/]+$/,
];

// Files for crawlers and link previews (WhatsApp, X…): never behind sign-in.
const OPEN_FILES =
  /\/(?:opengraph-image|twitter-image)(?:-[\w-]+)?$|^\/(?:icon\.svg|apple-icon|manifest\.webmanifest|sitemap\.xml|robots\.txt|llms(?:-full)?\.txt)$/;

export default convexAuthNextjsProxy(async (request, { isAuthenticated }) => {
  const { pathname, searchParams } = request.nextUrl;
  if (OPEN_FILES.test(pathname)) return undefined;
  const signedIn = await isAuthenticated();

  if (signedIn && (pathname === "/" || pathname === "/giris")) {
    const target = pathname === "/giris" ? safeNext(searchParams.get("next")) : "/yazilarim";
    return nextjsProxyRedirect(request, target);
  }

  if (!signedIn && !PUBLIC_PAGES.some((page) => page.test(pathname))) {
    return nextjsProxyRedirect(request, `/giris?next=${encodeURIComponent(pathname)}`);
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!auth(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
