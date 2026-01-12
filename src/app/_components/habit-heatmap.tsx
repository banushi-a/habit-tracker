"use client";

import { useMemo } from "react";

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
 * Shows the last N days with color intensity based on progress toward daily goal.
 *
 * @param props - Component props
 * @param props.habit - The habit to display
 * @param props.entries - Array of habit entries with dates and counts
 * @param props.days - Number of days to display (default: 30)
 */
export function HabitHeatmap({ habit, entries, days = 30 }: HabitHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Create a map of date strings to counts
    const entryMap = new Map<string, number>();
    entries.forEach((entry) => {
      const dateStr = new Date(entry.date).toISOString().split("T")[0];
      if (dateStr) {
        entryMap.set(dateStr, entry.count);
      }
    });

    // Generate array of last N days
    const data: Array<{ date: Date; count: number; intensity: number }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = dateStr ? entryMap.get(dateStr) ?? 0 : 0;

      // Calculate intensity (0-1 based on daily goal)
      const intensity = Math.min(count / habit.dailyGoal, 1);

      data.push({ date, count, intensity });
    }

    return data;
  }, [entries, days, habit.dailyGoal]);

  /**
   * Get background color based on intensity and habit color
   */
  const getBackgroundColor = (intensity: number) => {
    if (intensity === 0) {
      return "hsl(var(--button-bg))";
    }

    // Convert hex to RGB
    const hex = habit.color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Apply intensity
    return `rgba(${r}, ${g}, ${b}, ${intensity})`;
  };

  return (
    <div className="rounded-lg p-4 transition-all duration-300" style={{ backgroundColor: "hsl(var(--button-bg))" }}>
      <h3 className="mb-4 text-lg font-semibold">{habit.name}</h3>
      <div className="flex gap-1 overflow-x-auto">
        {heatmapData.map((day, index) => (
          <div
            key={index}
            className="group relative flex-shrink-0"
            style={{
              width: "12px",
              height: "12px",
            }}
          >
            <div
              className="h-full w-full rounded-sm transition-all duration-200 hover:ring-2 hover:ring-white/50"
              style={{
                backgroundColor: getBackgroundColor(day.intensity),
              }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
              <div>{day.date.toLocaleDateString()}</div>
              <div>
                {day.count} / {habit.dailyGoal}
              </div>
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-black" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-white/70">
        <span>{days} days</span>
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
