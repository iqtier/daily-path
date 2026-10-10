'use client';

import React, { useState } from 'react';
import { X, ListTodo, Plus } from 'lucide-react';
import {
  FutureTaskType,
  FutureTask,
  TaskSize,
  EstimateSource,
} from '@/lib/types';

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
  { value: 'small', label: 'Small', desc: '< 2 hrs' },
  { value: 'medium', label: 'Medium', desc: '2–5 hrs' },
  { value: 'large', label: 'Large', desc: '5–10 hrs' },
  { value: 'huge', label: 'Huge', desc: '10+ hrs' },
];

/**
 * TaskForm
 * Inner form with direct state initialization.
 * Future tasks are independent and have no link to goals.
 */
function TaskForm({
  initialData,
  onClose,
  onSave,
}: {
  initialData?: FutureTask | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    type: FutureTaskType;
    dueDate: string;
    weight?: number;
    estimatedHours?: number;
    size?: TaskSize;
    estimateSource?: EstimateSource;
    materials?: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<FutureTaskType>(
    initialData?.type || 'assignment'
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate || new Date().toISOString().split('T')[0]
  );
  const [weight, setWeight] = useState<string>(
    initialData?.weight !== undefined ? String(initialData.weight) : ''
  );
  const [estimatedHours, setEstimatedHours] = useState<string>(
    initialData?.estimatedHours !== undefined
      ? String(initialData.estimatedHours)
      : ''
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
      setError('Please provide a task title');
      return;
    }
    if (!dueDate) {
      setError('Please choose a due date');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const parsedHours = estimatedHours ? parseFloat(estimatedHours) : undefined;
    const determinedSource: EstimateSource | undefined =
      parsedHours !== undefined
        ? 'user'
        : size !== undefined
        ? 'size'
        : initialData?.estimateSource;

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
      setError('Failed to save future task');
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
          Task Title *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Biology lab report"
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FutureTaskType)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-white"
          >
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Due Date *
          </label>
          <input
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 bg-white"
          />
        </div>
      </div>

      {/* Size Picker: 4 Buttons (Small, Medium, Large, Huge) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Size (Optional)
          </label>
          {size && (
            <button
              type="button"
              onClick={() => setSize(undefined)}
              className="text-[11px] text-stone-500 hover:text-stone-800 cursor-pointer"
            >
              Clear size
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {SIZE_OPTIONS.map((opt) => {
            const isSelected = size === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggleSize(opt.value)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 ring-2 ring-stone-900/20 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span className="font-semibold">{opt.label}</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    isSelected ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weight & Estimated Hours */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Grade Weight % (Optional)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 15"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Estimated Hours (Optional)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="e.g. 6"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900"
          />
          {/* Helper text required by specification */}
          <p className="text-[11px] text-stone-500 mt-1 leading-tight">
            Know the hours? Enter them. If not, pick a size.
          </p>
        </div>
      </div>

      {/* Materials & Notes */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
          Materials & Notes (Optional)
        </label>
        <textarea
          rows={2}
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          placeholder="e.g. Lab manual section 2, spectrophotometer data"
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-900 resize-none"
        />
        {/* Helper text required by specification */}
        <p className="text-[11px] text-stone-500 mt-1 leading-tight">
          Add details like page count or number of questions. This helps estimate effort.
        </p>
      </div>

      <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>
            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Task'}
          </span>
        </button>
      </div>
    </form>
  );
}

/**
 * NewTaskModal
 * Form dialog for adding or editing upcoming deadlines and future tasks.
 * Includes 4-button Size picker, optional estimated hours, and helpful estimation hints.
 */
export default function NewTaskModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: NewTaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-stone-900">
              {initialData ? 'Edit Future Task' : 'New Future Task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-600 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <TaskForm
          key={initialData ? initialData.id : 'new'}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
