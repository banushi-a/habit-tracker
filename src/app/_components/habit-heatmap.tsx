"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { HabitCellCelebration } from "./habit-cell-celebration";
import { Modal } from "./modal";
import { CreateHabitForm } from "./create-habit-form";
import { DragHandle } from "./drag-handle";

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
  selectedYear?: number | null;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement> | null;
  isDragging?: boolean;
}

function HabitHeatmapInner({
  habit,
  entries,
  days = 365,
  selectedYear = null,
  dragHandleProps,
  isDragging = false,
}: HabitHeatmapProps) {
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [celebrationPosition, setCelebrationPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const utils = api.useUtils();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayCellRef = useRef<HTMLDivElement>(null);
  const heatmapContainerRef = useRef<HTMLDivElement>(null);

  // Pre-compute RGB components once per color change — avoid parseInt in the render hot-path
  const habitRgb = useMemo(() => {
    const hex = habit.color.replace("#", "");
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    };
  }, [habit.color]);

  const upsertEntry = api.habitEntry.upsert.useMutation({
    onError: (err) => {
      setError(`Failed to update: ${err.message}`);
      void utils.habitEntry.getLastNDays.invalidate({ habitId: habit.id });
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleDayClick = useCallback((
    date: Date,
    currentCount: number,
    cellElement?: HTMLElement,
  ) => {
    setError(null);

    const dateStr = date.toISOString().split("T")[0]!;
    const newCount = currentCount >= habit.dailyGoal ? 0 : currentCount + 1;

    const wasGoalMet = currentCount >= habit.dailyGoal;
    const isGoalMet = newCount >= habit.dailyGoal;

    if (!wasGoalMet && isGoalMet && cellElement && heatmapContainerRef.current) {
      const heatmapRect = heatmapContainerRef.current.getBoundingClientRect();
      const cellRect = cellElement.getBoundingClientRect();

      const relativeX =
        ((cellRect.left - heatmapRect.left + cellRect.width / 2) /
          heatmapRect.width) *
        100;
      const relativeY =
        ((cellRect.top - heatmapRect.top + cellRect.height / 2) /
          heatmapRect.height) *
        100;

      setCelebrationPosition({ x: relativeX, y: relativeY });
      setTimeout(() => setCelebrationPosition(null), 1100);
    }

    utils.habitEntry.getLastNDays.setData(
      { habitId: habit.id, days },
      (old) => {
        if (!old) return old;

        const existingIndex = old.findIndex(
          (entry) => entry.date.toISOString().split("T")[0] === dateStr,
        );

        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = {
            ...updated[existingIndex]!,
            count: newCount,
          };
          return updated;
        } else {
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

    upsertEntry.mutate({
      habitId: habit.id,
      date: date,
      count: newCount,
    });
  }, [habit.id, habit.dailyGoal, days, utils, upsertEntry]);

  const handleIncrementToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    const todayEntry = entries.find(
      (entry) => new Date(entry.date).toISOString().split("T")[0] === todayStr,
    );
    const currentCount = todayEntry?.count ?? 0;

    handleDayClick(today, currentCount, todayCellRef.current ?? undefined);
  }, [entries, handleDayClick]);

  const heatmapData = useMemo(() => {
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
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31);
      endDate.setHours(0, 0, 0, 0);
    } else {
      endDate = new Date(today);
      startDate = new Date(today);
      startDate.setDate(startDate.getDate() - (days - 1));
    }

    const startDayOfWeek = startDate.getDay();
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(alignedStartDate.getDate() - startDayOfWeek);

    const totalDays =
      Math.ceil(
        (endDate.getTime() - alignedStartDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1;

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

    const weeks: Array<
      Array<{
        date: Date;
        count: number;
        intensity: number;
        isToday: boolean;
      } | null>
    > = [];

    const endDayOfWeek = endDate.getDay();
    const daysToAdd = 6 - endDayOfWeek;
    for (let i = 1; i <= daysToAdd; i++) {
      allDays.push(null);
    }

    for (let i = 0; i < allDays.length; i += 7) {
      const week = allDays.slice(i, i + 7);
      weeks.push(week);
    }

    return weeks;
  }, [entries, days, habit.dailyGoal, selectedYear]);

  useEffect(() => {
    if (todayCellRef.current && scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current;
      const todayCell = todayCellRef.current;

      const containerWidth = scrollContainer.clientWidth;
      const cellLeft = todayCell.offsetLeft;
      const cellWidth = todayCell.offsetWidth;

      const scrollPosition = cellLeft - containerWidth + cellWidth + 50;
      scrollContainer.scrollLeft = Math.max(0, scrollPosition);
    }
  }, [heatmapData]);

  const getBackgroundColor = useCallback((intensity: number) => {
    if (intensity === 0) return "var(--fg-subtle)";
    const { r, g, b } = habitRgb;
    return `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.85})`;
  }, [habitRgb]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Today's entry count
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntry = entries.find(
    (e) => new Date(e.date).toISOString().split("T")[0] === todayStr,
  );
  const todayCount = todayEntry?.count ?? 0;
  const todayProgress = Math.min(todayCount / habit.dailyGoal, 1);

  return (
    <>
      <div
        ref={heatmapContainerRef}
        className="relative w-full rounded-2xl"
        style={{
          backgroundColor: isDragging ? "var(--bg-raised)" : "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderTop: `2px solid ${habit.color}`,
          boxShadow: isDragging
            ? "0 20px 60px rgba(0,0,0,0.3)"
            : "0 1px 3px rgba(0,0,0,0.08)",
          transform: isDragging ? "rotate(0.5deg) scale(1.01)" : "none",
          opacity: isDragging ? 0.96 : 1,
          transition: "background-color 300ms, box-shadow 300ms, transform 300ms, opacity 300ms",
        }}
      >
        {/* Celebration */}
        {celebrationPosition && (
          <HabitCellCelebration
            isGoalMet={true}
            wasGoalMet={false}
            habitColor={habit.color}
            originX={celebrationPosition.x / 100}
            originY={celebrationPosition.y / 100}
          />
        )}

        {/* Card header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            {dragHandleProps && (
              <div {...dragHandleProps}>
                <DragHandle />
              </div>
            )}

            {/* Habit color dot */}
            <div
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: habit.color }}
            />

            <h3
              className="text-base font-medium"
              style={{ color: "var(--fg)" }}
            >
              {habit.name}
            </h3>

            {/* Today progress indicator */}
            {todayCount > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                style={{
                  backgroundColor: `rgba(${habitRgb.r}, ${habitRgb.g}, ${habitRgb.b}, 0.15)`,
                  color: habit.color,
                }}
              >
                {todayCount}/{habit.dailyGoal}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {error && (
              <span className="text-xs" style={{ color: "#c44b3b" }}>
                {error}
              </span>
            )}

            {/* Increment today button */}
            <button
              onClick={handleIncrementToday}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200"
              style={{
                backgroundColor: todayProgress >= 1
                  ? `rgba(${habitRgb.r}, ${habitRgb.g}, ${habitRgb.b}, 0.2)`
                  : "var(--btn)",
                color: todayProgress >= 1 ? habit.color : "var(--fg-muted)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--btn-hover)";
                e.currentTarget.style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = todayProgress >= 1
                  ? `rgba(${habitRgb.r}, ${habitRgb.g}, ${habitRgb.b}, 0.2)`
                  : "var(--btn)";
                e.currentTarget.style.color = todayProgress >= 1 ? habit.color : "var(--fg-muted)";
              }}
              title="Log today"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>

            {/* Edit button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200"
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--fg-muted)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--btn-hover)";
                e.currentTarget.style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--btn)";
                e.currentTarget.style.color = "var(--fg-muted)";
              }}
              title="Edit habit"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Heatmap grid */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-visible px-5 pb-4"
        >
          <div className="flex gap-[3px]">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] pr-2">
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="flex items-center justify-end text-[10px]"
                  style={{
                    height: "13px",
                    color: "var(--fg-muted)",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "0.02em",
                  }}
                >
                  {i % 2 === 1 ? label : ""}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-[3px] pr-8">
              {heatmapData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px] py-[1px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      ref={day?.isToday ? todayCellRef : null}
                      className="group relative shrink-0"
                      style={{ width: "13px", height: "13px" }}
                    >
                      {day ? (
                        <>
                          <div
                            className="h-full w-full rounded-sm transition-all duration-150"
                            style={{
                              backgroundColor: getBackgroundColor(day.intensity),
                              boxShadow: day.isToday
                                ? `0 0 0 1.5px var(--accent)`
                                : day.intensity >= 1
                                ? `0 0 4px rgba(${habitRgb.r}, ${habitRgb.g}, ${habitRgb.b}, 0.4)`
                                : "none",
                              cursor: day.isToday ? "pointer" : "default",
                              opacity: day.isToday ? 1 : 0.75,
                              transform: "scale(1)",
                            }}
                            onClick={(e) =>
                              day.isToday &&
                              handleDayClick(
                                day.date,
                                day.count,
                                e.currentTarget,
                              )
                            }
                            onMouseEnter={(e) => {
                              if (day.isToday) {
                                e.currentTarget.style.transform = "scale(1.2)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          />
                          {/* Tooltip */}
                          <div
                            className={`pointer-events-none absolute left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] group-hover:block ${
                              dayIndex >= 4 ? "bottom-full mb-2" : "top-full mt-2"
                            }`}
                            style={{
                              backgroundColor: "var(--fg)",
                              color: "var(--bg)",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            }}
                          >
                            <div className="font-medium">
                              {day.date.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            <div style={{ opacity: 0.7 }}>
                              {day.count} / {habit.dailyGoal}
                            </div>
                            {/* Arrow */}
                            <div
                              className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
                                dayIndex >= 4 ? "top-full" : "bottom-full"
                              }`}
                              style={{
                                [dayIndex >= 4
                                  ? "borderTopColor"
                                  : "borderBottomColor"]: "var(--fg)",
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

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t px-5 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <span
            className="text-[11px] tracking-wide"
            style={{ color: "var(--fg-muted)" }}
          >
            {selectedYear !== null ? `${selectedYear}` : `Last ${days} days`}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
              Less
            </span>
            <div className="flex gap-[3px]">
              {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    width: "11px",
                    height: "11px",
                    backgroundColor: getBackgroundColor(intensity),
                    boxShadow:
                      intensity >= 1
                        ? `0 0 3px rgba(${habitRgb.r}, ${habitRgb.g}, ${habitRgb.b}, 0.4)`
                        : "none",
                  }}
                />
              ))}
            </div>
            <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
              More
            </span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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

// Custom comparator: skip re-render for non-dragging cards when only
// dragHandleProps reference changes (dnd creates a new object every frame).
export const HabitHeatmap = memo(HabitHeatmapInner, (prev, next) => {
  return (
    prev.habit.id === next.habit.id &&
    prev.habit.name === next.habit.name &&
    prev.habit.color === next.habit.color &&
    prev.habit.dailyGoal === next.habit.dailyGoal &&
    prev.entries === next.entries &&
    prev.days === next.days &&
    prev.selectedYear === next.selectedYear &&
    prev.isDragging === next.isDragging
    // intentionally ignoring dragHandleProps — its reference changes every
    // frame but the underlying event handlers are stable
  );
});
