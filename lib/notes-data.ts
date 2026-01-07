import { Difficulty, Note } from "./game-context";

// 曲の長さ: 3分26秒 = 206秒
const SONG_DURATION = 206;

/**
 * 難易度に応じたノーツデータを生成
 * @param difficulty 難易度
 * @param bpm 曲のBPM
 * @param songDuration 曲の長さ（秒）
 */
export function generateNotes(difficulty: Difficulty, bpm: number, songDuration?: number): Note[] {
  const notes: Note[] = [];
  let noteId = 0;
  const BEAT_INTERVAL = 60 / bpm; // 1拍の秒数

  // 難易度別の設定
  const config = {
    easy: {
      noteInterval: BEAT_INTERVAL * 2, // 2拍に1回
      laneVariety: 2, // 2レーンのみ使用
    },
    normal: {
      noteInterval: BEAT_INTERVAL, // 1拍に1回
      laneVariety: 3, // 3レーンまで使用
    },
    hard: {
      noteInterval: BEAT_INTERVAL / 2, // 0.5拍に1回
      laneVariety: 4, // 全レーン使用
    },
  };

  const { noteInterval, laneVariety } = config[difficulty];

  // 実際の曲の長さを使用（指定がない場合はデフォルト値）
  const duration = songDuration || SONG_DURATION;

  // イントロ（最初の8秒はノーツなし）
  let currentTime = 8;

  // メインパート
  while (currentTime < duration - 10) {
    // 最後の10秒前まで
    const lane = Math.floor(Math.random() * laneVariety) as 0 | 1 | 2 | 3;
    
    // 難易庥別の特殊ノーツ生成確率
    const random = Math.random();
    let longNoteChance = 0;
    let flickNoteChance = 0;
    
    if (difficulty === "easy") {
      longNoteChance = 0.1;  // 10%
      flickNoteChance = 0.1; // 10%
    } else if (difficulty === "normal") {
      longNoteChance = 0.2;  // 20%
      flickNoteChance = 0.15; // 15%
    } else if (difficulty === "hard") {
      longNoteChance = 0.3;  // 30%
      flickNoteChance = 0.2; // 20%
    }
    
    const isLongNote = random < longNoteChance;
    const isFlickNote = random >= longNoteChance && random < longNoteChance + flickNoteChance;
    
    if (isLongNote) {
      // ロングノーツ（1拍～2拍の長さ）
      const longDuration = BEAT_INTERVAL * (1 + Math.floor(Math.random() * 2));
      notes.push({
        id: `note_${noteId++}`,
        time: currentTime,
        lane,
        type: "long",
        duration: longDuration,
      });
      // ロングノーツの場合は長さ分だけ次のノーツを遅らせる
      currentTime += longDuration + noteInterval;
    } else if (isFlickNote) {
      // フリックノーツ（ランダムな方向）
      const directions: ("up" | "down" | "left" | "right")[] = ["up", "down", "left", "right"];
      const flickDirection = directions[Math.floor(Math.random() * directions.length)];
      notes.push({
        id: `note_${noteId++}`,
        time: currentTime,
        lane,
        type: "flick",
        flickDirection,
      });
      // 次のノーツまでの時間
      const randomOffset = (Math.random() - 0.5) * noteInterval * 0.2;
      currentTime += noteInterval + randomOffset;
    } else {
      // 通常ノーツ
      notes.push({
        id: `note_${noteId++}`,
        time: currentTime,
        lane,
      });
      // 次のノーツまでの時間（ランダム性を少し加える）
      const randomOffset = (Math.random() - 0.5) * noteInterval * 0.2;
      currentTime += noteInterval + randomOffset;
    }
  }

  // アウトロ（最後の10秒は徐々に減らす）
  while (currentTime < duration - 5) {
    // 曲の終わり5秒前まで（安全マージン）
    const lane = Math.floor(Math.random() * laneVariety) as 0 | 1 | 2 | 3;
    notes.push({
      id: `note_${noteId++}`,
      time: currentTime,
      lane,
    });
    currentTime += noteInterval * 2; // 間隔を広げる
  }

  return notes;
}

// デフォルトBPM（後方互換性のため）
const DEFAULT_BPM = 82;

// 各難易度のノーツデータを事前生成（デフォルトBPM）
export const NOTES_DATA: Record<Difficulty, Note[]> = {
  easy: generateNotes("easy", DEFAULT_BPM),
  normal: generateNotes("normal", DEFAULT_BPM),
  hard: generateNotes("hard", DEFAULT_BPM),
};

// ノーツ数の情報
export const NOTES_COUNT = {
  easy: NOTES_DATA.easy.length,
  normal: NOTES_DATA.normal.length,
  hard: NOTES_DATA.hard.length,
};
