'use client';

import React, { useState } from 'react';
import { X, Target, Sparkles } from 'lucide-react';
import { GoalCategory, GoalStatus, Goal } from '@/lib/types';

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: {
    title: string;
    details?: string;
    category: GoalCategory;
    status: GoalStatus;
  }) => Promise<void>;
  initialData?: Goal | null;
}

const CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: 'learning', label: 'Learning' },
  { value: 'career', label: 'Career' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'health', label: 'Health' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

const STATUSES: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'achieved', label: 'Achieved' },
];

/**
 * Inner form with direct state initialization (no useEffect setState needed)
 */
function GoalForm({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Goal | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    details?: string;
    category: GoalCategory;
    status: GoalStatus;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [details, setDetails] = useState(initialData?.details || '');
  const [category, setCategory] = useState<GoalCategory>(
    initialData?.category || 'learning'
  );
  const [status, setStatus] = useState<GoalStatus>(
    initialData?.status || 'active'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a goal title');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        details: details.trim() || undefined,
        category,
        status,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
          Goal Title *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Maintain 3.8+ GPA this semester"
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
          Details (Optional)
        </label>
        <textarea
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Additional motivation or strategy details..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GoalCategory)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as GoalStatus)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-white"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Goal'}</span>
        </button>
      </div>
    </form>
  );
}

/**
 * NewGoalModal
 * Form dialog for adding or editing high-level goals.
 */
export default function NewGoalModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: NewGoalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">
              {initialData ? 'Edit Goal' : 'New Goal'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-600 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <GoalForm
          key={initialData ? initialData.id : 'new'}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
