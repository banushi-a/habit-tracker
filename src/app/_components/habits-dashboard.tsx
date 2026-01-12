"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { CreateHabitForm } from "./create-habit-form";
import { HabitHeatmap } from "./habit-heatmap";
import { Modal } from "./modal";

interface HabitsDashboardProps {
  days?: number;
}

/**
 * Dashboard component that displays all active habits with their heatmaps.
 *
 * Fetches the user's active habits and their entries, then renders a heatmap for each.
 *
 * @param props - Component props
 * @param props.days - Number of days to display in each heatmap (default: 365)
 */
export function HabitsDashboard({ days = 365 }: HabitsDashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: habits, isLoading } = api.habit.getAllActive.useQuery();

  // Fetch entries for all habits
  const habitEntriesQueries = api.useQueries((t) =>
    (habits ?? []).map((habit) =>
      t.habitEntry.getLastNDays({ habitId: habit.id, days }),
    ),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Your Habits</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-32 animate-pulse rounded-lg bg-white/10" />
          <div className="h-32 animate-pulse rounded-lg bg-white/10" />
        </div>
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Your Habits</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition-all duration-300"
              style={{ backgroundColor: "hsl(var(--button-bg))" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(var(--button-bg-hover))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
              }}
            >
              +
            </button>
            <p className="text-lg" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
              Create your first habit!
            </p>
          </div>
        </div>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Habit"
        >
          <CreateHabitForm
            onSuccess={() => setIsCreateModalOpen(false)}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Your Habits</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition-all duration-300"
            style={{ backgroundColor: "hsl(var(--button-bg))" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--button-bg-hover))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
            }}
            title="Create another habit to track"
          >
            +
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {habits.map((habit, index) => {
            const entriesQuery = habitEntriesQueries[index];
            const entries = entriesQuery?.data ?? [];

            return (
              <HabitHeatmap
                key={habit.id}
                habit={{
                  id: habit.id,
                  name: habit.name,
                  color: habit.color,
                  dailyGoal: habit.dailyGoal,
                }}
                entries={entries}
                days={days}
              />
            );
          })}
        </div>
      </div>

      {/* Create Habit Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Habit"
      >
        <CreateHabitForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </>
  );
}
