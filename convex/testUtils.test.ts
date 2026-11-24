import { convexTest } from "convex-test";
import authCore from "@convex-dev/auth/test";
import authUsername from "@convex-dev/auth/components/username/test";
import schema from "./schema";

// Minted directly on the auth core component, bypassing any real sign-in
// ceremony (passkeys need a real/virtual authenticator we don't have in
// tests). This is the same internal mutation every sign-in method calls
// after it verifies the user; see @convex-dev/auth's component/public.ts.
const SESSION_TTL = {
  accessTokenTtlSeconds: 3600,
  refreshInactivityTimeoutSeconds: 86400,
  sessionMaxLifetimeSeconds: 2_592_000,
};

// `modules` must come from each *.test.ts file's own `import.meta.glob` call
// (see the Convex testing guidelines) rather than being computed in here:
// `import.meta.glob` is a Vite-only macro, and this file — unlike a
// `*.test.ts` file — is part of the deployed Convex bundle, which can't
// resolve it.
export function setupTest(modules: Record<string, () => Promise<unknown>>) {
  const t = convexTest(schema, modules);
  const authApi = t.registerComponent(
    "auth",
    authCore.schema,
    authCore.modules,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  // Registered so any function touching `components.authUsername` (e.g.
  // `users.me`) works too, even in tests that don't care about usernames.
  authUsername.registerUsername(t);
  return { t, authApi };
}

export async function signInAsNewUser(
  t: ReturnType<typeof setupTest>["t"],
  authApi: ReturnType<typeof setupTest>["authApi"],
) {
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", { xp: 0, level: 1 }),
  );
  const tokens = await t.mutation(authApi.public._internal_dangerous_signIn, {
    claims: { method: "test", profile: {} },
    componentPath: "test",
    userId,
    ...SESSION_TTL,
  });
  const signedInT = t.withIdentity(authCore.sessionIdentity(tokens));
  return { userId, t: signedInT };
}
