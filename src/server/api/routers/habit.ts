import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { Habit, HabitEntry } from "../../../../generated/prisma";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Define the type for Habit with entries
type HabitWithEntries = Habit & { entries: HabitEntry[] };

export const habitRouter = createTRPCRouter({
  /**
   * Get all habits for the authenticated user
   */
  getAll: protectedProcedure
    .output(z.array(z.custom<Habit>()))
    .query(({ ctx }): Promise<Habit[]> => {
      return ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  /**
   * Get all active habits for the authenticated user
   */
  getAllActive: protectedProcedure
    .output(z.array(z.custom<Habit>()))
    .query(({ ctx }): Promise<Habit[]> => {
      return ctx.db.habit.findMany({
        where: {
          userId: ctx.session.user.id,
          isActive: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  /**
   * Get a single habit by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.custom<HabitWithEntries>().nullable())
    .query(async ({ ctx, input }): Promise<HabitWithEntries | null> => {
      const habit = await ctx.db.habit.findUnique({
        where: {
          id: input.id,
        },
        include: {
          entries: {
            orderBy: {
              date: "desc",
            },
            take: 365, // Last year of data
          },
        },
      });

      // Ensure the habit belongs to the user
      if (habit && habit.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return habit;
    }),

  /**
   * Create a new habit
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        dailyGoal: z.number().int().positive().default(1),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .default("#3b82f6"),
      }),
    )
    .output(z.custom<Habit>())
    .mutation(({ ctx, input }): Promise<Habit> => {
      return ctx.db.habit.create({
        data: {
          name: input.name,
          description: input.description,
          dailyGoal: input.dailyGoal,
          color: input.color,
          userId: ctx.session.user.id,
        },
      });
    }),

  /**
   * Update an existing habit
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        dailyGoal: z.number().int().positive().optional(),
        color: z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/)
          .optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .output(z.custom<Habit>())
    .mutation(async ({ ctx, input }): Promise<Habit> => {
      // Verify ownership
      const habit = await ctx.db.habit.findUnique({
        where: { id: input.id },
      });

      if (habit?.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const { id, ...data } = input;
      return ctx.db.habit.update({
        where: { id },
        data,
      });
    }),

  /**
   * Delete a habit (soft delete by setting isActive to false)
   */
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.custom<Habit>())
    .mutation(async ({ ctx, input }): Promise<Habit> => {
      // Verify ownership
      const habit = await ctx.db.habit.findUnique({
        where: { id: input.id },
      });

      if (habit?.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.db.habit.update({
        where: { id: input.id },
        data: { isActive: false },
      });
    }),

  /**
   * Permanently delete a habit and all its entries
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(z.custom<Habit>())
    .mutation(async ({ ctx, input }): Promise<Habit> => {
      // Verify ownership
      const habit = await ctx.db.habit.findUnique({
        where: { id: input.id },
      });

      if (habit?.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.db.habit.delete({
        where: { id: input.id },
      });
    }),
});
