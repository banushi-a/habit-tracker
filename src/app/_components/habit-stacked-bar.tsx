"use client";

import { memo, useMemo, useState } from "react";

interface HabitEntry {
  date: Date;
  count: number;
}

interface HabitWithEntries {
  id: string;
  name: string;
  color: string;
  dailyGoal: number;
  entries: HabitEntry[];
}

interface TooltipState {
  dayIndex: number;
  dateLabel: string;
  segments: Array<{ name: string; color: string; count: number; goal: number }>;
}

const DAYS = 30;
const VIEW_W = 620;
const VIEW_H = 122;
const PAD_TOP = 6;
const PAD_BOTTOM = 22;
const PAD_LEFT = 4;
const PAD_RIGHT = 4;
const CHART_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
const CHART_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const SLOT_W = CHART_W / DAYS;
const BAR_W = Math.max(4, SLOT_W - 2.5);
const BAR_OFFSET = (SLOT_W - BAR_W) / 2;

// Label every ~7 days, always show first and last
const LABEL_INDICES = [0, 7, 14, 21, 29];

function HabitStackedBarInner({ habitsWithEntries }: { habitsWithEntries: HabitWithEntries[] }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Last 30 days (oldest → newest)
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (DAYS - 1 - i));
      return d;
    });
  }, []);

  // Build entry lookup maps per habit
  const entryMaps = useMemo(
    () =>
      habitsWithEntries.map(({ entries }) => {
        const map = new Map<string, number>();
        entries.forEach((e) => {
          const key = new Date(e.date).toISOString().split("T")[0]!;
          map.set(key, e.count);
        });
        return map;
      }),
    [habitsWithEntries],
  );

  // Per-day stacked segments
  // Each habit contributes count/dailyGoal (0–1), total max = numHabits.
  // We normalize so the chart max = 1 (= all habits fully completed).
  const numHabits = habitsWithEntries.length;

  const chartData = useMemo(
    () =>
      days.map((date) => {
        const dateStr = date.toISOString().split("T")[0]!;
        const segments = habitsWithEntries.map((habit, hi) => {
          const count = entryMaps[hi]?.get(dateStr) ?? 0;
          const ratio = numHabits > 0 ? Math.min(count / habit.dailyGoal, 1) / numHabits : 0;
          return { habit, count, ratio };
        });
        return { date, dateStr, segments };
      }),
    [days, habitsWithEntries, entryMaps, numHabits],
  );

  if (numHabits === 0) return null;

  return (
    <div
      className="relative w-full rounded-2xl"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <h3
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: "var(--fg-muted)", letterSpacing: "0.1em" }}
        >
          30-Day Overview
        </h3>
        <span className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
          All habits
        </span>
      </div>

      {/* Chart */}
      <div className="relative px-3 pb-1">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width="100%"
          style={{ overflow: "visible", display: "block" }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Subtle grid line at 50% and 100% */}
          {[0.5, 1].map((frac) => (
            <line
              key={frac}
              x1={PAD_LEFT}
              x2={VIEW_W - PAD_RIGHT}
              y1={PAD_TOP + CHART_H * (1 - frac)}
              y2={PAD_TOP + CHART_H * (1 - frac)}
              stroke="var(--border)"
              strokeWidth="0.6"
              strokeDasharray={frac === 1 ? "none" : "3,3"}
            />
          ))}

          {/* Bars */}
          {chartData.map((day, di) => {
            const x = PAD_LEFT + di * SLOT_W + BAR_OFFSET;
            let cumulativeH = 0;

            // Find the topmost non-zero segment index for rounding
            let topSegIdx = -1;
            for (let i = day.segments.length - 1; i >= 0; i--) {
              if (day.segments[i]!.ratio > 0) {
                topSegIdx = i;
                break;
              }
            }

            return (
              <g key={day.dateStr}>
                {/* Empty bar background */}
                <rect
                  x={x}
                  y={PAD_TOP}
                  width={BAR_W}
                  height={CHART_H}
                  fill="var(--fg-subtle)"
                  rx={2}
                />

                {/* Stacked segments (bottom → top) */}
                {day.segments.map((seg, si) => {
                  const segH = seg.ratio * CHART_H;
                  if (segH < 0.5) return null;
                  const y = PAD_TOP + CHART_H - cumulativeH - segH;
                  cumulativeH += segH;
                  const isTop = si === topSegIdx;

                  // Parse hex color for rgba
                  const hex = seg.habit.color.replace("#", "");
                  const r = parseInt(hex.substring(0, 2), 16);
                  const g = parseInt(hex.substring(2, 4), 16);
                  const b = parseInt(hex.substring(4, 6), 16);

                  return (
                    <rect
                      key={si}
                      x={x}
                      y={isTop ? y + 2 : y}
                      width={BAR_W}
                      height={isTop ? Math.max(segH - 2, 1) : segH}
                      fill={`rgba(${r},${g},${b},0.88)`}
                      rx={isTop ? 2 : 0}
                      style={{ transition: "y 0.15s ease, height 0.15s ease" }}
                    />
                  );
                })}

                {/* Invisible hover region */}
                <rect
                  x={x - 1}
                  y={PAD_TOP}
                  width={BAR_W + 2}
                  height={CHART_H}
                  fill="transparent"
                  style={{ cursor: "default" }}
                  onMouseEnter={() =>
                    setTooltip({
                      dayIndex: di,
                      dateLabel: day.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      }),
                      segments: day.segments.map((s) => ({
                        name: s.habit.name,
                        color: s.habit.color,
                        count: s.count,
                        goal: s.habit.dailyGoal,
                      })),
                    })
                  }
                />
              </g>
            );
          })}

          {/* X-axis date labels */}
          {LABEL_INDICES.map((i) => {
            const day = chartData[i];
            if (!day) return null;
            const x = PAD_LEFT + i * SLOT_W + SLOT_W / 2;
            return (
              <text
                key={i}
                x={x}
                y={VIEW_H - 5}
                textAnchor="middle"
                fontSize="9"
                fill="var(--fg-muted)"
                fontFamily="var(--font-sans)"
              >
                {day.date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 rounded-xl px-3 py-2.5 text-[11px]"
            style={{
              top: "4px",
              left: `${Math.min(Math.max(((tooltip.dayIndex + 0.5) / DAYS) * 100, 12), 85)}%`,
              transform: "translateX(-50%)",
              backgroundColor: "var(--fg)",
              color: "var(--bg)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
              minWidth: "128px",
              whiteSpace: "nowrap",
            }}
          >
            <div className="mb-1.5 font-medium">{tooltip.dateLabel}</div>
            <div className="flex flex-col gap-1">
              {tooltip.segments.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span style={{ opacity: 0.65 }}>{s.name}</span>
                  <span className="ml-auto pl-2 tabular-nums" style={{ opacity: 0.9 }}>
                    {s.count}/{s.goal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-5 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        {habitsWithEntries.map((h) => (
          <div key={h.id} className="flex items-center gap-1.5">
            <div
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: h.color }}
            />
            <span className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
              {h.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const HabitStackedBar = memo(HabitStackedBarInner);
