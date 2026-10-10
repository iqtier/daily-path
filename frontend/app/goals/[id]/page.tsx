'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  getGoal,
  getGoalHistory,
  getGoalNotes,
  addGoalNote,
  updateGoalNote,
  deleteGoalNote,
} from '@/lib/api';
import {
  Goal,
  GoalTodoHistoryItem,
  GoalNote,
  GoalCategory,
} from '@/lib/types';
import {
  ArrowLeft,
  Target,
  CheckCircle2,
  Clock,
  Calendar,
  CheckCheck,
  BookOpen,
  PenLine,
  Pencil,
  Plus,
  Trash2,
  History,
  Sparkles,
  Layers,
  X,
  Check,
} from 'lucide-react';

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  learning: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  fitness: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  career: 'bg-sky-50 text-sky-700 border-sky-200',
  health: 'bg-teal-50 text-teal-700 border-teal-200',
  personal: 'bg-amber-50 text-amber-700 border-amber-200',
  other: 'bg-stone-100 text-stone-700 border-stone-200',
};

/**
 * Format date string (YYYY-MM-DD) into header format like "Thu, Oct 8"
 */
function formatHistoryDateHeader(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format timestamp into friendly date like "Oct 8, 2026 • 5:30 PM"
 */
function formatNoteDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Extract YYYY-MM-DD from ISO timestamp
 */
function getIsoDateKey(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

type TimelineItem =
  | { type: 'todo'; data: GoalTodoHistoryItem; timestamp: number; dateKey: string }
  | { type: 'note'; data: GoalNote; timestamp: number; dateKey: string };

/**
 * GoalDetailPage
 * Displays goal details, completed daily to-dos history, and
 * text-based notes/reflections specifically tied to the goal.
 */
export default function GoalDetailPage() {
  const params = useParams();
  const goalId = params?.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [history, setHistory] = useState<GoalTodoHistoryItem[]>([]);
  const [notes, setNotes] = useState<GoalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab: 'timeline' (combined), 'history' (only tasks), or 'notes' (only reflections)
  const [activeTab, setActiveTab] = useState<'timeline' | 'history' | 'notes'>('notes');

  // New note form state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Editing existing note state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    let active = true;
    if (!goalId) return;

    Promise.all([
      getGoal(goalId),
      getGoalHistory(goalId),
      getGoalNotes(goalId),
    ])
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

  // Jump to note composer and focus
  const handleFocusNewNote = () => {
    setActiveTab('notes');
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Handle adding a new note/reflection
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !goalId || isSubmittingNote) return;

    setIsSubmittingNote(true);
    try {
      const created = await addGoalNote(goalId, newNoteContent);
      setNotes((prev) => [created, ...prev]);
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Start editing a note
  const handleStartEdit = (note: GoalNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  // Save edited note
  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim() || !goalId || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      const updated = await updateGoalNote(goalId, noteId, editContent);
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? updated : n))
      );
      setEditingNoteId(null);
    } catch (err) {
      console.error('Failed to update note:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle deleting a note
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

  // Group history items by date (newest first)
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, GoalTodoHistoryItem[]> = {};

    const sorted = [...history].sort((a, b) => {
      return (
        new Date(b.completedAt || b.date).getTime() -
        new Date(a.completedAt || a.date).getTime()
      );
    });

    for (const item of sorted) {
      const dateKey = item.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    }

    return Object.entries(groups).sort(
      ([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  }, [history]);

  // Combined timeline of completed to-dos and reflection notes
  const combinedTimelineByDate = React.useMemo(() => {
    const items: TimelineItem[] = [
      ...history.map((h) => ({
        type: 'todo' as const,
        data: h,
        timestamp: new Date(h.completedAt || h.date).getTime(),
        dateKey: h.date,
      })),
      ...notes.map((n) => ({
        type: 'note' as const,
        data: n,
        timestamp: new Date(n.createdAt).getTime(),
        dateKey: getIsoDateKey(n.createdAt),
      })),
    ];

    // Sort newest first
    items.sort((a, b) => b.timestamp - a.timestamp);

    // Group by dateKey
    const groups: Record<string, TimelineItem[]> = {};
    for (const item of items) {
      if (!groups[item.dateKey]) {
        groups[item.dateKey] = [];
      }
      groups[item.dateKey].push(item);
    }

    return Object.entries(groups).sort(
      ([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  }, [history, notes]);

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 pb-24 md:pb-12">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Back Button */}
        <div>
          <Link
            href="/goals"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Goals</span>
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-16 text-center text-stone-600 text-sm">
            Loading goal details...
          </div>
        )}

        {/* Goal Not Found */}
        {!isLoading && !goal && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center space-y-3">
            <Target className="w-8 h-8 mx-auto text-stone-400 stroke-1" />
            <p className="text-sm font-medium text-stone-800">Goal not found</p>
            <Link
              href="/goals"
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 underline"
            >
              Return to goals list
            </Link>
          </div>
        )}

        {/* Goal Header Card */}
        {!isLoading && goal && (
          <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                    CATEGORY_COLORS[goal.category] ||
                    'bg-stone-100 text-stone-700 border-stone-200'
                  }`}
                >
                  {goal.category}
                </span>

                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full capitalize bg-stone-100 text-stone-700">
                  {goal.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{goal.completedTodoCount} to-dos completed</span>
                </div>

                <div className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 bg-stone-100 border border-stone-200 px-3 py-1 rounded-full">
                  <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                  <span>{notes.length} reflections</span>
                </div>

                <button
                  type="button"
                  onClick={handleFocusNewNote}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:text-black bg-stone-100 hover:bg-stone-200/80 border border-stone-200 px-3 py-1 rounded-full transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Reflection</span>
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 leading-snug">
                {goal.title}
              </h1>
              {goal.details && (
                <p className="text-sm sm:text-base text-stone-600 mt-2 leading-relaxed">
                  {goal.details}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation: Notes & Reflections vs To-Do History vs Combined Timeline */}
        {!isLoading && goal && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === 'notes'
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-stone-600" />
                  <span>Notes & Reflections</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-mono">
                    {notes.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <History className="w-4 h-4 text-stone-600" />
                  <span>To-Do History</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-mono">
                    {history.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    activeTab === 'timeline'
                      ? 'bg-white text-stone-900 shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Layers className="w-4 h-4 text-stone-600" />
                  <span>Combined Timeline</span>
                </button>
              </div>

              {activeTab !== 'notes' && (
                <button
                  type="button"
                  onClick={handleFocusNewNote}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5 text-stone-500" />
                  <span>+ New Reflection</span>
                </button>
              )}
            </div>

            {/* TAB 1: NOTES & REFLECTIONS */}
            {activeTab === 'notes' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Qualitative notes, tactical takeaways, and milestone reflections for this goal.
                  </span>
                  <span>{notes.length} saved</span>
                </div>

                {/* Form to add a new note or reflection */}
                <form
                  onSubmit={handleAddNote}
                  className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-700">
                    <PenLine className="w-3.5 h-3.5 text-stone-500" />
                    <span>Add Note or Reflection</span>
                  </div>

                  <textarea
                    ref={textareaRef}
                    rows={3}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Capture an insight, observation, strategy adjustment, or takeaway about this goal..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 resize-none leading-relaxed placeholder:text-stone-400"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-stone-400">
                      Saved directly to this goal to supplement completed daily tasks
                    </span>
                    <button
                      type="submit"
                      disabled={!newNoteContent.trim() || isSubmittingNote}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isSubmittingNote ? 'Saving...' : 'Save Reflection'}</span>
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                {notes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600 bg-white space-y-2">
                    <Sparkles className="w-7 h-7 mx-auto text-stone-300" />
                    <p className="text-sm font-medium text-stone-800">
                      No reflections or notes yet.
                    </p>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Use this space to jot down adjustments, strategies, or milestones as you progress towards this goal.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => {
                      const isEditing = editingNoteId === note.id;

                      return (
                        <div
                          key={note.id}
                          className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-2.5 transition-all hover:border-stone-300"
                        >
                          {/* Header with date and actions */}
                          <div className="flex items-center justify-between text-xs text-stone-400">
                            <span className="font-medium text-stone-500 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              <span>{formatNoteDateTime(note.createdAt)}</span>
                            </span>

                            {!isEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(note)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                                  title="Edit reflection"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete reflection"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Body or Inline Editor */}
                          {isEditing ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                rows={3}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 resize-none leading-relaxed"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteId(null)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Cancel</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={!editContent.trim() || isSavingEdit}
                                  onClick={() => handleSaveEdit(note.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isSavingEdit ? 'Saving...' : 'Save'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                              {note.content}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TO-DO HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="text-xs text-stone-500">
                  Every daily focus completed towards this goal, grouped by date.
                </div>

                {/* Empty History State */}
                {history.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600 bg-white space-y-2">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-stone-300 stroke-1" />
                    <p className="text-sm font-medium text-stone-800">
                      No completed to-dos for this goal yet.
                    </p>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      When you complete today&apos;s daily to-dos linked to this goal, they will appear here.
                    </p>
                  </div>
                )}

                {/* Grouped History List */}
                {groupedHistory.length > 0 && (
                  <div className="space-y-6">
                    {groupedHistory.map(([dateKey, items]) => (
                      <div key={dateKey} className="space-y-2.5">
                        {/* Date Header (example: "Thu, Oct 8") */}
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 px-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{formatHistoryDateHeader(dateKey)}</span>
                        </div>

                        {/* Items for this date */}
                        <div className="space-y-2.5">
                          {items.map((item) => {
                            const hasTimeSpent =
                              item.timeSpentSeconds !== undefined &&
                              item.timeSpentSeconds > 0;
                            const minutesSpent = hasTimeSpent
                              ? Math.round(item.timeSpentSeconds! / 60)
                              : null;

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-4.5 shadow-xs transition-all space-y-1.5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <div className="mt-0.5 shrink-0 text-emerald-600 bg-emerald-50 rounded-full p-1 border border-emerald-200">
                                      <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                                    </div>
                                    <div className="space-y-1 flex-1 min-w-0">
                                      <h3 className="text-sm sm:text-base font-semibold text-stone-900 leading-snug">
                                        {item.title}
                                      </h3>
                                      {item.description && (
                                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                                          {item.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Time spent if timer was used (example: "22 min") */}
                                  {hasTimeSpent && (
                                    <div className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-stone-700 bg-stone-100 border border-stone-200/80 px-2.5 py-1 rounded-full">
                                      <Clock className="w-3 h-3 text-stone-500" />
                                      <span>{minutesSpent} min</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: COMBINED TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-5">
                <div className="text-xs text-stone-500">
                  Full chronological storyline combining completed tasks with your reflective notes.
                </div>

                {combinedTimelineByDate.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600 bg-white space-y-2">
                    <Layers className="w-7 h-7 mx-auto text-stone-300" />
                    <p className="text-sm font-medium text-stone-800">
                      No activity recorded for this goal yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {combinedTimelineByDate.map(([dateKey, items]) => (
                      <div key={dateKey} className="space-y-3">
                        {/* Date header */}
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 px-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>{formatHistoryDateHeader(dateKey)}</span>
                        </div>

                        {/* Items under this date */}
                        <div className="space-y-2.5">
                          {items.map((item) => {
                            if (item.type === 'todo') {
                              const todo = item.data;
                              const hasTimeSpent =
                                todo.timeSpentSeconds !== undefined &&
                                todo.timeSpentSeconds > 0;
                              const minutesSpent = hasTimeSpent
                                ? Math.round(todo.timeSpentSeconds! / 60)
                                : null;

                              return (
                                <div
                                  key={`timeline_todo_${todo.id}`}
                                  className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-xs space-y-1.5"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                      <div className="mt-0.5 shrink-0 text-emerald-600 bg-emerald-50 rounded-full p-1 border border-emerald-200">
                                        <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                                      </div>
                                      <div className="space-y-0.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                            Task Done
                                          </span>
                                        </div>
                                        <h3 className="text-sm font-semibold text-stone-900 leading-snug">
                                          {todo.title}
                                        </h3>
                                        {todo.description && (
                                          <p className="text-xs text-stone-600 leading-relaxed">
                                            {todo.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {hasTimeSpent && (
                                      <div className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-stone-700 bg-stone-100 border border-stone-200/80 px-2 py-0.5 rounded-full">
                                        <Clock className="w-3 h-3 text-stone-500" />
                                        <span>{minutesSpent} min</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            } else {
                              const note = item.data;
                              return (
                                <div
                                  key={`timeline_note_${note.id}`}
                                  className="rounded-2xl border border-stone-200 bg-amber-50/40 p-4 shadow-xs space-y-2"
                                >
                                  <div className="flex items-center justify-between text-xs text-amber-900">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200">
                                        Reflection
                                      </span>
                                      <span className="text-stone-500">
                                        {formatNoteDateTime(note.createdAt)}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNote(note.id)}
                                      className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                                      title="Delete note"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                                    {note.content}
                                  </p>
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
