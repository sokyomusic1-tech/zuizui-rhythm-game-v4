import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Leaderboard API
  leaderboard: router({
    // スコアを送信
    submitScore: publicProcedure
      .input(
        z.object({
          username: z.string().min(1).max(50),
          score: z.number().int().min(0),
          songId: z.string().min(1).max(50),
          difficulty: z.enum(["easy", "normal", "hard"]),
          perfect: z.number().int().min(0),
          good: z.number().int().min(0),
          miss: z.number().int().min(0),
          maxCombo: z.number().int().min(0),
        })
      )
      .mutation(async ({ input }) => {
        await db.createScore(input);
        return { success: true };
      }),

    // 難易度別ランキングを取得
    getByDifficulty: publicProcedure
      .input(
        z.object({
          difficulty: z.enum(["easy", "normal", "hard"]),
          limit: z.number().int().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        return db.getLeaderboard(input.difficulty, input.limit);
      }),

    // 全難易度のランキングを取得
    getAll: publicProcedure
      .input(
        z.object({
          limit: z.number().int().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        return db.getAllLeaderboards(input.limit);
      }),

    // 曲ごとのランキングを取得
    getBySong: publicProcedure
      .input(
        z.object({
          songId: z.string().min(1).max(50),
          difficulty: z.enum(["easy", "normal", "hard"]).optional(),
          limit: z.number().int().min(1).max(100).optional(),
        })
      )
      .query(async ({ input }) => {
        return db.getLeaderboardBySong(input.songId, input.difficulty, input.limit);
      }),

    // 曲ごとの最高得点を取得（過去最高と今月最高）
    getTopScoresBySong: publicProcedure
      .input(
        z.object({
          songId: z.string().min(1).max(50),
          difficulty: z.enum(["easy", "normal", "hard"]),
        })
      )
      .query(async ({ input }) => {
        return db.getTopScoresBySong(input.songId, input.difficulty);
      }),
  }),
});

export type AppRouter = typeof appRouter;
