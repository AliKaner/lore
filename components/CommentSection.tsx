"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocale } from "@/hooks/useLocale";

type CommentSectionProps = {
  targetId: Id<"loreEntries"> | Id<"chapters">;
  initialLikeCount: number;
  viewsCount: number;
};

export default function CommentSection({
  targetId,
  initialLikeCount,
  viewsCount,
}: CommentSectionProps) {
  const { t } = useLocale();
  const [clientId, setClientId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Initialize client ID fingerprint
  useEffect(() => {
    let id = localStorage.getItem("lore_wiki_client_id");
    if (!id) {
      id = "client_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("lore_wiki_client_id", id);
    }
    setClientId(id);

    // Autofill name and email if previously submitted
    const savedName = localStorage.getItem("lore_wiki_user_name");
    const savedEmail = localStorage.getItem("lore_wiki_user_email");
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // Convex hooks
  const comments = useQuery(api.comments.listByTarget, { targetId });
  const isLiked = useQuery(
    api.likes.checkLiked,
    clientId ? { targetId, clientId } : "skip"
  );
  const toggleLike = useMutation(api.likes.toggle);
  const addComment = useMutation(api.comments.add);

  const handleLike = async () => {
    if (!clientId) return;
    try {
      await toggleLike({ targetId, clientId });
    } catch (err: any) {
      console.error("Like error:", err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || name.trim().length < 2) {
      setError(t("comments.errNameLength"));
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("comments.errEmail"));
      return;
    }
    if (!content.trim() || content.trim().length < 3) {
      setError(t("comments.errContentLength"));
      return;
    }

    setSubmitting(true);
    try {
      await addComment({
        targetId,
        name: name.trim(),
        email: email.trim(),
        content: content.trim(),
        clientId,
      });

      // Save user details for next time
      localStorage.setItem("lore_wiki_user_name", name.trim());
      localStorage.setItem("lore_wiki_user_email", email.trim());

      setContent("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      // Capture Convex errors (like rate-limiting warnings)
      const errMsg = err.message || "";
      if (errMsg.includes("bekleyin")) {
        setError(t("comments.errCooldown"));
      } else {
        setError(errMsg.replace("ConvexError: ", "") || t("comments.errGeneric"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t border-white/20 pt-8">
      {/* Stats Bar (Likes & Views) */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className={`px-5 py-2.5 rounded-lg font-semibold tracking-wider font-title cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border-4 border-double ${
              isLiked
                ? "bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-red-600/70 text-red-200 hover:text-red-100 hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.45)]"
                : "bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-amber-600/70 text-amber-200 hover:text-amber-100 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)]"
            }`}
          >
            <svg
              className={`w-4 h-4 mr-2 transition-transform duration-300 ${
                isLiked ? "scale-110 fill-current text-red-500" : "text-amber-400"
              }`}
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span className="text-xs">
              {t("comments.likes", { count: initialLikeCount })}
            </span>
          </button>
          <div className="text-gray-400 text-sm font-text">
            👁️ <span className="text-white font-semibold">{viewsCount}</span> {t("comments.viewsLabel")}
          </div>
        </div>
      </div>

      {/* Yorum Yap Formu */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold text-white font-title mb-4">{t("comments.leaveComment")}</h3>
        <form onSubmit={handleCommentSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-text uppercase mb-1">
                {t("comments.name")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("comments.namePlaceholder")}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-text focus:outline-none focus:border-blue-500 transition-colors"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 font-text uppercase mb-1">
                {t("comments.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("comments.emailPlaceholder")}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-text focus:outline-none focus:border-blue-500 transition-colors"
                disabled={submitting}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 font-text uppercase mb-1">
              {t("comments.yourComment")}
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("comments.commentPlaceholder")}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-text focus:outline-none focus:border-blue-500 transition-colors resize-none"
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm font-text">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm font-text">
              ✅ {t("comments.successMsg")}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-4 border-double border-amber-600/70 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] text-amber-200 hover:text-amber-100 text-xs font-semibold tracking-wider font-title cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mr-2" />
                {t("comments.submitting")}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                  <line x1="16" y1="8" x2="2" y2="22" />
                  <line x1="17.5" y1="15" x2="9" y2="15" />
                </svg>
                {t("comments.submit")}
              </>
            )}
          </button>
        </form>
      </div>

      {/* Yorumlar Listesi */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white font-title mb-6">
          {t("comments.title", { count: comments?.length ?? 0 })}
        </h3>

        {comments === undefined && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {comments !== undefined && comments.length === 0 && (
          <p className="text-gray-500 text-center font-text py-8 bg-white/5 rounded-xl border border-white/5">
            {t("comments.empty")}
          </p>
        )}

        {comments && comments.length > 0 && (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 hover:border-white/20 transition-all duration-200"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-300 font-title text-sm">
                    {comment.name}
                  </span>
                  <span className="text-xs text-gray-500 font-text">
                    {new Date(comment.createdAt).toLocaleDateString("tr-TR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-gray-300 font-text text-sm whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
