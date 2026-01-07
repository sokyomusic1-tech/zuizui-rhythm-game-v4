import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { GoogleAdSense } from "@/components/google-adsense";
import { UsernameModal } from "@/components/username-modal";
import { useEffect, useState } from "react";

/**
 * Home Screen - NativeWind Example
 *
 * This template uses NativeWind (Tailwind CSS for React Native).
 * You can use familiar Tailwind classes directly in className props.
 *
 * Key patterns:
 * - Use `className` instead of `style` for most styling
 * - Theme colors: use tokens directly (bg-background, text-foreground, bg-primary, etc.); no dark: prefix needed
 * - Responsive: standard Tailwind breakpoints work on web
 * - Custom colors defined in tailwind.config.js
 */
export default function HomeScreen() {
  const router = useRouter();
  const { highScores, loadHighScores, username, setUsername, loadUsername, pendingScores, loadPendingScores, removePendingScore, loadNoteSpeed } = useGame();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [isSyncingScores, setIsSyncingScores] = useState(false);

  useEffect(() => {
    loadHighScores();
    loadUsername();
    loadPendingScores();
    loadNoteSpeed();
  }, []);

  useEffect(() => {
    // ユーザー名が未設定の場合、モーダルを表示
    if (username === null) {
      const timer = setTimeout(() => {
        setShowUsernameModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [username]);

  const handleUsernameSubmit = async (name: string) => {
    await setUsername(name);
    setShowUsernameModal(false);
  };

  // Auto-submit pending scores when online
  useEffect(() => {
    const submitPendingScores = async () => {
      if (pendingScores.length === 0 || isSyncingScores) return;
      
      setIsSyncingScores(true);
      
      for (const pendingScore of pendingScores) {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || ''}/api/trpc/leaderboard.submitScore`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: pendingScore.username,
              score: pendingScore.score,
              difficulty: pendingScore.difficulty,
              perfect: pendingScore.perfect,
              good: pendingScore.good,
              miss: pendingScore.miss,
              maxCombo: pendingScore.maxCombo,
            }),
          });
          
          if (response.ok) {
            // Remove successfully submitted score
            await removePendingScore(pendingScore.timestamp);
            console.log('Successfully submitted pending score:', pendingScore.timestamp);
          }
        } catch (error) {
          console.error('Failed to submit pending score:', error);
          // Stop trying if network is still down
          break;
        }
      }
      
      setIsSyncingScores(false);
    };
    
    submitPendingScores();
  }, [pendingScores, isSyncingScores]);

  return (
    <ScreenContainer className="bg-black p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center gap-8">
          {/* ロゴとタイトル */}
          <View className="items-center gap-4">
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 150, height: 150, borderRadius: 75 }}
              contentFit="cover"
            />
            <Text className="text-5xl font-bold text-white">ZUIZUI</Text>
            <Text className="text-xl text-white">RHYTHM GAME</Text>
            <View className="w-20 h-1 bg-primary rounded-full" />
          </View>

          {/* ハイスコア */}
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm self-center border-2 border-primary">
            <Text className="text-primary text-lg font-bold mb-4 text-center">ハイスコア</Text>
            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-green-400 font-semibold">EASY</Text>
                <Text className="text-white text-xl font-bold">{highScores.easy}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-blue-400 font-semibold">NORMAL</Text>
                <Text className="text-white text-xl font-bold">{highScores.normal}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-red-400 font-semibold">HARD</Text>
                <Text className="text-white text-xl font-bold">{highScores.hard}</Text>
              </View>
            </View>
          </View>

          {/* ボタン */}
          <View className="items-center gap-4">
            <TouchableOpacity
              onPress={() => router.push("/song-select")}
              className="bg-primary px-12 py-5 rounded-full active:opacity-80"
            >
              <Text className="text-white font-bold text-2xl">PLAY</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push("/leaderboard")}
              className="bg-gray-800 px-10 py-4 rounded-full active:opacity-80 border-2 border-primary"
            >
              <Text className="text-primary font-bold text-xl">ランキング</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="bg-gray-800 px-10 py-4 rounded-full active:opacity-80 border-2 border-gray-600"
            >
              <Text className="text-gray-400 font-bold text-xl">設定</Text>
            </TouchableOpacity>
          </View>

          {/* ユーザー名表示 */}
          {username && (
            <View className="items-center">
              <Text className="text-gray-400 text-sm">プレイヤー名</Text>
              <Text className="text-white text-xl font-bold">{username}</Text>
              <TouchableOpacity
                onPress={() => setShowUsernameModal(true)}
                className="mt-2"
              >
                <Text className="text-primary text-sm">変更</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ペンディングスコア表示 */}
          {pendingScores.length > 0 && (
            <View className="items-center">
              <View className="bg-yellow-900 border-2 border-yellow-600 rounded-lg px-4 py-3">
                <Text className="text-yellow-400 text-sm text-center">
                  {isSyncingScores ? '送信中...' : `未送信スコア: ${pendingScores.length}件`}
                </Text>
                {!isSyncingScores && (
                  <Text className="text-yellow-300 text-xs text-center mt-1">
                    オンライン時に自動送信します
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Google AdSense 広告 */}
          <View className="mt-8 w-full max-w-sm self-center">
            <GoogleAdSense client="ca-pub-2991936078376292" slot="5726193644" />
          </View>
        </View>
      </ScrollView>

      {/* ユーザー名入力モーダル */}
      <UsernameModal
        visible={showUsernameModal}
        onSubmit={handleUsernameSubmit}
      />
    </ScreenContainer>
  );
}
