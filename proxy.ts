import { convexAuthNextjsProxy, nextjsProxyRedirect } from "@/lib/convexAuth";
import { safeNext } from "@/lib/safeNext";

// Pages a signed-out visitor may open. Everything else is the writer's desk
// and sends them to sign in first. Reading a writing through a shared link
// (`/book/<id>` and its chapters) stays open — that's how writings are
// shared while the community is closed; Convex still hides private ones.
const PUBLIC_PAGES = [
  /^\/$/,
  /^\/sign-in$/,
  /^\/discover$/,
  /^\/books$/,
  /^\/book\/[^/]+$/,
  /^\/book\/[^/]+\/chapter\/[^/]+$/,
  /^\/book\/[^/]+\/world\/[^/]+$/,
];

// Files for crawlers and link previews (WhatsApp, X…), static sounds, word
// lists, spelling dictionaries and cover pictures: never behind sign-in.
const OPEN_FILES =
  /\/(?:opengraph-image|twitter-image)(?:-[\w-]+)?$|^\/(?:icon\.svg|apple-icon|manifest\.webmanifest|sitemap\.xml|robots\.txt|llms(?:-full)?\.txt)$|^\/(?:sounds|words|dict|covers)\//;

export default convexAuthNextjsProxy(async (request, { isAuthenticated }) => {
  const { pathname, searchParams } = request.nextUrl;
  if (OPEN_FILES.test(pathname)) return undefined;
  const signedIn = await isAuthenticated();

  if (signedIn && (pathname === "/" || pathname === "/sign-in")) {
    const target = pathname === "/sign-in" ? safeNext(searchParams.get("next")) : "/my-writing";
    return nextjsProxyRedirect(request, target);
  }

  if (!signedIn && !PUBLIC_PAGES.some((page) => page.test(pathname))) {
    return nextjsProxyRedirect(request, `/sign-in?next=${encodeURIComponent(pathname)}`);
  }

  return undefined;
});

export const config = {
  matcher: ["/((?!auth(?:/|$)|_next/static|_next/image|favicon.ico).*)"],
};
