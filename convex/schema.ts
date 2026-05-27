import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  universes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    order: v.optional(v.number()),
  }),

  categories: defineTable({
    universeId: v.id("universes"),
    name: v.string(),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    order: v.optional(v.number()),
  }).index("by_universe", ["universeId"]),

  loreEntries: defineTable({
    universeId: v.id("universes"),
    categoryId: v.id("categories"),
    name: v.string(),
    type: v.union(
      v.literal("character"),
      v.literal("city"),
      v.literal("item"),
      v.literal("story"),
      v.literal("other")
    ),
    imageStorageId: v.optional(v.id("_storage")),
    contentTr: v.string(),
    contentEn: v.string(),
    relatedEntryIds: v.optional(v.array(v.id("loreEntries"))),
    order: v.optional(v.number()),
    views: v.optional(v.number()),
    likeCount: v.optional(v.number()),
  })
    .index("by_universe", ["universeId"])
    .index("by_category", ["categoryId"]),

  books: defineTable({
    universeId: v.id("universes"),
    title: v.string(),
    description: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    order: v.optional(v.number()),
  }).index("by_universe", ["universeId"]),

  chapters: defineTable({
    bookId: v.id("books"),
    title: v.string(),
    contentTr: v.string(),
    contentEn: v.string(),
    order: v.number(),
    views: v.optional(v.number()),
    likeCount: v.optional(v.number()),
  }).index("by_book", ["bookId"]),

  sessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  likes: defineTable({
    targetId: v.union(v.id("loreEntries"), v.id("chapters")),
    clientId: v.string(),
  }).index("by_target_and_client", ["targetId", "clientId"]),

  comments: defineTable({
    targetId: v.union(v.id("loreEntries"), v.id("chapters")),
    name: v.string(),
    email: v.string(),
    content: v.string(),
    createdAt: v.number(),
    clientId: v.optional(v.string()),
  }).index("by_target", ["targetId"]),

  writerRequests: defineTable({
    name: v.string(),
    email: v.string(),
    message: v.optional(v.string()),
    createdAt: v.number(),
  }),
});
