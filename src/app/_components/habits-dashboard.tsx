"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { api } from "~/trpc/react";
import { CreateHabitForm } from "./create-habit-form";
import { HabitHeatmap } from "./habit-heatmap";
import { HabitStackedBar } from "./habit-stacked-bar";
import { Modal } from "./modal";

interface HabitsDashboardProps {
  days?: number;
}

export function HabitsDashboard({ days = 365 }: HabitsDashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localHabits, setLocalHabits] = useState<
    Array<{ id: string; name: string; color: string; dailyGoal: number }>
  >([]);
  const { data: habits, isLoading } = api.habit.getAllActive.useQuery();
  const updateOrderMutation = api.habit.updateOrder.useMutation();

  useEffect(() => {
    const savedYear = localStorage.getItem("habitTrackerSelectedYear");
    if (savedYear) {
      const yearValue = savedYear === "null" ? null : parseInt(savedYear);
      setSelectedYear(yearValue);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        "habitTrackerSelectedYear",
        selectedYear === null ? "null" : selectedYear.toString(),
      );
    }
  }, [selectedYear, isInitialized]);

  useEffect(() => {
    if (habits) {
      setLocalHabits(habits);
    }
  }, [habits]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;
    if (destination.index === source.index) return;

    const newHabits = Array.from(localHabits);
    const [reorderedHabit] = newHabits.splice(source.index, 1);
    if (reorderedHabit) {
      newHabits.splice(destination.index, 0, reorderedHabit);
    }
    setLocalHabits(newHabits);

    const habitOrders = newHabits.map((habit, index) => ({
      id: habit.id,
      sortOrder: index * 100,
    }));

    try {
      await updateOrderMutation.mutateAsync({ habitOrders });
    } catch (error) {
      console.error("Failed to update habit order:", error);
      if (habits) {
        setLocalHabits(habits);
      }
    }
  };

  const habitEntriesQueries = api.useQueries((t) =>
    (habits ?? []).map((habit) =>
      t.habitEntry.getLastNDays({ habitId: habit.id, days }),
    ),
  );

  const earliestYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let earliest = currentYear;

    habitEntriesQueries.forEach((query) => {
      const entries = query.data ?? [];
      if (entries.length > 0) {
        const entryYear = entries.reduce((earliestEntry, entry) =>
          new Date(entry.date) < new Date(earliestEntry.date)
            ? entry
            : earliestEntry,
        );
        const year = new Date(entryYear.date).getFullYear();
        if (year < earliest) {
          earliest = year;
        }
      }
    });

    return earliest;
  }, [habitEntriesQueries]);

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let year = earliestYear; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }, [earliestYear]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-32" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="skeleton h-40 w-full" style={{ borderRadius: "16px" }} />
          <div className="skeleton h-40 w-full" style={{ borderRadius: "16px" }} />
        </div>
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <>
        <div
          className="animate-fade-up flex flex-col gap-6"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex items-center gap-4">
            <h2
              className="text-3xl font-normal italic sm:text-4xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
            >
              Your Habits
            </h2>
          </div>

          <div
            className="flex flex-col items-center justify-center gap-5 rounded-2xl py-16 text-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{
                backgroundColor: "var(--accent-glow)",
                border: "1px solid var(--accent-border)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                No habits yet
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>
                Start building your daily rhythm
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: "var(--accent)",
                color: "#0e0c0a",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              Create first habit
            </button>
          </div>
        </div>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="New Habit"
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
      <div
        className="animate-fade-up flex flex-col gap-5"
        style={{ animationDelay: "0.15s" }}
      >
        {/* Section header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <h2
              className="text-3xl font-normal italic sm:text-4xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--fg)" }}
            >
              Your Habits
            </h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200"
              style={{
                backgroundColor: "var(--btn)",
                color: "var(--fg-muted)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--accent-glow)";
                e.currentTarget.style.borderColor = "var(--accent-border)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--btn)";
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--fg-muted)";
              }}
              title="Create a new habit"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {/* Year selector */}
          <select
            value={selectedYear ?? ""}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === "" ? null : parseInt(e.target.value),
              )
            }
            className="cursor-pointer appearance-none rounded-full py-2 pr-8 pl-4 text-xs font-medium transition-all duration-200 outline-none"
            style={{
              backgroundColor: "var(--btn)",
              color: "var(--fg)",
              border: "1px solid var(--border)",
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238a7f74' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.6rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.2em 1.2em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--btn-hover)";
              e.currentTarget.style.borderColor = "var(--accent-border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--btn)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <option value="">Last 365 days</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* 30-day stacked bar overview */}
        {(() => {
          const habitsWithEntries = localHabits.map((habit) => {
            const originalIndex = habits?.findIndex((h) => h.id === habit.id) ?? -1;
            const entries =
              originalIndex >= 0 ? (habitEntriesQueries[originalIndex]?.data ?? []) : [];
            return { ...habit, entries };
          });
          return <HabitStackedBar habitsWithEntries={habitsWithEntries} />;
        })()}

        {/* Habits list */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="habits">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-col gap-3 transition-all duration-200"
                style={{
                  padding: snapshot.isDraggingOver ? "8px" : "0",
                  borderRadius: snapshot.isDraggingOver ? "16px" : "0",
                  border: snapshot.isDraggingOver
                    ? "1px dashed var(--accent-border)"
                    : "1px solid transparent",
                  backgroundColor: snapshot.isDraggingOver
                    ? "var(--accent-glow)"
                    : "transparent",
                }}
              >
                {localHabits.map((habit, index) => {
                  const originalIndex =
                    habits?.findIndex((h) => h.id === habit.id) ?? -1;
                  const entriesQuery =
                    originalIndex >= 0
                      ? habitEntriesQueries[originalIndex]
                      : null;
                  const entries = entriesQuery?.data ?? [];

                  return (
                    <Draggable
                      key={habit.id}
                      draggableId={habit.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{ ...provided.draggableProps.style }}
                        >
                          <HabitHeatmap
                            habit={{
                              id: habit.id,
                              name: habit.name,
                              color: habit.color,
                              dailyGoal: habit.dailyGoal,
                            }}
                            entries={entries}
                            days={days}
                            selectedYear={selectedYear}
                            dragHandleProps={provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Habit"
      >
        <CreateHabitForm
          onSuccess={() => setIsCreateModalOpen(false)}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </>
  );
}
