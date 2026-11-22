import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useAuth } from "../features/auth/AuthContext";
import FamilyNav from "../components/FamilyNav";
import DemoRoleSwitcher from "../components/DemoRoleSwitcher";
import {
  listJournalEntries,
  createJournalEntry,
  addJournalComment,
} from "../lib/demoStore";
import type { FamilyJournalEntry, JournalCategory } from "../lib/types";

const CATEGORY_LABELS: Record<JournalCategory, { label: string; badgeClass: string }> = {
  visit_summary: {
    label: "Visit Summary",
    badgeClass: "bg-forest/10 text-forest border-forest/30",
  },
  milestone: {
    label: "Milestone",
    badgeClass: "bg-sage/40 text-charcoal border-sage",
  },
  health_observation: {
    label: "Health Observation",
    badgeClass: "bg-coral/20 text-charcoal border-coral/40",
  },
  daily_note: {
    label: "Daily Note",
    badgeClass: "bg-ivory border-sage text-charcoal",
  },
  photo_memory: {
    label: "Photo Memory",
    badgeClass: "bg-forest text-ivory border-forest",
  },
};

export default function FamilyJournalPage() {
  const { user, family, elder } = useAuth();
  const reduceMotion = useReducedMotion();

  const [entries, setEntries] = useState<FamilyJournalEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<JournalCategory | "all">("all");
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<JournalCategory>("visit_summary");
  const [attachmentName, setAttachmentName] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const familyId = family?.id ?? null;
  const elderId = elder?.id ?? null;

  useEffect(() => {
    if (!familyId) return;
    setEntries(listJournalEntries(familyId));
  }, [familyId]);

  const filteredEntries =
    selectedCategory === "all"
      ? entries
      : entries.filter((e) => e.category === selectedCategory);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !elderId || !user) return;
    setError(null);

    try {
      const newEntry = createJournalEntry({
        familyId,
        elderId,
        authorId: user.id,
        authorName: user.full_name || user.email,
        title,
        content,
        category,
        attachmentName: attachmentName ? attachmentName : null,
      });

      setEntries([newEntry, ...entries]);
      setTitle("");
      setContent("");
      setAttachmentName("");
      setIsCreating(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create journal entry.");
    }
  };

  const handleAddComment = (entryId: string) => {
    const text = commentInputs[entryId]?.trim();
    if (!text || !user) return;

    try {
      const newComment = addJournalComment({
        entryId,
        authorId: user.id,
        authorName: user.full_name || user.email,
        comment: text,
      });

      setEntries(
        entries.map((entry) => {
          if (entry.id === entryId) {
            return {
              ...entry,
              comments: [...(entry.comments || []), newComment],
            };
          }
          return entry;
        })
      );

      setCommentInputs({ ...commentInputs, [entryId]: "" });
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <DemoRoleSwitcher />
      <FamilyNav />

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sage/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-forest animate-pulse" />
              <h1 className="font-serif text-3xl font-bold text-forest sm:text-4xl">
                Family Journal
              </h1>
            </div>
            <p className="mt-2 text-sm sm:text-base text-charcoal/80 max-w-2xl leading-relaxed">
              A private, sacred family space for notes, photos, visit summaries and shared memories.
              Keeps family members connected across miles without WhatsApp chaos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            className="rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-ivory hover:bg-forest/90 transition-all shadow-sm shrink-0 flex items-center gap-2"
          >
            <span>{isCreating ? "✕ Cancel" : "+ Add Family Moment"}</span>
          </button>
        </div>

        {/* Private Family Badge */}
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-forest/20 bg-forest/5 px-3.5 py-2 text-xs text-forest">
          <span className="font-bold">🔒 Private Family Vault:</span>
          <span>
            Only verified family members can read or comment in this journal.
          </span>
        </div>

        {/* Create Entry Drawer */}
        {isCreating && (
          <motion.form
            onSubmit={handleCreateEntry}
            initial={reduceMotion ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-sage bg-white p-6 shadow-md space-y-4"
          >
            <h2 className="font-serif text-xl font-bold text-forest">
              Record a Family Moment or Visit Summary
            </h2>

            {error && (
              <div className="rounded-lg bg-coral/20 p-3 text-xs text-charcoal border border-coral/40">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="journal-title" className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
                Title / Headline
              </label>
              <input
                id="journal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunday chai & video call with Papa"
                className="w-full rounded-lg border border-sage px-3.5 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-ivory/30"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="journal-category" className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  id="journal-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as JournalCategory)}
                  className="w-full rounded-lg border border-sage px-3.5 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                >
                  <option value="visit_summary">Visit Summary</option>
                  <option value="milestone">Milestone / Progress</option>
                  <option value="health_observation">Health Observation</option>
                  <option value="daily_note">Daily Note</option>
                  <option value="photo_memory">Photo Memory</option>
                </select>
              </div>

              <div>
                <label htmlFor="journal-attachment" className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
                  Attach Photo / Media (Optional)
                </label>
                <input
                  id="journal-attachment"
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="e.g. nana-balcony-plants.jpg"
                  className="w-full rounded-lg border border-sage px-3.5 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-ivory/30"
                />
              </div>
            </div>

            <div>
              <label htmlFor="journal-content" className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-1">
                Details & Reflection
              </label>
              <textarea
                id="journal-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Share how your parent was feeling, things they enjoyed, or observations for siblings..."
                className="w-full rounded-lg border border-sage px-3.5 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-ivory/30"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded-lg border border-sage px-4 py-2 text-sm font-medium hover:bg-sage/20"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-forest px-5 py-2 text-sm font-semibold text-ivory hover:bg-forest/90"
              >
                Publish to Family
              </button>
            </div>
          </motion.form>
        )}

        {/* Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
              selectedCategory === "all"
                ? "bg-forest text-ivory"
                : "bg-white border border-sage text-charcoal hover:bg-sage/20"
            }`}
          >
            All Updates ({entries.length})
          </button>
          {(Object.keys(CATEGORY_LABELS) as JournalCategory[]).map((cat) => {
            const count = entries.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-forest text-ivory"
                    : "bg-white border border-sage text-charcoal hover:bg-sage/20"
                }`}
              >
                {CATEGORY_LABELS[cat].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Entries Feed */}
        <div className="mt-8 space-y-6">
          {filteredEntries.length === 0 ? (
            <div className="rounded-xl border border-sage bg-white p-10 text-center">
              <p className="font-serif text-lg text-forest">No journal updates in this category yet.</p>
              <p className="mt-2 text-sm text-charcoal/70">
                Share a visit summary, daily update or photo to build your family&apos;s memory archive.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const meta = CATEGORY_LABELS[entry.category] || CATEGORY_LABELS.daily_note;
              return (
                <article
                  key={entry.id}
                  className="rounded-xl border border-sage/80 bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-sage/30 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-ivory font-bold text-xs">
                        {entry.author_name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-forest">{entry.author_name}</p>
                        <time className="text-xs text-charcoal/60" dateTime={entry.created_at}>
                          {new Date(entry.created_at).toLocaleDateString([], {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at{" "}
                          {new Date(entry.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div>
                    <h2 className="font-serif text-xl font-bold text-forest">{entry.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-charcoal whitespace-pre-line">
                      {entry.content}
                    </p>
                  </div>

                  {entry.attachment_name && (
                    <div className="rounded-lg border border-sage/60 bg-ivory/50 p-3 flex items-center gap-3 text-xs">
                      <span className="text-forest text-base">📷</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-forest truncate">{entry.attachment_name}</p>
                        <p className="text-charcoal/60 text-[11px]">Protected family attachment</p>
                      </div>
                      <span className="rounded bg-sage/30 px-2 py-0.5 font-medium text-[10px]">
                        Saved in Vault
                      </span>
                    </div>
                  )}

                  {/* Comments section */}
                  <div className="border-t border-sage/30 pt-4 space-y-3">
                    <h3 className="text-xs font-semibold text-charcoal/70 uppercase tracking-wider">
                      Family Comments ({entry.comments?.length || 0})
                    </h3>

                    {entry.comments && entry.comments.length > 0 && (
                      <div className="space-y-2 bg-ivory/40 p-3 rounded-lg border border-sage/40">
                        {entry.comments.map((comment) => (
                          <div key={comment.id} className="text-xs">
                            <span className="font-bold text-forest">{comment.author_name}: </span>
                            <span className="text-charcoal">{comment.comment}</span>
                            <span className="block text-[10px] text-charcoal/50 mt-0.5">
                              {new Date(comment.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline comment form */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[entry.id] || ""}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [entry.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddComment(entry.id);
                          }
                        }}
                        placeholder="Add a family note or response..."
                        className="flex-1 rounded-lg border border-sage px-3 py-1.5 text-xs focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(entry.id)}
                        className="rounded-lg bg-sage px-3 py-1.5 text-xs font-semibold text-charcoal hover:bg-forest hover:text-ivory transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
