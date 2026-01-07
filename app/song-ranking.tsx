import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useGame } from "@/lib/game-context";
import { songs as allSongs } from "@/lib/song-data";

export default function SongRankingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const songId = params.songId as string;

  
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  
  const song = allSongs.find((s) => s.id === songId);
  
  // 曲ごとのランキングを取得
  const { data: rankings, isLoading } = trpc.leaderboard.getBySong.useQuery({
    songId,
    difficulty: selectedDifficulty,
    limit: 100,
  });
  
  // 過去最高と今月最高を取得
  const { data: topScores } = trpc.leaderboard.getTopScoresBySong.useQuery({
    songId,
    difficulty: selectedDifficulty,
  });

  if (!song) {
    return (
      <ScreenContainer className="bg-black">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-xl">曲が見つかりません</Text>
          <TouchableOpacity
            className="mt-4 bg-primary px-6 py-3 rounded-full"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold">戻る</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-black">
      <ScrollView className="flex-1">
        {/* ヘッダー */}
        <View className="p-6 border-b border-gray-800">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-lg">← 戻る</Text>
          </TouchableOpacity>
          <Text className="text-white text-3xl font-bold">{song.title}</Text>
        </View>

        {/* 難易度選択 */}
        <View className="flex-row p-4 gap-2">
          {(["easy", "normal", "hard"] as const).map((diff) => (
            <TouchableOpacity
              key={diff}
              className={`flex-1 py-3 rounded-lg ${
                selectedDifficulty === diff ? "bg-primary" : "bg-gray-800"
              }`}
              onPress={() => setSelectedDifficulty(diff)}
            >
              <Text
                className={`text-center font-bold ${
                  selectedDifficulty === diff ? "text-white" : "text-gray-400"
                }`}
              >
                {diff.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 過去最高と今月最高 */}
        {topScores && (
          <View className="px-6 py-4 bg-gray-900 mb-4">
            <Text className="text-white text-xl font-bold mb-4">トップスコア</Text>
            <View className="flex-row gap-4">
              {/* 過去最高 */}
              <View className="flex-1 bg-gray-800 p-4 rounded-lg">
                <Text className="text-gray-400 text-sm mb-2">過去最高</Text>
                {topScores.allTime ? (
                  <>
                    <Text className="text-primary text-2xl font-bold">
                      {topScores.allTime.score}
                    </Text>
                    <Text className="text-white text-lg mt-1">
                      {topScores.allTime.username}
                    </Text>
                  </>
                ) : (
                  <Text className="text-gray-500">記録なし</Text>
                )}
              </View>

              {/* 今月最高 */}
              <View className="flex-1 bg-gray-800 p-4 rounded-lg">
                <Text className="text-gray-400 text-sm mb-2">今月最高</Text>
                {topScores.thisMonth ? (
                  <>
                    <Text className="text-yellow-400 text-2xl font-bold">
                      {topScores.thisMonth.score}
                    </Text>
                    <Text className="text-white text-lg mt-1">
                      {topScores.thisMonth.username}
                    </Text>
                  </>
                ) : (
                  <Text className="text-gray-500">記録なし</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* ランキングリスト */}
        <View className="px-6 pb-6">
          <Text className="text-white text-xl font-bold mb-4">ランキング</Text>
          
          {isLoading ? (
            <View className="py-8">
              <ActivityIndicator size="large" color="#0a7ea4" />
            </View>
          ) : rankings && rankings.length > 0 ? (
            rankings.map((entry, index) => (
              <View
                key={entry.id}
                className="flex-row items-center bg-gray-900 p-4 rounded-lg mb-2"
              >
                {/* 順位 */}
                <View className="w-12">
                  <Text
                    className={`text-2xl font-bold ${
                      index === 0
                        ? "text-yellow-400"
                        : index === 1
                        ? "text-gray-300"
                        : index === 2
                        ? "text-orange-400"
                        : "text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </Text>
                </View>

                {/* プレイヤー名 */}
                <View className="flex-1">
                  <Text className="text-white text-lg font-semibold">
                    {entry.username}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    P: {entry.perfect} / G: {entry.good} / M: {entry.miss}
                  </Text>
                </View>

                {/* スコア */}
                <View className="items-end">
                  <Text className="text-primary text-xl font-bold">
                    {entry.score}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {entry.maxCombo} Combo
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="py-8">
              <Text className="text-gray-500 text-center">
                まだスコアが登録されていません
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
