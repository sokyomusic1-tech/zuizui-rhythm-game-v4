import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, Text, Pressable, Dimensions, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { Video, ResizeMode } from "expo-av";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useGame, type JudgementResult } from "@/lib/game-context";
import { NOTES_DATA, generateNotes } from "@/lib/notes-data";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_NOTE_FALL_DURATION = 2500; // ノーツが落ちる基本時間（ミリ秒）
const JUDGEMENT_PERFECT = 150; // Perfect判定の許容誤差（ミリ秒）
const JUDGEMENT_GOOD = 300; // Good判定の許容誤差（ミリ秒）
const JUDGEMENT_NORMAL = 500; // Normal判定の許容誤差（ミリ秒）
const MISS_THRESHOLD = 700; // Miss判定のタイムアウト（ミリ秒）
const LANE_WIDTH = SCREEN_WIDTH / 4;
const TAP_AREA_HEIGHT = 80;
const NOTE_SIZE = 60;

// ノーツコンポーネントをメモ化して点滅を防ぐ
const Note = React.memo(({ note, gameTime, noteFallDuration }: { note: any; gameTime: number; noteFallDuration: number }) => {
  const noteTime = note.time * 1000;
  const progress = (gameTime - (noteTime - noteFallDuration)) / noteFallDuration;
  const top = progress * (SCREEN_HEIGHT - TAP_AREA_HEIGHT);
  
  // ロングノーツの場合の高さ計算
  const isLongNote = note.type === "long" && note.duration;
  const longNoteHeight = isLongNote ? (note.duration! * 1000 / noteFallDuration) * (SCREEN_HEIGHT - TAP_AREA_HEIGHT) : 0;
  
  // フリックノーツの判定
  const isFlickNote = note.type === "flick" && note.flickDirection;
  
  // フリックノーツの矢印を取得
  const getFlickArrow = (direction: string) => {
    switch (direction) {
      case "up": return "↑";
      case "down": return "↓";
      case "left": return "←";
      case "right": return "→";
      default: return "↑";
    }
  };

  return (
    <View
      className="absolute"
      pointerEvents="none"
      style={{
        width: NOTE_SIZE,
        height: isLongNote ? longNoteHeight + NOTE_SIZE : NOTE_SIZE,
        top: isLongNote ? top - longNoteHeight : top,
        left: (LANE_WIDTH - NOTE_SIZE) / 2,
      }}
    >
      {/* ロングノーツの場合は縦長のバーを表示 */}
      {isLongNote && (
        <>
          {/* バー本体 */}
          <View
            className="absolute"
            style={{
              width: NOTE_SIZE * 0.6,
              height: longNoteHeight,
              top: 0,
              left: NOTE_SIZE * 0.2,
              backgroundColor: '#FF6E40',
              opacity: 0.8,
              borderRadius: 10,
            }}
          />
          {/* 終点マーカー（小さな丸） */}
          <View
            className="absolute rounded-full"
            style={{
              width: NOTE_SIZE * 0.5,
              height: NOTE_SIZE * 0.5,
              top: -NOTE_SIZE * 0.25,
              left: NOTE_SIZE * 0.25,
              backgroundColor: '#FFD700',
              borderWidth: 2,
              borderColor: '#FFF',
              shadowColor: '#FFD700',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 10,
            }}
          />
        </>
      )}
      
      {/* ノーツのヘッド部分 */}
      <View
        className="absolute rounded-full"
        style={{
          width: NOTE_SIZE,
          height: NOTE_SIZE,
          top: isLongNote ? longNoteHeight : 0,
          left: 0,
          backgroundColor: isFlickNote ? '#2196F3' : '#D84315',
          shadowColor: isFlickNote ? '#2196F3' : '#D84315',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 20,
          elevation: 15,
        }}
      >
        {/* 外側の光るリング */}
        <View
          className="absolute rounded-full"
          style={{
            width: NOTE_SIZE + 8,
            height: NOTE_SIZE + 8,
            top: -4,
            left: -4,
            borderWidth: 2,
            borderColor: isFlickNote ? '#64B5F6' : '#FF6E40',
            opacity: 0.5,
          }}
        />
        
        {/* 内側のグラデーション */}
        <View
          className="absolute inset-0 rounded-full"
          style={{
            backgroundColor: isFlickNote ? '#64B5F6' : '#FF6E40',
            opacity: 0.7,
          }}
        />
        
        {/* 中心の白い光 */}
        <View
          className="absolute rounded-full"
          style={{
            width: NOTE_SIZE * 0.4,
            height: NOTE_SIZE * 0.4,
            top: NOTE_SIZE * 0.3,
            left: NOTE_SIZE * 0.3,
            backgroundColor: '#FFFFFF',
            opacity: 0.8,
          }}
        />
        
        {/* フリックノーツの矢印 */}
        {isFlickNote && (
          <Text
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: NOTE_SIZE,
              height: NOTE_SIZE,
              fontSize: 40,
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: NOTE_SIZE,
            }}
          >
            {getFlickArrow(note.flickDirection!)}
          </Text>
        )}
      </View>
    </View>
  );
});

export default function GameScreen() {
  const router = useRouter();
  const { currentDifficulty, saveHighScore, setLastGameResult, selectedSong, noteSpeed } = useGame();
  
  // ノーツスピードに応じて落下時間を調整（スピードが速いほど短く）
  const NOTE_FALL_DURATION = BASE_NOTE_FALL_DURATION / noteSpeed;
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [gameTime, setGameTime] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [normalCount, setNormalCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [holdingNotes, setHoldingNotes] = useState<{ [noteId: string]: { startTime: number; lane: number } }>({});
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number; lane: number; time: number } | null>(null);
  const [judgementDisplay, setJudgementDisplay] = useState<JudgementResult | null>(null);
  const [tapEffects, setTapEffects] = useState<{ [key: number]: boolean }>({});
  const [perfectEffects, setPerfectEffects] = useState<{ [key: number]: { show: boolean; y: number; lane: number; position: number } }>({});
  const [showFullCombo, setShowFullCombo] = useState(false);
  const [showAllPerfect, setShowAllPerfect] = useState(false);
  const [feverMode, setFeverMode] = useState(false);
  const [feverGauge, setFeverGauge] = useState(0);
  const tapSound = useAudioPlayer(require("@/assets/sounds/tap.wav"));
  const [songDuration, setSongDuration] = useState<number | null>(null);
  const actualSongDuration = selectedSong ? selectedSong.duration * 1000 : null; // 楽曲データから取得した長さ（ミリ秒）
  const gameTimeRef = useRef(0);
  const processedNotesRef = useRef(new Set<string>());
  const gameEndCalledRef = useRef(false);
  const intervalRef = useRef<any>(null);

  const player = useAudioPlayer(selectedSong?.audioFile || require("@/assets/audio/zuizui_song.mp3"));

  // 選択された曲のBPMと長さに基づいてノーツを生成
  const notes = useMemo(() => {
    return currentDifficulty && selectedSong
      ? generateNotes(currentDifficulty, selectedSong.bpm, selectedSong.duration)
      : currentDifficulty
      ? NOTES_DATA[currentDifficulty]
      : [];
  }, [currentDifficulty, selectedSong]);

  // コンポーネントのアンマウント時に音楽を停止
  useEffect(() => {
    // ブラウザを閉じた時に音楽を停止
    const handleBeforeUnload = () => {
      if (player) {
        player.pause();
        player.release();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && player) {
        player.pause();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (player) {
        player.pause();
        player.release();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [player]);

  // ゲーム終了処理
  const handleGameEnd = useCallback(async () => {
    if (gameEndCalledRef.current) return;
    gameEndCalledRef.current = true;
    
    // フルコンボとオールパーフェクト判定
    const isFullCombo = missCount === 0;
    const isAllPerfect = missCount === 0 && goodCount === 0 && normalCount === 0;
    
    // 音楽を停止
    player.pause();
    
    // タイマーをクリア
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // フルコンボ/オールパーフェクト演出
    if (isAllPerfect) {
      // オールパーフェクト演出
      setShowAllPerfect(true);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // 2秒後にアニメーションを非表示
      setTimeout(() => setShowAllPerfect(false), 2000);
    } else if (isFullCombo) {
      // フルコンボ演出
      setShowFullCombo(true);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      // 2秒後にアニメーションを非表示
      setTimeout(() => setShowFullCombo(false), 2000);
    }

    if (currentDifficulty) {
      await saveHighScore(currentDifficulty, score);
      
      const result = {
        score,
        perfect: perfectCount,
        good: goodCount + normalCount, // GoodとNormalを合算
        miss: missCount,
        maxCombo,
        difficulty: currentDifficulty,
      };
      
      setLastGameResult(result);
    }

    router.replace("/result" as any);
  }, [score, perfectCount, goodCount, normalCount, missCount, maxCombo, currentDifficulty, saveHighScore, setLastGameResult, router, player]);

  // 音声設定
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  // 曲の長さを設定（楽曲データを優先）
  useEffect(() => {
    if (actualSongDuration) {
      setSongDuration(actualSongDuration);
    } else {
      // フォールバック: プレイヤーから取得
      const checkDuration = setInterval(() => {
        if (player.duration && player.duration > 0) {
          setSongDuration(player.duration * 1000);
          clearInterval(checkDuration);
        }
      }, 100);
      return () => clearInterval(checkDuration);
    }
  }, [player, actualSongDuration]);

  // カウントダウン
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !gameStarted) {
      setGameStarted(true);
      player.play();
    }
  }, [countdown, gameStarted, player]);

  // ゲームタイマー
  useEffect(() => {
    if (!gameStarted || !songDuration) return;

    intervalRef.current = setInterval(() => {
      gameTimeRef.current += 16;
      setGameTime(gameTimeRef.current);

      // ゲーム終了チェック（曲の長さ + ノーツ落下時間 + 判定時間）
      if (gameTimeRef.current > songDuration + NOTE_FALL_DURATION + MISS_THRESHOLD && !gameEndCalledRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimeout(() => handleGameEnd(), 0);
      }
    }, 16);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameStarted, songDuration, handleGameEnd]);

  // ノーツの更新
  useEffect(() => {
    if (!gameStarted || gameEndCalledRef.current || !songDuration) return;

    const currentTime = gameTime;
    const upcomingNotes = notes.filter((note) => {
      const noteTime = note.time * 1000;
      const timeDiff = noteTime - currentTime;
      // 曲の長さを超えるノーツは生成しない
      if (noteTime > songDuration) return false;
      return timeDiff >= 0 && timeDiff <= NOTE_FALL_DURATION && !processedNotesRef.current.has(note.id);
    });

    const newActiveNotes = upcomingNotes.map((note) => note.id);
    if (newActiveNotes.length > 0) {
      setActiveNotes((prev) => [...prev, ...newActiveNotes]);
      newActiveNotes.forEach((id) => processedNotesRef.current.add(id));
    }
    // 画面外に出たノーツを削除（Miss判定）- 判定範囲を延長
    setActiveNotes((prev) =>
      prev.filter((noteId) => {
        const note = notes.find((n) => n.id === noteId);
        if (!note) return false;

        // ロングノーツはholdingNotesで管理されているのでスキップ
        if (note.type === "long" && holdingNotes[noteId]) {
          return true; // 長押し中はMiss判定しない
        }

        const noteTime = note.time * 1000;
        const timeDiff = currentTime - noteTime;

        // Miss判定の範囲を超えたら削除
        if (timeDiff > MISS_THRESHOLD) {
          handleMiss();
          return false;
        }
        return true;
      })
    );
  }, [gameTime, gameStarted, notes]);

  const handleRelease = (lane: number) => {
    // フリックノーツの判定（スワイプ方向をチェック）
    const laneNotes = activeNotes
      .map((noteId) => notes.find((n) => n.id === noteId))
      .filter((note) => note && note.lane === lane && note.type === "flick");

    if (laneNotes.length > 0) {
      // 最も近いフリックノーツを判定
      const closestNote = laneNotes.reduce((closest, note) => {
        if (!note || !closest) return note || closest;
        const noteDiff = Math.abs(note.time * 1000 - gameTime);
        const closestDiff = Math.abs(closest.time * 1000 - gameTime);
        return noteDiff < closestDiff ? note : closest;
      });

      if (closestNote) {
        const noteTime = closestNote.time * 1000;
        const timeDiff = Math.abs(noteTime - gameTime);

        // ノーツを削除
        setActiveNotes((prev) => prev.filter((id) => id !== closestNote.id));

        // フリック判定（方向は問わず、タイミングだけで判定）
        if (timeDiff <= JUDGEMENT_PERFECT) {
          handlePerfect();
        } else if (timeDiff <= JUDGEMENT_GOOD) {
          handleGood();
        } else if (timeDiff <= JUDGEMENT_NORMAL) {
          handleNormal();
        } else {
          handleMiss();
        }
        return;
      }
    }

    // 長押し中のノーツをチェック
    const holdingNote = Object.entries(holdingNotes).find(([_, note]) => note.lane === lane);
    if (!holdingNote) return;

    const [noteId, noteState] = holdingNote;
    const note = notes.find(n => n.id === noteId);
    if (!note || note.type !== "long" || !note.duration) return;

    const currentTime = gameTime;
    const holdDuration = currentTime - noteState.startTime;
    const requiredDuration = note.duration * 1000;
    const noteEndTime = note.time * 1000 + requiredDuration;
    const timeDiff = Math.abs(currentTime - noteEndTime);

    // 長押し状態を解除
    setHoldingNotes(prev => {
      const newHolding = { ...prev };
      delete newHolding[noteId];
      return newHolding;
    });

    // ノーツを削除
    setActiveNotes((prev) => prev.filter((id) => id !== noteId));

    // 判定
    if (timeDiff <= JUDGEMENT_PERFECT) {
      handlePerfect();
    } else if (timeDiff <= JUDGEMENT_GOOD) {
      handleGood();
    } else if (timeDiff <= JUDGEMENT_NORMAL) {
      handleNormal();
    } else {
      handleMiss();
    }
  };

  const handleTap = (lane: number) => {
    if (!gameStarted) return;

    // タップエフェクトを表示
    setTapEffects(prev => ({ ...prev, [lane]: true }));
    setTimeout(() => {
      setTapEffects(prev => ({ ...prev, [lane]: false }));
    }, 200);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // タップ効果音を再生
    tapSound.seekTo(0);
    tapSound.play();

    console.log(`Tap on lane ${lane}, gameTime: ${gameTime}, activeNotes:`, activeNotes.length);

    const currentTime = gameTime;
    const laneNotes = activeNotes
      .map((noteId) => notes.find((n) => n.id === noteId))
      .filter((note) => note && note.lane === lane && !holdingNotes[note.id]); // 長押し中のノーツを除外

    if (laneNotes.length === 0) {
      return; // 空振りはMissにしない
    }

    // 最も近いノーツを判定
    const closestNote = laneNotes.reduce((closest, note) => {
      if (!note || !closest) return note || closest;
      const noteDiff = Math.abs(note.time * 1000 - currentTime);
      const closestDiff = Math.abs(closest.time * 1000 - currentTime);
      return noteDiff < closestDiff ? note : closest;
    });

    if (!closestNote) {
      return;
    }

    const noteTime = closestNote.time * 1000;
    const timeDiff = Math.abs(noteTime - currentTime);
    const timingDiff = currentTime - noteTime; // 正：遅い、負：早い

    // Fast/Late判定
    let timing: "fast" | "late" | "perfect" = "perfect";
    if (timeDiff > 50) { // 50ms以上の誤差がある場合
      timing = timingDiff > 0 ? "late" : "fast";
    }

    // ロングノーツの場合は長押し状態を記録
    if (closestNote.type === "long" && closestNote.duration) {
      // ロングノーツはactiveNotesに残して、holdingNotesで長押し状態を管理
      setHoldingNotes(prev => ({
        ...prev,
        [closestNote.id]: { startTime: currentTime, lane }
      }));
      return; // 長押し開始時は判定しない
    }

    // フリックノーツの場合はスワイプ開始位置を記録
    if (closestNote.type === "flick" && closestNote.flickDirection) {
      // ノーツをactiveNotesから削除（連続ノーツの誤判定を防ぐ）
      setActiveNotes((prev) => prev.filter((id) => id !== closestNote.id));
      // スワイプ開始位置を記録（判定はhandleReleaseで行う）
      return; // フリックはタップでは判定しない
    }

    // 通常ノーツの場合は削除
    setActiveNotes((prev) => prev.filter((id) => id !== closestNote.id));

    // 4段階判定
    if (timeDiff <= JUDGEMENT_PERFECT) {
      handlePerfect(timing);
      // Perfectエフェクトをノーツの位置に表示
      const progress = (currentTime - (noteTime - NOTE_FALL_DURATION)) / NOTE_FALL_DURATION;
      const notePosition = progress * (SCREEN_HEIGHT - TAP_AREA_HEIGHT);
      const effectId = `${Date.now()}_${lane}`;
      setPerfectEffects(prev => ({ ...prev, [effectId]: { lane, position: notePosition } }));
      setTimeout(() => {
        setPerfectEffects(prev => {
          const newEffects = { ...prev };
          delete (newEffects as any)[effectId];
          return newEffects;
        });
      }, 500);
    } else if (timeDiff <= JUDGEMENT_GOOD) {
      handleGood(timing);
    } else if (timeDiff <= JUDGEMENT_NORMAL) {
      handleNormal(timing);
    } else {
      handleMiss();
    }
  };

  const handlePerfect = (timing?: "fast" | "late" | "perfect") => {
    const scoreBonus = feverMode ? 150 : 100; // フィーバー中は1.5倍
    setScore((prev) => prev + scoreBonus);
    setCombo((prev) => {
      const newCombo = prev + 1;
      setMaxCombo((max) => Math.max(max, newCombo));
      
      // フィーバーゲージを増やす
      if (!feverMode) {
        setFeverGauge((gauge) => {
          const newGauge = Math.min(gauge + 2, 100);
          // 50コンボでフィーバーモード発動
          if (newCombo >= 50 && newGauge >= 100) {
            setFeverMode(true);
            setTimeout(() => {
              setFeverMode(false);
              setFeverGauge(0);
            }, 10000); // 10秒間
          }
          return newGauge;
        });
      }
      
      return newCombo;
    });
    setPerfectCount((prev) => prev + 1);
    showJudgement("perfect", timing);
  };

  const handleGood = (timing?: "fast" | "late" | "perfect") => {
    const scoreBonus = feverMode ? 105 : 70; // フィーバー中は1.5倍
    setScore((prev) => prev + scoreBonus);
    setCombo((prev) => {
      const newCombo = prev + 1;
      setMaxCombo((max) => Math.max(max, newCombo));
      
      // フィーバーゲージを少し増やす
      if (!feverMode) {
        setFeverGauge((gauge) => Math.min(gauge + 1, 100));
      }
      
      return newCombo;
    });
    setGoodCount((prev) => prev + 1);
    showJudgement("good", timing);
  };

  const handleNormal = (timing?: "fast" | "late" | "perfect") => {
    const scoreBonus = feverMode ? 60 : 40; // フィーバー中は1.5倍
    setScore((prev) => prev + scoreBonus);
    setCombo((prev) => {
      const newCombo = prev + 1;
      setMaxCombo((max) => Math.max(max, newCombo));
      
      // フィーバーゲージを少し増やす
      if (!feverMode) {
        setFeverGauge((gauge) => Math.min(gauge + 0.5, 100));
      }
      
      return newCombo;
    });
    setNormalCount((prev) => prev + 1);
    showJudgement("normal", timing);
  };

  const handleMiss = () => {
    setCombo(0);
    setMissCount((prev) => prev + 1);
    showJudgement("miss");
    
    // フィーバーゲージを減らす
    if (!feverMode) {
      setFeverGauge((gauge) => Math.max(gauge - 10, 0));
    }
  };

  const showJudgement = (type: "perfect" | "good" | "normal" | "miss", timing?: "fast" | "late" | "perfect") => {
    setJudgementDisplay({ type, time: gameTime, timing });
    setTimeout(() => setJudgementDisplay(null), 500);
  };

  // レーンごとのノーツをメモ化
  const notesByLane = useMemo(() => {
    const lanes: { [key: number]: any[] } = { 0: [], 1: [], 2: [], 3: [] };
    activeNotes.forEach((noteId) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) {
        lanes[note.lane].push(note);
      }
    });
    return lanes;
  }, [activeNotes, notes]);

  return (
    <ScreenContainer className="bg-black">
      <View className="flex-1">
        {/* フィーバーモードの背景エフェクト */}
        {feverMode && (
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(255, 215, 0, 0.15)',
              borderWidth: 4,
              borderColor: '#FFD700',
            }}
          />
        )}
        
        {/* 背景動画または背景画像 */}
        {selectedSong?.backgroundVideo ? (
          <Video
            source={selectedSong.backgroundVideo}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: feverMode ? 0.5 : 0.3 }}
            resizeMode={ResizeMode.COVER}
            shouldPlay={gameStarted}
            isLooping
            isMuted
          />
        ) : selectedSong?.backgroundImage && (
          <Image
            source={{ uri: typeof selectedSong.backgroundImage === 'string' ? selectedSong.backgroundImage : undefined }}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: feverMode ? 0.5 : 0.3 }}
            resizeMode="cover"
          />
        )}
        {/* カウントダウン */}
        {!gameStarted && countdown > 0 && (
          <View className="absolute inset-0 items-center justify-center z-50 bg-black/80">
            <Text className="text-white text-9xl font-bold">{countdown}</Text>
          </View>
        )}

        {/* プログレスバー */}
        {gameStarted && songDuration && (
          <View className="absolute top-4 left-0 right-0 px-6 z-10">
            <View className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{
                  width: `${Math.max(0, Math.min((gameTime / songDuration) * 100, 100))}%`,
                }}
              />
            </View>
            {/* 経過時間/曲の長さ */}
            <Text className="text-white text-xs text-center mt-1">
              {Math.floor(gameTime / 1000)}:{String(Math.floor((gameTime % 1000) / 10)).padStart(2, '0')} / {Math.floor(songDuration / 1000)}:{String(Math.floor((songDuration % 1000) / 10)).padStart(2, '0')}
            </Text>
          </View>
        )}

        {/* スコア表示 */}
        <View className="absolute top-12 left-6 z-10">
          <Text className="text-white text-2xl font-bold">{score}</Text>
          <Text className="text-gray-400 text-sm">Score</Text>
        </View>
        
        {/* フィーバーゲージ */}
        <View className="absolute top-12 right-6 z-10">
          <Text className="text-white text-sm font-bold mb-1">FEVER</Text>
          <View
            className="w-24 h-3 bg-gray-800 rounded-full overflow-hidden"
            style={{
              borderWidth: 1,
              borderColor: feverMode ? '#FFD700' : '#666',
            }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${feverGauge}%`,
                backgroundColor: feverMode ? '#FFD700' : '#FFA500',
              }}
            />
          </View>
          {feverMode && (
            <Text className="text-yellow-400 text-xs font-bold mt-1 text-center">
              ACTIVE!
            </Text>
          )}
        </View>

        {/* コンボ表示（強化版） */}
        {combo > 0 && (
          <View className="absolute top-32 left-0 right-0 items-center z-10">
            <Text className="text-primary text-7xl font-bold" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }}>
              {combo}
            </Text>
            <Text className="text-white text-2xl font-semibold mt-1" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 }}>
              COMBO
            </Text>
          </View>
        )}

        {/* 判定表示 */}
        {judgementDisplay && (
          <View className="absolute top-1/3 left-0 right-0 items-center z-20">
            <Text
              className={`text-5xl font-bold ${
                judgementDisplay.type === "perfect"
                  ? "text-yellow-400"
                  : judgementDisplay.type === "good"
                  ? "text-green-400"
                  : judgementDisplay.type === "normal"
                  ? "text-blue-400"
                  : "text-red-400"
              }`}
            >
              {judgementDisplay.type.toUpperCase()}
            </Text>
            {/* Fast/Late表示 */}
            {judgementDisplay.timing && judgementDisplay.timing !== "perfect" && (
              <Text
                className={`text-2xl font-semibold mt-1 ${
                  judgementDisplay.timing === "fast" ? "text-cyan-400" : "text-orange-400"
                }`}
              >
                {judgementDisplay.timing === "fast" ? "FAST" : "LATE"}
              </Text>
            )}
          </View>
        )}

        {/* ノーツレーン */}
        <View className="flex-1 flex-row">
          {/* Perfect爆発エフェクト */}
          {Object.entries(perfectEffects).map(([effectId, effect]) => (
            <View
              key={effectId}
              className="absolute items-center justify-center"
              style={{
                left: effect.lane * LANE_WIDTH + (LANE_WIDTH - 200) / 2,
                top: effect.position - 100,
                width: 200,
                height: 200,
                pointerEvents: 'none',
              }}
            >
              <Image
                source={require('@/assets/images/particle_effect.png')}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
            </View>
          ))}
          {[0, 1, 2, 3].map((lane) => (
            <Pressable
              key={lane}
              onPressIn={() => handleTap(lane)}
              onPressOut={() => handleRelease(lane)}
              className="flex-1 border-r border-gray-800"
              style={[
                { width: LANE_WIDTH },
                tapEffects[lane] && { backgroundColor: 'rgba(10, 126, 164, 0.3)' }
              ]}
              pointerEvents="box-only"
            >
              {/* タップエフェクト */}
              {tapEffects[lane] && (
                <>
                  <View className="absolute inset-0 bg-primary/40" />
                  <View
                    className="absolute"
                    style={{
                      bottom: 0,
                      left: (LANE_WIDTH - 80) / 2,
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#0a7ea4',
                      opacity: 0.6,
                    }}
                  />
                </>
              )}

              {/* ノーツ */}
              {notesByLane[lane].map((note) => (
                <Note key={note.id} note={note} gameTime={gameTime} noteFallDuration={NOTE_FALL_DURATION} />
              ))}
            </Pressable>
          ))}
        </View>

        {/* タップエリア */}
        <View
          className="absolute bottom-0 left-0 right-0 flex-row"
          style={{ height: TAP_AREA_HEIGHT }}
          pointerEvents="none"
        >
          {[0, 1, 2, 3].map((lane) => (
            <View
              key={lane}
              className="flex-1 border-r items-center justify-center"
              style={{
                backgroundColor: 'rgba(10, 126, 164, 0.3)',
                borderRightColor: '#0a7ea4',
                borderRightWidth: 1,
              }}
            >
              {/* 光る判定ライン */}
              <View
                className="absolute top-0 left-0 right-0"
                style={{
                  height: 3,
                  backgroundColor: '#0a7ea4',
                  shadowColor: '#0a7ea4',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                }}
              />
              {/* 判定サークル */}
              <View
                className="w-16 h-16 rounded-full border-4"
                style={{
                  borderColor: '#0a7ea4',
                  shadowColor: '#0a7ea4',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.6,
                  shadowRadius: 15,
                }}
              />
            </View>
          ))}
        </View>

        {/* オールパーフェクト演出 */}
        {showAllPerfect && (
          <View className="absolute inset-0 items-center justify-center z-50 bg-black/60">
            <View className="items-center gap-4">
              <Text className="text-6xl">✨</Text>
              <Text className="text-yellow-400 text-6xl font-bold" style={{ textShadowColor: '#FFA500', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 }}>
                ALL PERFECT!
              </Text>
              <Text className="text-6xl">✨</Text>
            </View>
          </View>
        )}

        {/* フルコンボ演出 */}
        {showFullCombo && (
          <View className="absolute inset-0 items-center justify-center z-50 bg-black/60">
            <View className="items-center gap-4">
              <Text className="text-6xl">🎉</Text>
              <Text className="text-green-400 text-6xl font-bold" style={{ textShadowColor: '#00FF00', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 }}>
                FULL COMBO!
              </Text>
              <Text className="text-6xl">🎉</Text>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
