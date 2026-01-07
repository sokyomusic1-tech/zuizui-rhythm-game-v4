import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SongData } from "./song-data";

export type Difficulty = "easy" | "normal" | "hard";

export type FlickDirection = "up" | "down" | "left" | "right";

export interface Note {
  id: string;
  time: number; // 曲開始からの秒数
  lane: 0 | 1 | 2 | 3; // 4つのレーン
  type?: "normal" | "long" | "flick" | "slide"; // ノーツタイプ（デフォルト: normal）
  duration?: number; // 長押しノーツの長さ（秒）
  flickDirection?: FlickDirection; // フリックノーツの方向
  slideTarget?: 0 | 1 | 2 | 3; // スライドノーツの移動先レーン
}

export interface JudgementResult {
  type: "perfect" | "good" | "normal" | "miss";
  time: number;
  timing?: "fast" | "late" | "perfect"; // Fast/Late表示用
}

export interface GameScore {
  score: number;
  perfect: number;
  good: number;
  miss: number;
  maxCombo: number;
  difficulty: Difficulty;
}

export interface PendingScore extends GameScore {
  username: string;
  timestamp: number;
}

export interface HighScores {
  easy: number;
  normal: number;
  hard: number;
}

interface GameContextType {
  highScores: HighScores;
  loadHighScores: () => Promise<void>;
  saveHighScore: (difficulty: Difficulty, score: number) => Promise<void>;
  currentDifficulty: Difficulty | null;
  setCurrentDifficulty: (difficulty: Difficulty | null) => void;
  lastGameResult: GameScore | null;
  setLastGameResult: (result: GameScore | null) => void;
  username: string | null;
  setUsername: (name: string) => Promise<void>;
  loadUsername: () => Promise<void>;
  selectedSong: SongData | null;
  setSelectedSong: (song: SongData | null) => void;
  pendingScores: PendingScore[];
  addPendingScore: (score: GameScore) => Promise<void>;
  removePendingScore: (timestamp: number) => Promise<void>;
  loadPendingScores: () => Promise<void>;
  noteSpeed: number; // ノーツスピード（0.5～2.0）
  setNoteSpeed: (speed: number) => Promise<void>;
  loadNoteSpeed: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const HIGH_SCORES_KEY = "@rhythm_game_high_scores";
const USERNAME_KEY = "@rhythm_game_username";
const PENDING_SCORES_KEY = "@rhythm_game_pending_scores";
const NOTE_SPEED_KEY = "@rhythm_game_note_speed";

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [highScores, setHighScores] = useState<HighScores>({
    easy: 0,
    normal: 0,
    hard: 0,
  });
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty | null>(null);
  const [lastGameResult, setLastGameResult] = useState<GameScore | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<SongData | null>(null);
  const [pendingScores, setPendingScores] = useState<PendingScore[]>([]);
  const [noteSpeed, setNoteSpeedState] = useState<number>(1.0); // デフォルト: 1.0倍

  const loadHighScores = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(HIGH_SCORES_KEY);
      if (stored) {
        setHighScores(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load high scores:", error);
    }
  }, []);

  const saveHighScore = useCallback(
    async (difficulty: Difficulty, score: number) => {
      try {
        const newHighScores = { ...highScores };
        if (score > newHighScores[difficulty]) {
          newHighScores[difficulty] = score;
          setHighScores(newHighScores);
          await AsyncStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(newHighScores));
        }
      } catch (error) {
        console.error("Failed to save high score:", error);
      }
    },
    [highScores]
  );

  const loadUsername = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(USERNAME_KEY);
      if (stored) {
        setUsernameState(stored);
      }
    } catch (error) {
      console.error("Failed to load username:", error);
    }
  }, []);

  const setUsername = useCallback(async (name: string) => {
    try {
      await AsyncStorage.setItem(USERNAME_KEY, name);
      setUsernameState(name);
    } catch (error) {
      console.error("Failed to save username:", error);
    }
  }, []);

  const loadPendingScores = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_SCORES_KEY);
      if (stored) {
        setPendingScores(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load pending scores:", error);
    }
  }, []);

  const addPendingScore = useCallback(async (score: GameScore) => {
    try {
      if (!username) {
        console.error("Cannot add pending score without username");
        return;
      }
      const pendingScore: PendingScore = {
        ...score,
        username,
        timestamp: Date.now(),
      };
      const newPendingScores = [...pendingScores, pendingScore];
      setPendingScores(newPendingScores);
      await AsyncStorage.setItem(PENDING_SCORES_KEY, JSON.stringify(newPendingScores));
    } catch (error) {
      console.error("Failed to add pending score:", error);
    }
  }, [username, pendingScores]);

  const removePendingScore = useCallback(async (timestamp: number) => {
    try {
      const newPendingScores = pendingScores.filter(s => s.timestamp !== timestamp);
      setPendingScores(newPendingScores);
      await AsyncStorage.setItem(PENDING_SCORES_KEY, JSON.stringify(newPendingScores));
    } catch (error) {
      console.error("Failed to remove pending score:", error);
    }
  }, [pendingScores]);

  const loadNoteSpeed = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTE_SPEED_KEY);
      if (stored) {
        setNoteSpeedState(parseFloat(stored));
      }
    } catch (error) {
      console.error("Failed to load note speed:", error);
    }
  }, []);

  const setNoteSpeed = useCallback(async (speed: number) => {
    try {
      const clampedSpeed = Math.max(0.5, Math.min(2.0, speed)); // 0.5～2.0に制限
      setNoteSpeedState(clampedSpeed);
      await AsyncStorage.setItem(NOTE_SPEED_KEY, clampedSpeed.toString());
    } catch (error) {
      console.error("Failed to save note speed:", error);
    }
  }, []);

  return (
    <GameContext.Provider
      value={{
        highScores,
        loadHighScores,
        saveHighScore,
        currentDifficulty,
        setCurrentDifficulty,
        lastGameResult,
        setLastGameResult,
        username,
        setUsername,
        loadUsername,
        selectedSong,
        setSelectedSong,
        pendingScores,
        addPendingScore,
        removePendingScore,
        loadPendingScores,
        noteSpeed,
        setNoteSpeed,
        loadNoteSpeed,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within GameProvider");
  }
  return context;
}
