"use client";

import { api } from "~/trpc/react";
import { HabitHeatmap } from "./habit-heatmap";

interface HabitsDashboardProps {
  days?: number;
}

/**
 * Dashboard component that displays all active habits with their heatmaps.
 *
 * Fetches the user's active habits and their entries, then renders a heatmap for each.
 *
 * @param props - Component props
 * @param props.days - Number of days to display in each heatmap (default: 30)
 */
export function HabitsDashboard({ days = 30 }: HabitsDashboardProps) {
  const { data: habits, isLoading } = api.habit.getAllActive.useQuery();

  // Fetch entries for all habits
  const habitEntriesQueries = api.useQueries((t) =>
    (habits ?? []).map((habit) =>
      t.habitEntry.getLastNDays({ habitId: habit.id, days }),
    ),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-32 animate-pulse rounded-lg bg-white/10" />
        <div className="h-32 animate-pulse rounded-lg bg-white/10" />
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ backgroundColor: "hsl(var(--button-bg))" }}>
        <p className="text-lg" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
          No active habits yet. Create your first habit to start tracking!
        </p>
      </div>
    );
  }

  return (
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
  );
}
