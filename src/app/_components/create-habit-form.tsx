"use client";

import { useState } from "react";
import { z } from "zod";
import { api } from "~/trpc/react";
import { ColorPicker } from "./color-picker";

const createHabitSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
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

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--fg-muted)",
};

const inputStyle: React.CSSProperties = {
  backgroundColor: "var(--btn)",
  color: "var(--fg)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s",
};

export function CreateHabitForm({
  onSuccess,
  onCancel,
  habitId,
  initialData,
}: CreateHabitFormProps) {
  const [formData, setFormData] = useState<CreateHabitInput>(
    initialData ?? {
      name: "",
      description: "",
      dailyGoal: 1,
      color: "#c9a84c",
    },
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateHabitInput, string>>
  >({});

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

    setErrors({});
    if (habitId) {
      updateHabit.mutate({ id: habitId, ...result.data });
    } else {
      createHabit.mutate(result.data);
    }
  };

  const isLoading = createHabit.isPending || updateHabit.isPending;
  const error = createHabit.error ?? updateHabit.error;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          style={{
            ...inputStyle,
            borderColor: errors.name ? "#c44b3b" : "var(--border)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = errors.name ? "#c44b3b" : "var(--border)";
          }}
          placeholder="e.g., Drink Water"
        />
        {errors.name && (
          <span className="text-xs" style={{ color: "#c44b3b" }}>{errors.name}</span>
        )}
      </div>

      {/* Description */}
      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          style={{
            ...inputStyle,
            borderColor: errors.description ? "#c44b3b" : "var(--border)",
            resize: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = errors.description ? "#c44b3b" : "var(--border)";
          }}
          placeholder="Optional note about this habit"
          rows={2}
        />
        {errors.description && (
          <span className="text-xs" style={{ color: "#c44b3b" }}>{errors.description}</span>
        )}
      </div>

      {/* Daily Goal */}
      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Daily Goal *</label>
        <input
          type="number"
          min="1"
          value={formData.dailyGoal}
          onChange={(e) =>
            setFormData({
              ...formData,
              dailyGoal: parseInt(e.target.value) || 1,
            })
          }
          style={{
            ...inputStyle,
            borderColor: errors.dailyGoal ? "#c44b3b" : "var(--border)",
            width: "120px",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = errors.dailyGoal ? "#c44b3b" : "var(--border)";
          }}
        />
        {errors.dailyGoal && (
          <span className="text-xs" style={{ color: "#c44b3b" }}>{errors.dailyGoal}</span>
        )}
      </div>

      {/* Color */}
      <div className="flex flex-col gap-2">
        <label style={labelStyle}>Color *</label>
        <ColorPicker
          value={formData.color}
          onChange={(color) => setFormData({ ...formData, color })}
        />
        {errors.color && (
          <span className="text-xs" style={{ color: "#c44b3b" }}>{errors.color}</span>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-2 flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-full py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: "var(--accent)",
            color: "#0e0c0a",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.opacity = "0.85";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          {isLoading
            ? habitId ? "Saving…" : "Creating…"
            : habitId ? "Save changes" : "Create habit"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: "var(--btn)",
            color: "var(--fg)",
            border: "1px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.backgroundColor = "var(--btn-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--btn)";
          }}
        >
          Cancel
        </button>
      </div>

      {error && (
        <div
          className="rounded-xl p-3 text-xs"
          style={{
            backgroundColor: "rgba(196, 75, 59, 0.1)",
            color: "#c44b3b",
            border: "1px solid rgba(196, 75, 59, 0.2)",
          }}
        >
          Failed to {habitId ? "update" : "create"} habit: {error.message}
        </div>
      )}
    </form>
  );
}
