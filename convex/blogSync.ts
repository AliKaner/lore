import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { tiptapJsonToMarkdown } from "../lib/tiptapMarkdown";

/**
 * Publishes/updates a lore document as a post on the separate personal-site
 * Convex deployment (see BLOG_CONVEX_URL / BLOG_ADMIN_PASSWORD). The two
 * projects have independent databases — we never share an Id across them,
 * only the post's own `_id` string, which we remember on the lore document
 * (`blogPostId`) so later syncs update the same post instead of duplicating it.
 */
export const publish = action({
  args: {
    accessToken: v.optional(v.string()),
    id: v.id("documents"),
    title: v.string(),
    slug: v.string(),
    published: v.boolean(),
  },
  handler: async (ctx, { accessToken, id, title, slug, published }): Promise<{ blogPostId: string; blogSlug: string }> => {
    await ctx.runQuery(internal.access.checkOwner, { accessToken });

    const blogUrl = process.env.BLOG_CONVEX_URL;
    const blogPassword = process.env.BLOG_ADMIN_PASSWORD;
    if (!blogUrl || !blogPassword) throw new Error("Blog bağlantısı yapılandırılmamış (BLOG_CONVEX_URL / BLOG_ADMIN_PASSWORD).");

    const doc = await ctx.runQuery(internal.notebook.getInternal, { id });
    if (!doc) throw new Error("Yazı bulunamadı.");
    const body = tiptapJsonToMarkdown(doc.content);
    if (!body.trim()) throw new Error("Boş yazı yayınlanamaz.");

    const client = new ConvexHttpClient(blogUrl);
    const { token } = await client.mutation(anyApi.adminSessions.login, { password: blogPassword });

    const publishedAt = doc.blogPublishedAt ?? Date.now();
    let blogPostId: string = doc.blogPostId ?? "";

    if (blogPostId) {
      await client.mutation(anyApi.posts.update, { token, id: blogPostId, title, slug, body, publishedAt, published });
    } else {
      blogPostId = (await client.mutation(anyApi.posts.create, { token, title, slug, body, publishedAt, published })) as string;
    }

    await ctx.runMutation(internal.notebook.markBlogSynced, {
      id,
      blogPostId,
      blogSlug: slug,
      blogPublished: published,
      blogPublishedAt: publishedAt,
    });

    return { blogPostId, blogSlug: slug };
  },
});
