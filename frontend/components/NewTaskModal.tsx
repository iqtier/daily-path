'use client';

import React, { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Signpost } from '@/components/icons';
import { FutureTaskType, FutureTask, TaskSize, EstimateSource } from '@/lib/types';
import { localDateKey } from '@/lib/formatters';
import {
  ErrorBanner,
  inputClass,
  labelClass,
  Modal,
  primaryButtonClass,
  quietButtonClass,
} from '@/components/ui';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    type: FutureTaskType;
    dueDate: string;
    weight?: number;
    estimatedHours?: number;
    size?: TaskSize;
    estimateSource?: EstimateSource;
    materials?: string;
  }) => Promise<void>;
  initialData?: FutureTask | null;
}

const TASK_TYPES: { value: FutureTaskType; label: string }[] = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'exam', label: 'Exam / Midterm' },
  { value: 'project', label: 'Project' },
  { value: 'other', label: 'Other' },
];

const SIZE_OPTIONS: { value: TaskSize; label: string; desc: string }[] = [
  { value: 'small', label: 'Small', desc: '~ 2 hrs' },
  { value: 'medium', label: 'Medium', desc: '~5 hrs' },
  { value: 'large', label: 'Large', desc: '~10 hrs' },
  { value: 'huge', label: 'Huge', desc: '~20 hrs' },
];

const optional = <span className="normal-case tracking-normal font-semibold">(optional)</span>;

/** Keyed by task id in the parent, so state initializes directly from initialData. Future tasks never link to goals. */
function TaskForm({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: FutureTask | null;
  onClose: () => void;
  onSave: NewTaskModalProps['onSave'];
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<FutureTaskType>(initialData?.type || 'assignment');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || localDateKey());
  const [weight, setWeight] = useState<string>(
    initialData?.weight !== undefined ? String(initialData.weight) : ''
  );
  const [estimatedHours, setEstimatedHours] = useState<string>(
    initialData?.estimatedHours !== undefined ? String(initialData.estimatedHours) : ''
  );
  const [size, setSize] = useState<TaskSize | undefined>(initialData?.size);
  const [materials, setMaterials] = useState(initialData?.materials || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggleSize = (selectedSize: TaskSize) => {
    setSize((prev) => (prev === selectedSize ? undefined : selectedSize));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give this task a name first.');
      return;
    }
    if (!dueDate) {
      setError('Pick a due date.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const parsedHours = estimatedHours ? parseFloat(estimatedHours) : undefined;
    const determinedSource: EstimateSource | undefined =
      parsedHours !== undefined ? 'user' : size !== undefined ? 'size' : initialData?.estimateSource;

    try {
      await onSave({
        title: title.trim(),
        type,
        dueDate,
        weight: weight ? parseFloat(weight) : undefined,
        estimatedHours: parsedHours,
        size,
        estimateSource: determinedSource,
        materials: materials.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setError("Couldn't save that task. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-5 sm:px-6 pb-6 space-y-5">
      {error && <ErrorBanner message={error} />}

      <div>
        <label htmlFor="task-title" className={labelClass}>
          What&apos;s coming up?
        </label>
        <input
          id="task-title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Biology lab report"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
        <div>
          <label htmlFor="task-type" className={labelClass}>
            Type
          </label>
          <select
            id="task-type"
            value={type}
            onChange={(e) => setType(e.target.value as FutureTaskType)}
            className={inputClass}
          >
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-due" className={labelClass}>
            Due date
          </label>
          <input
            id="task-due"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset>
        <legend className={`${labelClass} w-full flex items-center justify-between`}>
          <span>How big is it? {optional}</span>
          {size && (
            <button
              type="button"
              onClick={() => setSize(undefined)}
              className="normal-case tracking-normal text-xs font-bold text-ink-muted hover:text-ink"
            >
              Clear
            </button>
          )}
        </legend>
        <div className="grid grid-cols-4 gap-2">
          {SIZE_OPTIONS.map((opt) => {
            const isSelected = size === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleSize(opt.value)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-brand-gradient text-on-brand shadow-[0_8px_16px_-8px_var(--brand)] scale-[1.03]'
                    : 'bg-sunk text-ink hover:bg-line'
                }`}
              >
                {opt.label}
                <span className={`text-[10px] mt-0.5 font-semibold ${isSelected ? 'text-on-brand/85' : 'text-ink-muted'}`}>
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4">
        <div>
          <label htmlFor="task-weight" className={labelClass}>
            Grade weight % {optional}
          </label>
          <input
            id="task-weight"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 15"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="task-hours" className={labelClass}>
            Estimated hours {optional}
          </label>
          <input
            id="task-hours"
            type="number"
            min="0"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="e.g. 6"
            aria-describedby="task-hours-hint"
            className={inputClass}
          />
          <p id="task-hours-hint" className="text-xs text-ink-muted mt-1.5 leading-snug">
            Know the hours? Enter them. If not, pick a size.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="task-materials" className={labelClass}>
          Materials &amp; notes {optional}
        </label>
        <textarea
          id="task-materials"
          rows={2}
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          placeholder="e.g. Lab manual section 2, spectrophotometer data"
          aria-describedby="task-materials-hint"
          className={`${inputClass} resize-none`}
        />
        <p id="task-materials-hint" className="text-xs text-ink-muted mt-1.5 leading-snug">
          Add details like page count or number of questions. This helps estimate effort.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} className={quietButtonClass}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          <CalendarPlus className="w-4 h-4" />
          {isSubmitting ? 'Saving…' : initialData ? 'Save changes' : 'Add task'}
        </button>
      </div>
    </form>
  );
}

/** Add or edit an upcoming deadline. */
export default function NewTaskModal({ isOpen, onClose, onSave, initialData }: NewTaskModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit future task' : 'New future task'}
      icon={Signpost}
    >
      <TaskForm
        key={initialData ? initialData.id : 'new'}
        initialData={initialData}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
}
