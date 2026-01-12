import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { HabitEntry } from "../../../../generated/prisma";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const habitEntryRouter = createTRPCRouter({
  /**
   * Get entries for a specific habit within a date range
   */
  getByHabitAndDateRange: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .output(z.array(z.custom<HabitEntry>()))
    .query(async ({ ctx, input }): Promise<HabitEntry[]> => {
      // Verify the habit belongs to the user
      const habit = await ctx.db.habit.findUnique({
        where: { id: input.habitId },
      });

      if (!habit?.userId || habit.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.db.habitEntry.findMany({
        where: {
          habitId: input.habitId,
          date: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  /**
   * Get entries for a specific habit for the last N days
   */
  getLastNDays: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        days: z.number().int().positive().default(30),
      }),
    )
    .output(z.array(z.custom<HabitEntry>()))
    .query(async ({ ctx, input }): Promise<HabitEntry[]> => {
      // Verify the habit belongs to the user
      const habit = await ctx.db.habit.findUnique({
        where: { id: input.habitId },
      });

      if (!habit?.userId || habit.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      return ctx.db.habitEntry.findMany({
        where: {
          habitId: input.habitId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: "asc",
        },
      });
    }),

  /**
   * Get entry for a specific habit and date
   */
  getByHabitAndDate: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        date: z.date(),
      }),
    )
    .output(z.custom<HabitEntry>().nullable())
    .query(async ({ ctx, input }): Promise<HabitEntry | null> => {
      // Verify the habit belongs to the user
      const habit = await ctx.db.habit.findUnique({
        where: { id: input.habitId },
      });

      if (!habit?.userId || habit.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Normalize date to start of day
      const normalizedDate = new Date(input.date);
      normalizedDate.setHours(0, 0, 0, 0);

      return ctx.db.habitEntry.findUnique({
        where: {
          habitId_date: {
            habitId: input.habitId,
            date: normalizedDate,
          },
        },
      });
    }),

  /**
   * Create or update an entry for a habit on a specific date
   */
  upsert: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        date: z.date(),
        count: z.number().int().nonnegative(),
      }),
    )
    .output(z.custom<HabitEntry>())
    .mutation(async ({ ctx, input }): Promise<HabitEntry> => {
      // Verify the habit belongs to the user
      const habit = await ctx.db.habit.findUnique({
        where: { id: input.habitId },
      });

      if (!habit?.userId || habit.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Normalize date to start of day
      const normalizedDate = new Date(input.date);
      normalizedDate.setHours(0, 0, 0, 0);

      return ctx.db.habitEntry.upsert({
        where: {
          habitId_date: {
            habitId: input.habitId,
            date: normalizedDate,
          },
        },
        create: {
          habitId: input.habitId,
          date: normalizedDate,
          count: input.count,
        },
        update: {
          count: input.count,
        },
      });
    }),

  /**
   * Increment the count for a habit entry on a specific date
   */
  increment: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        date: z.date().optional(),
        amount: z.number().int().positive().default(1),
      }),
    )
    .output(z.custom<HabitEntry>())
    .mutation(async ({ ctx, input }): Promise<HabitEntry> => {
      // Verify the habit belongs to the user
      const habit = await ctx.db.habit.findUnique({
        where: { id: input.habitId },
      });

      if (!habit?.userId || habit.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Use today if no date provided
      const date = input.date ?? new Date();
      // Normalize date to start of day
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);

      // Try to find existing entry
      const existing = await ctx.db.habitEntry.findUnique({
        where: {
          habitId_date: {
            habitId: input.habitId,
            date: normalizedDate,
          },
        },
      });

      if (existing) {
        return ctx.db.habitEntry.update({
          where: { id: existing.id },
          data: {
            count: existing.count + input.amount,
          },
        });
      } else {
        return ctx.db.habitEntry.create({
          data: {
            habitId: input.habitId,
            date: normalizedDate,
            count: input.amount,
          },
        });
      }
    }),

  /**
   * Delete an entry
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.custom<HabitEntry>())
    .mutation(async ({ ctx, input }): Promise<HabitEntry> => {
      // Verify the entry belongs to a habit owned by the user
      const entry = await ctx.db.habitEntry.findUnique({
        where: { id: input.id },
        include: { habit: true },
      });

      if (!entry || entry.habit.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.db.habitEntry.delete({
        where: { id: input.id },
      });
    }),
});
