"use client";

import { useState } from "react";
import { z } from "zod";
import { api } from "~/trpc/react";
import { ColorPicker } from "./color-picker";

const createHabitSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  description: z.string().max(500, "Description must be 500 characters or less").optional(),
  dailyGoal: z.number().int().positive("Daily goal must be a positive number"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

type CreateHabitInput = z.infer<typeof createHabitSchema>;

interface CreateHabitFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  habitId?: string;
  initialData?: {
    name: string;
    description?: string;
    dailyGoal: number;
    color: string;
  };
}

/**
 * Form component for creating or editing a habit with validation.
 */
export function CreateHabitForm({ onSuccess, onCancel, habitId, initialData }: CreateHabitFormProps) {
  const [formData, setFormData] = useState<CreateHabitInput>(
    initialData ?? {
      name: "",
      description: "",
      dailyGoal: 1,
      color: "#FFB3BA", // Default to first pastel color
    }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof CreateHabitInput, string>>>({});

  const utils = api.useUtils();
  const createHabit = api.habit.create.useMutation({
    onSuccess: () => {
      void utils.habit.getAllActive.invalidate();
      onSuccess();
    },
  });

  const updateHabit = api.habit.update.useMutation({
    onSuccess: () => {
      void utils.habit.getAllActive.invalidate();
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const result = createHabitSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof CreateHabitInput, string>> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof CreateHabitInput] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Clear errors and submit
    setErrors({});
    if (habitId) {
      // Update existing habit
      updateHabit.mutate({ id: habitId, ...result.data });
    } else {
      // Create new habit
      createHabit.mutate(result.data);
    }
  };

  const isLoading = createHabit.isPending || updateHabit.isPending;
  const error = createHabit.error || updateHabit.error;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Name Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name *
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="rounded px-3 py-2 outline-none transition-all"
          style={{
            backgroundColor: "hsl(var(--button-bg))",
            borderWidth: "2px",
            borderColor: errors.name ? "#ef4444" : "transparent",
          }}
          placeholder="e.g., Drink Water"
        />
        {errors.name && (
          <span className="text-sm text-red-500">{errors.name}</span>
        )}
      </div>

      {/* Description Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="rounded px-3 py-2 outline-none transition-all"
          style={{
            backgroundColor: "hsl(var(--button-bg))",
            borderWidth: "2px",
            borderColor: errors.description ? "#ef4444" : "transparent",
          }}
          placeholder="e.g., Drink 8 glasses of water daily"
          rows={3}
        />
        {errors.description && (
          <span className="text-sm text-red-500">{errors.description}</span>
        )}
      </div>

      {/* Daily Goal Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="dailyGoal" className="text-sm font-medium">
          Daily Goal *
        </label>
        <input
          id="dailyGoal"
          type="number"
          min="1"
          value={formData.dailyGoal}
          onChange={(e) => setFormData({ ...formData, dailyGoal: parseInt(e.target.value) || 1 })}
          className="rounded px-3 py-2 outline-none transition-all"
          style={{
            backgroundColor: "hsl(var(--button-bg))",
            borderWidth: "2px",
            borderColor: errors.dailyGoal ? "#ef4444" : "transparent",
          }}
        />
        {errors.dailyGoal && (
          <span className="text-sm text-red-500">{errors.dailyGoal}</span>
        )}
      </div>

      {/* Color Picker */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Color *</label>
        <ColorPicker
          value={formData.color}
          onChange={(color) => setFormData({ ...formData, color })}
        />
        {errors.color && (
          <span className="text-sm text-red-500">{errors.color}</span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded px-4 py-2 font-semibold transition-all duration-300 disabled:opacity-50"
          style={{ backgroundColor: "hsl(var(--button-bg))" }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "hsl(var(--button-bg-hover))";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
          }}
        >
          {isLoading ? (habitId ? "Updating..." : "Creating...") : (habitId ? "Update Habit" : "Create Habit")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded px-4 py-2 font-semibold transition-all duration-300 disabled:opacity-50"
          style={{ backgroundColor: "hsl(var(--button-bg))" }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "hsl(var(--button-bg-hover))";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
          }}
        >
          Cancel
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded p-3 text-sm text-red-500" style={{ backgroundColor: "hsl(var(--button-bg))" }}>
          Failed to {habitId ? "update" : "create"} habit: {error.message}
        </div>
      )}
    </form>
  );
}
