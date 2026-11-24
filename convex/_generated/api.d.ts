/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as books from "../books.js";
import type * as chapters from "../chapters.js";
import type * as characters from "../characters.js";
import type * as files from "../files.js";
import type * as migrations from "../migrations.js";
import type * as places from "../places.js";
import type * as reading from "../reading.js";
import type * as reports from "../reports.js";
import type * as social from "../social.js";
import type * as users from "../users.js";
import type * as writingKinds from "../writingKinds.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  books: typeof books;
  chapters: typeof chapters;
  characters: typeof characters;
  files: typeof files;
  migrations: typeof migrations;
  places: typeof places;
  reading: typeof reading;
  reports: typeof reports;
  social: typeof social;
  users: typeof users;
  writingKinds: typeof writingKinds;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  auth: import("@convex-dev/auth/_generated/component.js").ComponentApi<"auth">;
  authPasskey: import("@convex-dev/auth/components/passkey/_generated/component.js").ComponentApi<"authPasskey">;
  authUsername: import("@convex-dev/auth/components/username/_generated/component.js").ComponentApi<"authUsername">;
};
