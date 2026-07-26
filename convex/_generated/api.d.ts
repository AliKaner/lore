/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as boardGames from "../boardGames.js";
import type * as bookNotes from "../bookNotes.js";
import type * as books from "../books.js";
import type * as cardTypes from "../cardTypes.js";
import type * as cards from "../cards.js";
import type * as categories from "../categories.js";
import type * as chapters from "../chapters.js";
import type * as comments from "../comments.js";
import type * as fileStorage from "../fileStorage.js";
import type * as likes from "../likes.js";
import type * as loreEntries from "../loreEntries.js";
import type * as universes from "../universes.js";
import type * as writerAuth from "../writerAuth.js";
import type * as writerAuthLib from "../writerAuthLib.js";
import type * as writerContent from "../writerContent.js";
import type * as writerRequests from "../writerRequests.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  boardGames: typeof boardGames;
  bookNotes: typeof bookNotes;
  books: typeof books;
  cardTypes: typeof cardTypes;
  cards: typeof cards;
  categories: typeof categories;
  chapters: typeof chapters;
  comments: typeof comments;
  fileStorage: typeof fileStorage;
  likes: typeof likes;
  loreEntries: typeof loreEntries;
  universes: typeof universes;
  writerAuth: typeof writerAuth;
  writerAuthLib: typeof writerAuthLib;
  writerContent: typeof writerContent;
  writerRequests: typeof writerRequests;
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

export declare const components: {};
