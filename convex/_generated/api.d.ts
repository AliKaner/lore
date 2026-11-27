/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as auth from "../auth.js";
import type * as boards from "../boards.js";
import type * as books from "../books.js";
import type * as chapters from "../chapters.js";
import type * as cleanup from "../cleanup.js";
import type * as desk from "../desk.js";
import type * as entities from "../entities.js";
import type * as entityKinds from "../entityKinds.js";
import type * as events from "../events.js";
import type * as exports from "../exports.js";
import type * as family from "../family.js";
import type * as files from "../files.js";
import type * as goals from "../goals.js";
import type * as members from "../members.js";
import type * as migrations from "../migrations.js";
import type * as planCards from "../planCards.js";
import type * as proposals from "../proposals.js";
import type * as reading from "../reading.js";
import type * as reports from "../reports.js";
import type * as social from "../social.js";
import type * as themes from "../themes.js";
import type * as users from "../users.js";
import type * as versions from "../versions.js";
import type * as writingKinds from "../writingKinds.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  auth: typeof auth;
  boards: typeof boards;
  books: typeof books;
  chapters: typeof chapters;
  cleanup: typeof cleanup;
  desk: typeof desk;
  entities: typeof entities;
  entityKinds: typeof entityKinds;
  events: typeof events;
  exports: typeof exports;
  family: typeof family;
  files: typeof files;
  goals: typeof goals;
  members: typeof members;
  migrations: typeof migrations;
  planCards: typeof planCards;
  proposals: typeof proposals;
  reading: typeof reading;
  reports: typeof reports;
  social: typeof social;
  themes: typeof themes;
  users: typeof users;
  versions: typeof versions;
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
  authPassword: import("@convex-dev/auth/components/password/_generated/component.js").ComponentApi<"authPassword">;
  authUsername: import("@convex-dev/auth/components/username/_generated/component.js").ComponentApi<"authUsername">;
};
