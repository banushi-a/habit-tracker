"use client";

import { useMemo, useState } from "react";
import { api } from "~/trpc/react";

interface HabitEntry {
  date: Date;
  count: number;
}

interface HabitHeatmapProps {
  habit: {
    id: string;
    name: string;
    color: string;
    dailyGoal: number;
  };
  entries: HabitEntry[];
  days?: number;
}

/**
 * Displays a GitHub-style heatmap for a habit's daily entries.
 *
 * Shows the last 365 days in a grid where rows are days of the week (Sunday-Saturday)
 * and columns are weeks. The rightmost column is the current week.
 *
 * @param props - Component props
 * @param props.habit - The habit to display
 * @param props.entries - Array of habit entries with dates and counts
 * @param props.days - Number of days to display (default: 365)
 */
export function HabitHeatmap({
  habit,
  entries,
  days = 365,
}: HabitHeatmapProps) {
  const [error, setError] = useState<string | null>(null);
  const utils = api.useUtils();

  const upsertEntry = api.habitEntry.upsert.useMutation({
    onError: (err) => {
      setError(`Failed to update: ${err.message}`);
      // Revert the optimistic update
      void utils.habitEntry.getLastNDays.invalidate({ habitId: habit.id });
      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleDayClick = (date: Date, currentCount: number) => {
    // Clear any existing errors
    setError(null);

    // If at or above goal, reset to 0, otherwise increment by 1
    const newCount = currentCount >= habit.dailyGoal ? 0 : currentCount + 1;

    // Optimistically update the UI
    const dateStr = date.toISOString().split("T")[0];
    utils.habitEntry.getLastNDays.setData(
      { habitId: habit.id, days },
      (old) => {
        if (!old) return old;

        // Find existing entry for this date
        const existingIndex = old.findIndex(
          (entry) => entry.date.toISOString().split("T")[0] === dateStr,
        );

        if (existingIndex >= 0) {
          // Update existing entry
          const updated = [...old];
          updated[existingIndex] = {
            ...updated[existingIndex]!,
            count: newCount,
          };
          return updated;
        } else {
          // Add new entry
          return [...old, { date, count: newCount }];
        }
      },
    );

    // Send the mutation to the server
    upsertEntry.mutate({
      habitId: habit.id,
      date: date,
      count: newCount,
    });
  };

  const handleIncrementToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Find today's count
    const todayEntry = entries.find(
      (entry) => new Date(entry.date).toISOString().split("T")[0] === todayStr,
    );
    const currentCount = todayEntry?.count ?? 0;

    // Reuse the existing click logic
    handleDayClick(today, currentCount);
  };

  const heatmapData = useMemo(() => {
    // Create a map of date strings to counts
    const entryMap = new Map<string, number>();
    entries.forEach((entry) => {
      const dateStr = new Date(entry.date).toISOString().split("T")[0];
      if (dateStr) {
        entryMap.set(dateStr, entry.count);
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the start date (365 days ago from today)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (days - 1));

    // Find the Sunday before or on the start date to align the grid
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 6 = Saturday
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(alignedStartDate.getDate() - startDayOfWeek);

    // Calculate total days needed (from aligned start to today)
    const totalDays =
      Math.ceil(
        (today.getTime() - alignedStartDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    // Generate all days
    const allDays: Array<{
      date: Date;
      count: number;
      intensity: number;
    } | null> = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(alignedStartDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const count = dateStr ? (entryMap.get(dateStr) ?? 0) : 0;
      const intensity = Math.min(count / habit.dailyGoal, 1);

      allDays.push({ date, count, intensity });
    }

    // Organize into weeks (columns) with days (rows)
    const weeks: Array<
      Array<{ date: Date; count: number; intensity: number } | null>
    > = [];

    // Pad the end to complete the current week
    const todayDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToAdd = 6 - todayDayOfWeek; // Days until Saturday
    for (let i = 1; i <= daysToAdd; i++) {
      allDays.push(null); // Add nulls for future days in current week
    }

    for (let i = 0; i < allDays.length; i += 7) {
      const week = allDays.slice(i, i + 7);
      weeks.push(week);
    }

    return weeks;
  }, [entries, days, habit.dailyGoal]);

  /**
   * Get background color based on intensity and habit color
   */
  const getBackgroundColor = (intensity: number) => {
    if (intensity === 0) {
      return "hsl(var(--foreground) / 0.1)";
    }

    // Convert hex to RGB
    const hex = habit.color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Apply intensity
    return `rgba(${r}, ${g}, ${b}, ${intensity})`;
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      className="inline-block w-fit rounded-lg p-4 pr-8 transition-all duration-300"
      style={{ backgroundColor: "hsl(var(--button-bg))" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{habit.name}</h3>
          <button
            onClick={handleIncrementToday}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all duration-200"
            style={{ backgroundColor: "hsl(var(--foreground) / 0.1)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "hsl(var(--foreground) / 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                "hsl(var(--foreground) / 0.1)";
            }}
            title="Increment today's count"
          >
            ↑
          </button>
        </div>
        {error && (
          <div
            className="rounded px-3 py-1 text-sm text-red-500"
            style={{ backgroundColor: "hsl(var(--background))" }}
          >
            {error}
          </div>
        )}
      </div>
      <div className="overflow-x-auto overflow-y-visible">
        <div className="flex gap-1">
          {/* Day labels column */}
          <div className="flex flex-col gap-1 pr-3">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="flex items-center justify-end text-xs"
                style={{
                  height: "14px",
                  color: "hsl(var(--foreground) / 0.7)",
                }}
              >
                {i % 2 === 1 ? label : ""}{" "}
                {/* Show only Mon, Wed, Fri labels */}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          <div className="flex gap-1">
            {heatmapData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1 py-2">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="group relative shrink-0"
                    style={{
                      width: "14px",
                      height: "14px",
                    }}
                  >
                    {day ? (
                      <>
                        <div
                          className="h-full w-full cursor-pointer rounded-sm transition-all duration-200"
                          style={{
                            backgroundColor: getBackgroundColor(day.intensity),
                            boxShadow: "0 0 0 0 hsl(var(--foreground) / 0.5)",
                          }}
                          onClick={() => handleDayClick(day.date, day.count)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow =
                              "0 0 0 2px hsl(var(--foreground) / 0.5)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow =
                              "0 0 0 0 hsl(var(--foreground) / 0.5)";
                          }}
                        />
                        {/* Tooltip - show above for bottom rows (Thu-Sat), below for top rows (Sun-Wed) */}
                        <div
                          className={`pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 rounded px-2 py-1 text-xs whitespace-nowrap group-hover:block ${
                            dayIndex >= 4 ? "bottom-full mb-2" : "top-full mt-2"
                          }`}
                          style={{
                            backgroundColor: "hsl(var(--foreground))",
                            color: "hsl(var(--background))",
                          }}
                        >
                          <div>{day.date.toLocaleDateString()}</div>
                          <div>
                            {day.count} / {habit.dailyGoal}
                          </div>
                          <div
                            className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
                              dayIndex >= 4 ? "top-full" : "bottom-full"
                            }`}
                            style={{
                              [dayIndex >= 4
                                ? "borderTopColor"
                                : "borderBottomColor"]:
                                "hsl(var(--foreground))",
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="h-full w-full" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="mt-4 flex items-center justify-between text-xs"
        style={{ color: "hsl(var(--foreground) / 0.7)" }}
      >
        <span>Last {days} days</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: getBackgroundColor(intensity),
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
