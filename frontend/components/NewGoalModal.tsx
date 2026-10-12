'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Summit } from '@/components/icons';
import { GoalCategory, GoalStatus, Goal } from '@/lib/types';
import { ACCENT_CLASS, CATEGORY_META } from '@/lib/category-theme';
import {
  ErrorBanner,
  inputClass,
  labelClass,
  Modal,
  primaryButtonClass,
  quietButtonClass,
} from '@/components/ui';

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

const CATEGORIES: GoalCategory[] = ['learning', 'career', 'fitness', 'health', 'personal', 'other'];

const STATUSES: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'achieved', label: 'Achieved' },
];

/** Keyed by goal id in the parent, so state initializes directly from initialData. */
function GoalForm({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: Goal | null;
  onClose: () => void;
  onSave: NewGoalModalProps['onSave'];
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [details, setDetails] = useState(initialData?.details || '');
  const [category, setCategory] = useState<GoalCategory>(initialData?.category || 'learning');
  const [status, setStatus] = useState<GoalStatus>(initialData?.status || 'active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give your goal a name first.');
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
      setError("Couldn't save that goal. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 sm:px-6 pb-6 space-y-5">
      {error && <ErrorBanner message={error} />}

      <div>
        <label htmlFor="goal-title" className={labelClass}>
          What&apos;s the goal?
        </label>
        <input
          id="goal-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Run a 10k in under 50 minutes"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="goal-details" className={labelClass}>
          Why it matters <span className="normal-case tracking-normal font-semibold">(optional)</span>
        </label>
        <textarea
          id="goal-details"
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Your motivation, or how you plan to get there"
          className={`${inputClass} resize-none`}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>Category</legend>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((value) => {
            const { label, icon: Icon } = CATEGORY_META[value];
            const selected = category === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                aria-pressed={selected}
                className={`${ACCENT_CLASS[value]} flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  selected
                    ? 'bg-accent-strong text-on-accent shadow-[0_8px_16px_-8px_var(--accent)] scale-[1.03]'
                    : 'bg-accent/10 text-accent-ink hover:bg-accent/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Status</legend>
        <div className="flex gap-2">
          {STATUSES.map((s) => {
            const selected = status === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                aria-pressed={selected}
                className={`flex-1 py-2 rounded-full text-sm font-bold transition-colors ${
                  selected ? 'bg-ink text-canvas' : 'bg-sunk text-ink-muted hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="pt-2 flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} className={quietButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          <Plus className="w-4 h-4 stroke-[3]" />
          {isSubmitting ? 'Saving…' : initialData ? 'Save changes' : 'Add goal'}
        </button>
      </div>
    </form>
  );
}

/** Add or edit a goal. */
export default function NewGoalModal({ isOpen, onClose, onSave, initialData }: NewGoalModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit goal' : 'New goal'} icon={Summit}>
      <GoalForm
        key={initialData ? initialData.id : 'new'}
        initialData={initialData}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
}
