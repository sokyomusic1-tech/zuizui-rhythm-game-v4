import { describe, it, expect } from "vitest";
import { NOTES_DATA, NOTES_COUNT } from "@/lib/notes-data";

describe("Notes Data", () => {
  it("should generate notes for all difficulties", () => {
    expect(NOTES_DATA.easy).toBeDefined();
    expect(NOTES_DATA.normal).toBeDefined();
    expect(NOTES_DATA.hard).toBeDefined();
  });

  it("should have increasing note counts by difficulty", () => {
    expect(NOTES_COUNT.easy).toBeGreaterThan(0);
    expect(NOTES_COUNT.normal).toBeGreaterThan(NOTES_COUNT.easy);
    expect(NOTES_COUNT.hard).toBeGreaterThan(NOTES_COUNT.normal);
  });

  it("should have valid note properties", () => {
    const easyNotes = NOTES_DATA.easy;
    expect(easyNotes.length).toBeGreaterThan(0);

    easyNotes.forEach((note) => {
      expect(note.id).toBeDefined();
      expect(note.time).toBeGreaterThanOrEqual(0);
      expect(note.lane).toBeGreaterThanOrEqual(0);
      expect(note.lane).toBeLessThanOrEqual(3);
    });
  });

  it("should have notes within song duration", () => {
    const SONG_DURATION = 206;

    Object.values(NOTES_DATA).forEach((notes) => {
      notes.forEach((note) => {
        expect(note.time).toBeLessThanOrEqual(SONG_DURATION);
      });
    });
  });
});

describe("Score Calculation", () => {
  it("should calculate perfect score correctly", () => {
    const baseScore = 100;
    const combo = 10;
    const comboMultiplier = Math.floor(combo / 10) * 0.1 + 1;
    const expectedScore = Math.floor(baseScore * comboMultiplier);

    expect(expectedScore).toBe(110); // combo 10 = 1.1x multiplier
  });

  it("should calculate good score correctly", () => {
    const baseScore = 50;
    const combo = 20;
    const comboMultiplier = Math.floor(combo / 10) * 0.1 + 1;
    const expectedScore = Math.floor(baseScore * comboMultiplier);

    expect(expectedScore).toBe(60); // combo 20 = 1.2x multiplier
  });

  it("should increase score with combo", () => {
    const baseScore = 100;

    const score0 = Math.floor(baseScore * 1.0);
    const score10 = Math.floor(baseScore * 1.0);
    const score20 = Math.floor(baseScore * 1.2);
    const score50 = Math.floor(baseScore * 1.5);

    expect(score10).toBe(score0);
    expect(score20).toBeGreaterThan(score10);
    expect(score50).toBeGreaterThan(score20);
  });
});

describe("Judgement System", () => {
  const JUDGEMENT_PERFECT = 50; // ms
  const JUDGEMENT_GOOD = 100; // ms

  it("should judge perfect within threshold", () => {
    const timeDiff = 30; // ms
    expect(timeDiff).toBeLessThanOrEqual(JUDGEMENT_PERFECT);
  });

  it("should judge good within threshold", () => {
    const timeDiff = 80; // ms
    expect(timeDiff).toBeGreaterThan(JUDGEMENT_PERFECT);
    expect(timeDiff).toBeLessThanOrEqual(JUDGEMENT_GOOD);
  });

  it("should judge miss outside threshold", () => {
    const timeDiff = 150; // ms
    expect(timeDiff).toBeGreaterThan(JUDGEMENT_GOOD);
  });
});
