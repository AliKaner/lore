import { components, internal } from "./_generated/api";
import { env } from "./_generated/server";
import { setupConvexAuth } from "@convex-dev/auth/server";
import { setupUsernamePasskey } from "@convex-dev/auth/methods/username-passkey/server";

const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;

// Passkey management lets a writer add a second device (or a security key)
// so losing one device doesn't lose the account.
export const {
  startSignInWithUsernamePasskey,
  startAutofillSignInWithUsernamePasskey,
  finishSignUpWithUsernamePasskey,
  finishSignInWithUsernamePasskey,
  listPasskeys,
  renamePasskey,
  startAddPasskey,
  verifyAddPasskey,
  finishAddPasskey,
  startRemovePasskey,
  finishRemovePasskey,
} = setupUsernamePasskey(auth, {
  component: components.authPasskey,
  usernameComponent: components.authUsername,
  rpId: env.PASSKEY_RP_ID ?? "localhost",
  origin: env.PASSKEY_ORIGIN?.split(",") ?? "http://localhost:3000",
}).attachUserCallbacks({ createUser: internal.users.createUser });
