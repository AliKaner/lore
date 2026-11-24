import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { writingKindValidator } from "./writingKinds";

export default defineSchema({
  users: defineTable({
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    wallpaperStorageId: v.optional(v.id("_storage")),
    xp: v.number(),
    level: v.number(),
  }),

  books: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    ownerId: v.id("users"),
    kind: v.optional(writingKindValidator),
    visibility: v.union(v.literal("public"), v.literal("private")),
    rootChapterId: v.optional(v.id("chapters")),
    likeCount: v.number(),
    shareCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_visibility", ["visibility"])
    .index("by_visibility_and_kind", ["visibility", "kind"]),

  chapters: defineTable({
    bookId: v.id("books"),
    parentChapterId: v.optional(v.id("chapters")),
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    order: v.number(),
    isCanonical: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published")),
    likeCount: v.number(),
    shareCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_book_and_parent", ["bookId", "parentChapterId"])
    .index("by_author", ["authorId"]),

  characters: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    creatorId: v.id("users"),
    originBookId: v.optional(v.id("books")),
    createdAt: v.number(),
  }).index("by_creator", ["creatorId"]),

  places: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    creatorId: v.id("users"),
    originBookId: v.optional(v.id("books")),
    createdAt: v.number(),
  }).index("by_creator", ["creatorId"]),

  bookCharacters: defineTable({
    bookId: v.id("books"),
    characterId: v.id("characters"),
  })
    .index("by_book", ["bookId"])
    .index("by_book_and_character", ["bookId", "characterId"]),

  bookPlaces: defineTable({
    bookId: v.id("books"),
    placeId: v.id("places"),
  })
    .index("by_book", ["bookId"])
    .index("by_book_and_place", ["bookId", "placeId"]),

  likes: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("book"), v.literal("chapter")),
    targetId: v.string(),
    createdAt: v.number(),
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_user_and_target", ["userId", "targetType", "targetId"]),

  comments: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("book"), v.literal("chapter")),
    targetId: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_target", ["targetType", "targetId"]),

  favorites: defineTable({
    userId: v.id("users"),
    targetType: v.union(
      v.literal("book"),
      v.literal("character"),
      v.literal("place"),
    ),
    targetId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_target", ["userId", "targetType", "targetId"]),

  shares: defineTable({
    userId: v.id("users"),
    targetType: v.union(v.literal("book"), v.literal("chapter")),
    targetId: v.string(),
    createdAt: v.number(),
  }).index("by_target", ["targetType", "targetId"]),

  chapterReads: defineTable({
    userId: v.id("users"),
    bookId: v.id("books"),
    chapterId: v.id("chapters"),
    createdAt: v.number(),
  })
    .index("by_user_and_chapter", ["userId", "chapterId"])
    .index("by_user", ["userId"])
    .index("by_user_and_book", ["userId", "bookId"]),

  reports: defineTable({
    reporterId: v.id("users"),
    targetType: v.union(v.literal("book"), v.literal("chapter")),
    targetId: v.string(),
    reason: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_target", ["targetType", "targetId"]),
});
