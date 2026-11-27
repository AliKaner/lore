import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { bookLanguageValidator, writingKindValidator } from "./writingKinds";
import { entityKindValidator } from "./entityKinds";
import { themeValidator } from "./themes";

export default defineSchema({
  users: defineTable({
    bio: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    wallpaperStorageId: v.optional(v.id("_storage")),
    // The colour theme they picked; follows them to every device.
    theme: v.optional(themeValidator),
    // Daily goals (words written, minutes read) and the device's UTC offset
    // in minutes, so a day is the writer's own day.
    writingGoal: v.optional(v.number()),
    readingGoal: v.optional(v.number()),
    tzOffset: v.optional(v.number()),
    xp: v.number(),
    level: v.number(),
  }),

  books: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    coverStorageId: v.optional(v.id("_storage")),
    ownerId: v.id("users"),
    kind: v.optional(writingKindValidator),
    // Unset on older writings: the writer's interface language stands in.
    language: v.optional(bookLanguageValidator),
    visibility: v.union(v.literal("public"), v.literal("private")),
    rootChapterId: v.optional(v.id("chapters")),
    likeCount: v.number(),
    shareCount: v.number(),
    createdAt: v.number(),
    // The writer's desk, kept up to date by chapters.create/update/remove for
    // the owner's own chapters.
    wordCount: v.optional(v.number()),
    chapterCount: v.optional(v.number()),
    lastEditedAt: v.optional(v.number()),
    lastEditedChapterId: v.optional(v.id("chapters")),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_and_edited", ["ownerId", "lastEditedAt"])
    .index("by_visibility", ["visibility"])
    .index("by_visibility_and_kind", ["visibility", "kind"])
    .index("by_root_chapter", ["rootChapterId"]),

  chapters: defineTable({
    bookId: v.id("books"),
    parentChapterId: v.optional(v.id("chapters")),
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    order: v.number(),
    isCanonical: v.boolean(),
    status: v.union(v.literal("draft"), v.literal("published")),
    words: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    likeCount: v.number(),
    shareCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_book", ["bookId"])
    .index("by_book_and_parent", ["bookId", "parentChapterId"])
    .index("by_author", ["authorId"]),

  // What a writer did on one of their days (YYYY-MM-DD, their time zone):
  // net words written and seconds spent reading. See convex/goals.ts.
  dailyActivity: defineTable({
    userId: v.id("users"),
    day: v.string(),
    wordsWritten: v.number(),
    secondsRead: v.number(),
    lastReadAt: v.optional(v.number()),
  }).index("by_user_and_day", ["userId", "day"]),

  // Earlier states of a chapter, so a writer can go back. Written by
  // chapters.update before it overwrites the text.
  chapterVersions: defineTable({
    chapterId: v.id("chapters"),
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    words: v.number(),
    reason: v.union(v.literal("edit"), v.literal("publish")),
    createdAt: v.number(),
  }).index("by_chapter_and_time", ["chapterId", "createdAt"]),

  // Everything with a name in a writer's world: characters, places,
  // countries, races, weapons… The kind decides the form (convex/entityKinds.ts).
  entities: defineTable({
    kind: entityKindValidator,
    name: v.string(),
    summary: v.optional(v.string()),
    // Plain values of the kind's fields, by key.
    fields: v.record(v.string(), v.string()),
    // Fields the writer added themselves.
    custom: v.array(v.object({ label: v.string(), value: v.string() })),
    // The gallery (no slot; the first is the portrait) and pictures with a
    // purpose, like a country's map (slot = the field key).
    images: v.array(
      v.object({ storageId: v.id("_storage"), slot: v.optional(v.string()) }),
    ),
    creatorId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_creator_and_kind", ["creatorId", "kind"]),

  // The writer's side boards on the writing screen, one pair per writer and
  // writing: notes, checklists, pinned entities and pictures.
  boardItems: defineTable({
    ownerId: v.id("users"),
    bookId: v.id("books"),
    side: v.union(v.literal("left"), v.literal("right")),
    order: v.number(),
    kind: v.union(v.literal("note"), v.literal("checklist"), v.literal("entity"), v.literal("image")),
    title: v.optional(v.string()),
    text: v.optional(v.string()),
    items: v.optional(v.array(v.object({ text: v.string(), done: v.boolean() }))),
    entityId: v.optional(v.id("entities")),
    storageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  })
    .index("by_owner_and_book", ["ownerId", "bookId"])
    .index("by_book", ["bookId"])
    .index("by_entity", ["entityId"]),

  // A link field's value: from one entity to another, under the field's key.
  entityLinks: defineTable({
    creatorId: v.id("users"),
    fromId: v.id("entities"),
    role: v.string(),
    toId: v.id("entities"),
  })
    .index("by_from_and_role", ["fromId", "role"])
    .index("by_to", ["toId"]),

  // Which writings an entity is part of; its name is highlighted there.
  bookEntities: defineTable({
    bookId: v.id("books"),
    entityId: v.id("entities"),
  })
    .index("by_book", ["bookId"])
    .index("by_book_and_entity", ["bookId", "entityId"])
    .index("by_entity", ["entityId"]),

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
    targetType: v.union(v.literal("book"), v.literal("entity")),
    targetId: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_target", ["userId", "targetType", "targetId"])
    .index("by_target", ["targetType", "targetId"]),

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
    .index("by_user_and_book", ["userId", "bookId"])
    .index("by_chapter", ["chapterId"]),

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
