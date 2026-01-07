import { desc, eq, and, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, scores, InsertScore } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * スコアをデータベースに保存
 */
export async function createScore(data: InsertScore) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(scores).values(data);
  return true;
}

/**
 * 難易度別のトップ100ランキングを取得
 */
export async function getLeaderboard(difficulty: "easy" | "normal" | "hard", limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(scores)
    .where(eq(scores.difficulty, difficulty))
    .orderBy(desc(scores.score))
    .limit(limit);
}

/**
 * 全難易度のトップ100ランキングを取得
 */
export async function getAllLeaderboards(limit = 100) {
  const db = await getDb();
  if (!db) return { easy: [], normal: [], hard: [] };

  const [easy, normal, hard] = await Promise.all([
    db
      .select()
      .from(scores)
      .where(eq(scores.difficulty, "easy"))
      .orderBy(desc(scores.score))
      .limit(limit),
    db
      .select()
      .from(scores)
      .where(eq(scores.difficulty, "normal"))
      .orderBy(desc(scores.score))
      .limit(limit),
    db
      .select()
      .from(scores)
      .where(eq(scores.difficulty, "hard"))
      .orderBy(desc(scores.score))
      .limit(limit),
  ]);

  return { easy, normal, hard };
}

/**
 * 曲ごとのランキングを取得
 */
export async function getLeaderboardBySong(
  songId: string,
  difficulty?: "easy" | "normal" | "hard",
  limit = 100
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(scores.songId, songId)];
  if (difficulty) {
    conditions.push(eq(scores.difficulty, difficulty));
  }

  return db
    .select()
    .from(scores)
    .where(and(...conditions))
    .orderBy(desc(scores.score))
    .limit(limit);
}

/**
 * 曲ごとの最高得点を取得（過去最高と今月最高）
 */
export async function getTopScoresBySong(
  songId: string,
  difficulty: "easy" | "normal" | "hard"
) {
  const db = await getDb();
  if (!db) return { allTime: null, thisMonth: null };

  // 過去最高得点
  const allTimeResult = await db
    .select()
    .from(scores)
    .where(and(eq(scores.songId, songId), eq(scores.difficulty, difficulty)))
    .orderBy(desc(scores.score))
    .limit(1);

  // 今月の最高得点
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const thisMonthResult = await db
    .select()
    .from(scores)
    .where(
      and(
        eq(scores.songId, songId),
        eq(scores.difficulty, difficulty),
        gte(scores.createdAt, firstDayOfMonth)
      )
    )
    .orderBy(desc(scores.score))
    .limit(1);

  return {
    allTime: allTimeResult[0] || null,
    thisMonth: thisMonthResult[0] || null,
  };
}
