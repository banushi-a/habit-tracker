"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { Modal } from "./modal";
import { CreateHabitForm } from "./create-habit-form";

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
  selectedYear?: number | null; // null means rolling view, number means year view
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
  selectedYear = null,
}: HabitHeatmapProps) {
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const utils = api.useUtils();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayCellRef = useRef<HTMLDivElement>(null);

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
          // Add new entry with placeholder values (will be replaced by server response)
          return [
            ...old,
            {
              id: "temp-" + Date.now(),
              habitId: habit.id,
              date,
              count: newCount,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ];
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

    let startDate: Date;
    let endDate: Date;

    if (selectedYear !== null) {
      // Year view: show full calendar year
      startDate = new Date(selectedYear, 0, 1); // January 1st
      endDate = new Date(selectedYear, 11, 31); // December 31st
      endDate.setHours(0, 0, 0, 0);
    } else {
      // Rolling view: show last N days
      endDate = new Date(today);
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (days - 1));
    }

    // Find the Sunday before or on the start date to align the grid
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 6 = Saturday
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(alignedStartDate.getDate() - startDayOfWeek);

    // Calculate total days needed (from aligned start to end date)
    const totalDays =
      Math.ceil(
        (endDate.getTime() - alignedStartDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

    // Generate all days
    const todayStr = today.toISOString().split("T")[0];
    const allDays: Array<{
      date: Date;
      count: number;
      intensity: number;
      isToday: boolean;
    } | null> = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(alignedStartDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const count = dateStr ? (entryMap.get(dateStr) ?? 0) : 0;
      const intensity = Math.min(count / habit.dailyGoal, 1);
      const isToday = dateStr === todayStr;

      allDays.push({ date, count, intensity, isToday });
    }

    // Organize into weeks (columns) with days (rows)
    const weeks: Array<
      Array<{
        date: Date;
        count: number;
        intensity: number;
        isToday: boolean;
      } | null>
    > = [];

    // Pad the end to complete the current week
    const endDayOfWeek = endDate.getDay(); // 0 = Sunday, 6 = Saturday
    const daysToAdd = 6 - endDayOfWeek; // Days until Saturday
    for (let i = 1; i <= daysToAdd; i++) {
      allDays.push(null); // Add nulls for future days in current week
    }

    for (let i = 0; i < allDays.length; i += 7) {
      const week = allDays.slice(i, i + 7);
      weeks.push(week);
    }

    return weeks;
  }, [entries, days, habit.dailyGoal, selectedYear]);

  // Scroll to today's cell on mount or when heatmap data changes
  useEffect(() => {
    if (todayCellRef.current && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      const todayCell = todayCellRef.current;

      // Calculate the scroll position to center today's cell
      const containerWidth = scrollContainer.clientWidth;
      const cellLeft = todayCell.offsetLeft;
      const cellWidth = todayCell.offsetWidth;

      // Scroll to position today's cell in the center-right area
      const scrollPosition = cellLeft - containerWidth + cellWidth + 50;

      scrollContainer.scrollLeft = Math.max(0, scrollPosition);
    }
  }, [heatmapData]);

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
    <>
      <div
        className="w-full rounded-lg p-3 transition-all duration-300 sm:p-4"
        style={{ backgroundColor: "hsl(var(--button-bg))" }}
      >
        <div className="mb-3 flex items-start justify-between sm:mb-4 sm:items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <h3 className="text-base font-semibold sm:text-lg">{habit.name}</h3>
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
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
            {error && (
              <div
                className="rounded px-2 py-1 text-xs text-red-500 sm:px-3 sm:text-sm"
                style={{ backgroundColor: "hsl(var(--background))" }}
              >
                {error}
              </div>
            )}
            <button
              onClick={() => setIsEditModalOpen(true)}
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
              title="Edit habit settings"
            >
              ⚙
            </button>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-visible"
        >
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
            <div className="flex gap-1 pr-8">
              {heatmapData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1 py-2">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      ref={day?.isToday ? todayCellRef : null}
                      className="group relative shrink-0"
                      style={{
                        width: "14px",
                        height: "14px",
                      }}
                    >
                      {day ? (
                        <>
                          <div
                            className={`h-full w-full rounded-sm transition-all duration-200 ${
                              day.isToday ? "cursor-pointer" : "cursor-default"
                            }`}
                            style={{
                              backgroundColor: getBackgroundColor(
                                day.intensity,
                              ),
                              boxShadow: day.isToday
                                ? "0 0 0 2px hsl(var(--foreground))"
                                : "0 0 0 0 hsl(var(--foreground) / 0.5)",
                              opacity: day.isToday ? 1 : 0.6,
                            }}
                            onClick={() =>
                              day.isToday && handleDayClick(day.date, day.count)
                            }
                            onMouseEnter={(e) => {
                              if (day.isToday) {
                                e.currentTarget.style.boxShadow =
                                  "0 0 0 2px hsl(var(--foreground))";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (day.isToday) {
                                e.currentTarget.style.boxShadow =
                                  "0 0 0 2px hsl(var(--foreground))";
                              }
                            }}
                          />
                          {/* Tooltip - show above for bottom rows (Thu-Sat), below for top rows (Sun-Wed) */}
                          <div
                            className={`pointer-events-none absolute left-1/2 z-10 hidden -translate-x-1/2 rounded px-2 py-1 text-xs whitespace-nowrap group-hover:block ${
                              dayIndex >= 4
                                ? "bottom-full mb-2"
                                : "top-full mt-2"
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
          className="mt-3 flex flex-col gap-2 text-xs sm:mt-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ color: "hsl(var(--foreground) / 0.7)" }}
        >
          <span>
            {selectedYear !== null
              ? `Year ${selectedYear}`
              : `Last ${days} days`}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs">Less</span>
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
            <span className="text-xs">More</span>
          </div>
        </div>
      </div>

      {/* Edit Habit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Habit"
      >
        <CreateHabitForm
          habitId={habit.id}
          initialData={{
            name: habit.name,
            description: undefined,
            dailyGoal: habit.dailyGoal,
            color: habit.color,
          }}
          onSuccess={() => setIsEditModalOpen(false)}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>
    </>
  );
}
