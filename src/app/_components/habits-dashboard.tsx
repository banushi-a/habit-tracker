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
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [localHabits, setLocalHabits] = useState<
    Array<{ id: string; name: string; color: string; dailyGoal: number }>
  >([]);
  const { data: habits, isLoading } = api.habit.getAllActive.useQuery();
  const updateOrderMutation = api.habit.updateOrder.useMutation();

  // Load saved year preference from localStorage on mount
  useEffect(() => {
    const savedYear = localStorage.getItem("habitTrackerSelectedYear");
    if (savedYear) {
      const yearValue = savedYear === "null" ? null : parseInt(savedYear);
      setSelectedYear(yearValue);
    }
    setIsInitialized(true);
  }, []);

  // Save year preference to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        "habitTrackerSelectedYear",
        selectedYear === null ? "null" : selectedYear.toString(),
      );
    }
  }, [selectedYear, isInitialized]);

  // Sync habits to local state for drag operations
  useEffect(() => {
    if (habits) {
      setLocalHabits(habits);
    }
  }, [habits]);

  // Handle drag end
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source } = result;

    // Drop outside the list
    if (!destination) {
      return;
    }

    // No movement
    if (destination.index === source.index) {
      return;
    }

    // Reorder local state immediately for optimistic UI
    const newHabits = Array.from(localHabits);
    const [reorderedHabit] = newHabits.splice(source.index, 1);
    if (reorderedHabit) {
      newHabits.splice(destination.index, 0, reorderedHabit);
    }
    setLocalHabits(newHabits);

    // Calculate new sort orders (use gaps of 100)
    const habitOrders = newHabits.map((habit, index) => ({
      id: habit.id,
      sortOrder: index * 100,
    }));

    // Send to server
    try {
      await updateOrderMutation.mutateAsync({ habitOrders });
    } catch (error) {
      console.error("Failed to update habit order:", error);
      // Revert on error
      if (habits) {
        setLocalHabits(habits);
      }
    }
  };

  // Fetch entries for all habits
  const habitEntriesQueries = api.useQueries((t) =>
    (habits ?? []).map((habit) =>
      t.habitEntry.getLastNDays({ habitId: habit.id, days }),
    ),
  );

  // Calculate earliest year from all habit entries
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

  // Generate available years for selector
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
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">Your Habits</h2>
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
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">Your Habits</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition-all duration-300"
              style={{ backgroundColor: "hsl(var(--button-bg))" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "hsl(var(--button-bg-hover))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
              }}
            >
              +
            </button>
            <p
              className="text-base sm:text-lg"
              style={{ color: "hsl(var(--foreground) / 0.7)" }}
            >
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
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold sm:text-3xl">Your Habits</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition-all duration-300"
              style={{ backgroundColor: "hsl(var(--button-bg))" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "hsl(var(--button-bg-hover))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
              }}
              title="Create another habit to track"
            >
              +
            </button>
          </div>
          <select
            value={selectedYear ?? ""}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === "" ? null : parseInt(e.target.value),
              )
            }
            className="cursor-pointer appearance-none rounded py-2 pr-10 pl-4 text-sm transition-all outline-none"
            style={{
              backgroundColor: "hsl(var(--button-bg))",
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: "right 0.75rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.5em 1.5em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                "hsl(var(--button-bg-hover))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "hsl(var(--button-bg))";
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="habits">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`flex flex-col gap-4 transition-all duration-200 ${
                  snapshot.isDraggingOver
                    ? "bg-blue-500/5 rounded-lg border-2 border-dashed border-blue-500/30 p-2"
                    : ""
                }`}
              >
                {localHabits.map((habit, index) => {
                  // Find the corresponding habit in the original habits array for entries
                  const originalIndex = habits?.findIndex(h => h.id === habit.id) ?? -1;
                  const entriesQuery = originalIndex >= 0 ? habitEntriesQueries[originalIndex] : null;
                  const entries = entriesQuery?.data ?? [];

                  return (
                    <Draggable key={habit.id} draggableId={habit.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                          }}
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
