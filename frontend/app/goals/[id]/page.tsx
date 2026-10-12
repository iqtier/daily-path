'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'motion/react';
import Navbar from '@/components/Navbar';
import {
  EmptyState,
  LoadingState,
  inputClass,
  primaryButtonClass,
  quietButtonClass,
  iconButtonClass,
} from '@/components/ui';
import {
  getGoal,
  getGoalHistory,
  getGoalNotes,
  addGoalNote,
  updateGoalNote,
  deleteGoalNote,
} from '@/lib/api';
import { Goal, GoalTodoHistoryItem, GoalNote } from '@/lib/types';
import { ACCENT_CLASS, CATEGORY_META } from '@/lib/category-theme';
import { localDateKey } from '@/lib/formatters';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Calendar,
  BookOpen,
  PenLine,
  Pencil,
  Plus,
  Trash2,
  History,
  Layers,
  X,
  Check,
} from 'lucide-react';
import { Cairn, Summit } from '@/components/icons';

/** "Thu, Oct 8" from a YYYY-MM-DD key, parsed as a local date. */
function formatDateHeader(dateKey: string): string {
  try {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateKey;
  }
}

/** Date only; the app never shows clock times. */
function formatNoteDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

type Tab = 'notes' | 'history' | 'timeline';

type TimelineItem =
  | { type: 'todo'; data: GoalTodoHistoryItem; timestamp: number; dateKey: string }
  | { type: 'note'; data: GoalNote; timestamp: number; dateKey: string };

function DateHeader({ dateKey }: { dateKey: string }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-ink-muted px-1">
      <Calendar className="w-3.5 h-3.5" />
      {formatDateHeader(dateKey)}
    </h3>
  );
}

function TodoCard({ item, showKind = false }: { item: GoalTodoHistoryItem; showKind?: boolean }) {
  const minutes =
    item.timeSpentSeconds !== undefined && item.timeSpentSeconds > 0
      ? Math.round(item.timeSpentSeconds / 60)
      : null;
  return (
    <div className="rounded-3xl bg-surface p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-good-soft text-good flex items-center justify-center">
          <Check className="w-4 h-4 stroke-[3]" />
        </span>
        <div className="flex-1 min-w-0 space-y-0.5">
          {showKind && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-good">Step done</span>
          )}
          <p className="text-sm sm:text-base font-bold leading-snug">{item.title}</p>
          {item.description && <p className="text-sm text-ink-muted leading-relaxed">{item.description}</p>}
        </div>
        {minutes !== null && (
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-ink-muted bg-sunk px-2.5 py-1 rounded-full tabular-nums">
            <Clock className="w-3 h-3" />
            {minutes} min
          </span>
        )}
      </div>
    </div>
  );
}

/** Goal detail: completed to-dos, notes and reflections, and a combined timeline. */
export default function GoalDetailPage() {
  const params = useParams();
  const goalId = params?.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [history, setHistory] = useState<GoalTodoHistoryItem[]>([]);
  const [notes, setNotes] = useState<GoalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('notes');

  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    let active = true;
    if (!goalId) return;

    Promise.all([getGoal(goalId), getGoalHistory(goalId), getGoalNotes(goalId)])
      .then(([goalData, historyData, notesData]) => {
        if (active) {
          setGoal(goalData);
          setHistory(historyData);
          setNotes(notesData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load goal details:', err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [goalId]);

  const handleFocusNewNote = () => {
    setActiveTab('notes');
    // Wait for the notes tab to render before focusing its composer.
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !goalId || isSubmittingNote) return;

    setIsSubmittingNote(true);
    setNoteError(null);
    try {
      const created = await addGoalNote(goalId, newNoteContent);
      setNotes((prev) => [created, ...prev]);
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to add note:', err);
      setNoteError("Couldn't save that note. Your text is still here, so try again.");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleStartEdit = (note: GoalNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim() || !goalId || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      const updated = await updateGoalNote(goalId, noteId, editContent);
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingNoteId(null);
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!goalId) return;
    if (confirm('Delete this reflection?')) {
      try {
        await deleteGoalNote(goalId, noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err) {
        console.error('Failed to delete note:', err);
      }
    }
  };

  // Grouped by the item's `date` field (the user's local day), never by completedAt.
  const groupedHistory = useMemo(() => {
    const groups: Record<string, GoalTodoHistoryItem[]> = {};
    const sorted = [...history].sort(
      (a, b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime()
    );
    for (const item of sorted) {
      (groups[item.date] ??= []).push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [history]);

  const combinedTimelineByDate = useMemo(() => {
    const items: TimelineItem[] = [
      ...history.map((h) => ({
        type: 'todo' as const,
        data: h,
        timestamp: new Date(h.completedAt || h.date).getTime(),
        dateKey: h.date,
      })),
      // Notes have no date field, so use the local calendar day of creation (not the UTC one).
      ...notes.map((n) => ({
        type: 'note' as const,
        data: n,
        timestamp: new Date(n.createdAt).getTime(),
        dateKey: localDateKey(new Date(n.createdAt)),
      })),
    ];
    items.sort((a, b) => b.timestamp - a.timestamp);

    const groups: Record<string, TimelineItem[]> = {};
    for (const item of items) {
      (groups[item.dateKey] ??= []).push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [history, notes]);

  const tabs: { value: Tab; label: string; short: string; icon: typeof BookOpen; count?: number }[] = [
    { value: 'notes', label: 'Notes & reflections', short: 'Notes', icon: BookOpen, count: notes.length },
    { value: 'history', label: 'Step history', short: 'History', icon: History, count: history.length },
    { value: 'timeline', label: 'Timeline', short: 'Timeline', icon: Layers },
  ];

  const meta = goal ? (CATEGORY_META[goal.category] ?? CATEGORY_META.other) : null;
  const CategoryIcon = meta?.icon ?? Summit;

  return (
    <div className="min-h-screen bg-canvas text-ink pb-28 md:pb-12">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-muted hover:text-ink transition-colors rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          All goals
        </Link>

        {isLoading && <LoadingState message="Opening this goal…" />}

        {!isLoading && !goal && (
          <EmptyState
            icon={Summit}
            title="We couldn't find that goal"
            body="It may have been deleted, or the link is out of date."
            action={
              <Link href="/goals" className={primaryButtonClass}>
                Back to goals
              </Link>
            }
          />
        )}

        {!isLoading && goal && meta && (
          <>
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className={`${ACCENT_CLASS[goal.category] ?? ACCENT_CLASS.other} relative overflow-hidden rounded-[2rem] bg-surface p-5 sm:p-7 shadow-glow`}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none bg-[radial-gradient(110%_80%_at_100%_0%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_60%)]"
              />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-accent-gradient text-on-accent flex items-center justify-center shadow-soft">
                    <CategoryIcon className="w-6 h-6" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-accent-ink">{meta.label}</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full capitalize bg-sunk text-ink-muted">
                      {goal.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug text-balance">
                    {goal.title}
                  </h1>
                  {goal.details && (
                    <p className="text-sm sm:text-base text-ink-muted mt-2 leading-relaxed">{goal.details}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold bg-accent/15 text-accent-ink px-3 py-1.5 rounded-full">
                    <Cairn className="w-4 h-4" />
                    <span className="tabular-nums">{goal.completedTodoCount}</span> steps done
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold bg-sunk text-ink-muted px-3 py-1.5 rounded-full">
                    <BookOpen className="w-4 h-4" />
                    <span className="tabular-nums">{notes.length}</span> reflections
                  </span>
                  <button
                    type="button"
                    onClick={handleFocusNewNote}
                    className="sm:ml-auto inline-flex items-center gap-1.5 text-sm font-extrabold text-canvas bg-ink px-3.5 py-1.5 rounded-full transition-transform hover:-translate-y-0.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    Add reflection
                  </button>
                </div>
              </div>
            </motion.section>

            <div className="space-y-5">
              <div role="group" aria-label="Choose a view" className="flex items-center gap-1 bg-sunk p-1 rounded-2xl">
                {tabs.map(({ value, label, short, icon: Icon, count }) => {
                  const selected = activeTab === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setActiveTab(value)}
                      aria-pressed={selected}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-sm font-bold transition-all ${
                        selected ? 'bg-surface text-ink shadow-soft' : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="sm:hidden">{short}</span>
                      <span className="hidden sm:inline">{label}</span>
                      {count !== undefined && (
                        <span className="text-[11px] px-1.5 rounded-full bg-canvas text-ink-muted tabular-nums">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddNote} className="rounded-3xl bg-surface p-4 sm:p-5 shadow-soft space-y-3">
                    <label
                      htmlFor="new-note"
                      className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-ink-muted"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      Jot something down
                    </label>
                    <textarea
                      id="new-note"
                      ref={textareaRef}
                      rows={3}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="What clicked? What would you change next time?"
                      className={`${inputClass} resize-none leading-relaxed`}
                    />
                    {noteError && (
                      <p role="alert" className="text-sm font-semibold text-danger">
                        {noteError}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-ink-muted">Saved to this goal.</span>
                      <button
                        type="submit"
                        disabled={!newNoteContent.trim() || isSubmittingNote}
                        className={primaryButtonClass}
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        {isSubmittingNote ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </form>

                  {notes.length === 0 ? (
                    <EmptyState
                      icon={PenLine}
                      title="No reflections yet"
                      body="Little notes add up. Write down what's working, what's not, or a win worth remembering."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {notes.map((note) => {
                        const isEditing = editingNoteId === note.id;
                        return (
                          <li key={note.id} className="rounded-3xl bg-surface p-4 sm:p-5 shadow-soft space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="inline-flex items-center gap-1.5 font-bold text-ink-muted">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatNoteDate(note.createdAt)}
                              </span>
                              {!isEditing && (
                                <div className="flex items-center -mr-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(note)}
                                    className={iconButtonClass}
                                    aria-label="Edit reflection"
                                    title="Edit reflection"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-2 rounded-xl text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
                                    aria-label="Delete reflection"
                                    title="Delete reflection"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={3}
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  aria-label="Edit reflection text"
                                  autoFocus
                                  className={`${inputClass} resize-none leading-relaxed`}
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button type="button" onClick={() => setEditingNoteId(null)} className={quietButtonClass}>
                                    <X className="w-4 h-4" />
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!editContent.trim() || isSavingEdit}
                                    onClick={() => handleSaveEdit(note.id)}
                                    className={primaryButtonClass}
                                  >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    {isSavingEdit ? 'Saving…' : 'Save'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-5">
                  {groupedHistory.length === 0 ? (
                    <EmptyState
                      icon={CheckCircle2}
                      title="No steps finished yet"
                      body="When you complete a daily step linked to this goal, it shows up here."
                    />
                  ) : (
                    groupedHistory.map(([dateKey, items]) => (
                      <section key={dateKey} className="space-y-2.5">
                        <DateHeader dateKey={dateKey} />
                        {items.map((item) => (
                          <TodoCard key={item.id} item={item} />
                        ))}
                      </section>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-5">
                  {combinedTimelineByDate.length === 0 ? (
                    <EmptyState
                      icon={Layers}
                      title="Nothing here yet"
                      body="Finished steps and your reflections will line up here, day by day."
                    />
                  ) : (
                    combinedTimelineByDate.map(([dateKey, items]) => (
                      <section key={dateKey} className="space-y-2.5">
                        <DateHeader dateKey={dateKey} />
                        {items.map((item) =>
                          item.type === 'todo' ? (
                            <TodoCard key={`todo_${item.data.id}`} item={item.data} showKind />
                          ) : (
                            <div
                              key={`note_${item.data.id}`}
                              className="rounded-3xl bg-warn-soft/60 border border-warn/20 p-4 space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-warn">
                                  Reflection
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(item.data.id)}
                                  className="p-1.5 -m-1.5 rounded-lg text-ink-muted hover:text-danger transition-colors"
                                  aria-label="Delete reflection"
                                  title="Delete reflection"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.data.content}</p>
                            </div>
                          )
                        )}
                      </section>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
