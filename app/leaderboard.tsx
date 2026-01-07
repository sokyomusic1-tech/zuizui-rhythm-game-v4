import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import type { Difficulty } from "@/lib/game-context";
import { GoogleAdSense } from "@/components/google-adsense";

type DifficultyTab = Difficulty | "all";

export default function LeaderboardScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<DifficultyTab>("all");

  // 全難易度のランキングを取得
  const { data: allData, isLoading: isLoadingAll, error: errorAll, refetch: refetchAll } = trpc.leaderboard.getAll.useQuery(
    { limit: 100 },
    { enabled: selectedTab === "all", retry: 3, retryDelay: 1000 }
  );

  // 難易度別ランキングを取得
  const { data: easyData, isLoading: isLoadingEasy, error: errorEasy, refetch: refetchEasy } = trpc.leaderboard.getByDifficulty.useQuery(
    { difficulty: "easy", limit: 100 },
    { enabled: selectedTab === "easy", retry: 3, retryDelay: 1000 }
  );

  const { data: normalData, isLoading: isLoadingNormal, error: errorNormal, refetch: refetchNormal } = trpc.leaderboard.getByDifficulty.useQuery(
    { difficulty: "normal", limit: 100 },
    { enabled: selectedTab === "normal", retry: 3, retryDelay: 1000 }
  );

  const { data: hardData, isLoading: isLoadingHard, error: errorHard, refetch: refetchHard } = trpc.leaderboard.getByDifficulty.useQuery(
    { difficulty: "hard", limit: 100 },
    { enabled: selectedTab === "hard", retry: 3, retryDelay: 1000 }
  );

  const isLoading = isLoadingAll || isLoadingEasy || isLoadingNormal || isLoadingHard;
  const error = errorAll || errorEasy || errorNormal || errorHard;
  
  const handleRefetch = () => {
    if (selectedTab === "all") refetchAll();
    else if (selectedTab === "easy") refetchEasy();
    else if (selectedTab === "normal") refetchNormal();
    else if (selectedTab === "hard") refetchHard();
  };

  // 表示するデータを選択
  const displayData =
    selectedTab === "all"
      ? [
          ...(allData?.easy || []).slice(0, 10).map((s) => ({ ...s, displayDifficulty: "EASY" })),
          ...(allData?.normal || []).slice(0, 10).map((s) => ({ ...s, displayDifficulty: "NORMAL" })),
          ...(allData?.hard || []).slice(0, 10).map((s) => ({ ...s, displayDifficulty: "HARD" })),
        ].sort((a, b) => b.score - a.score).slice(0, 100)
      : selectedTab === "easy"
      ? easyData || []
      : selectedTab === "normal"
      ? normalData || []
      : hardData || [];

  const tabs: { id: DifficultyTab; label: string; color: string }[] = [
    { id: "all", label: "ALL", color: "text-white" },
    { id: "easy", label: "EASY", color: "text-green-400" },
    { id: "normal", label: "NORMAL", color: "text-blue-400" },
    { id: "hard", label: "HARD", color: "text-red-400" },
  ];

  return (
    <ScreenContainer className="bg-black p-6">
      <View className="flex-1">
        {/* ヘッダー */}
        <View className="mb-6">
          <Text className="text-white text-3xl font-bold text-center mb-2">
            全国ランキング
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            トップ100プレイヤー
          </Text>
        </View>

        {/* タブ */}
        <View className="flex-row justify-around mb-6">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-full ${
                selectedTab === tab.id ? "bg-primary" : "bg-gray-800"
              }`}
            >
              <Text
                className={`font-bold ${
                  selectedTab === tab.id ? "text-white" : tab.color
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ランキングリスト */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#DC143C" />
            <Text className="text-gray-400 text-sm mt-4">読み込み中...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center gap-4">
            <Text className="text-red-400 text-lg">データの読み込みに失敗しました</Text>
            <Text className="text-gray-400 text-sm text-center px-4">
              サーバーが起動中の可能性があります
            </Text>
            <TouchableOpacity
              onPress={handleRefetch}
              className="bg-primary px-8 py-3 rounded-full active:opacity-80"
            >
              <Text className="text-white font-bold">再読み込み</Text>
            </TouchableOpacity>
          </View>
        ) : displayData.length === 0 ? (
          <View className="flex-1 justify-center items-center gap-4">
            <Text className="text-gray-400 text-lg">まだスコアがありません</Text>
            <TouchableOpacity
              onPress={handleRefetch}
              className="bg-gray-800 px-6 py-2 rounded-full active:opacity-80"
            >
              <Text className="text-white font-bold">更新</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={displayData}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item, index }) => {
              const rank = index + 1;
              const rankColor =
                rank === 1
                  ? "text-yellow-400"
                  : rank === 2
                  ? "text-gray-300"
                  : rank === 3
                  ? "text-orange-400"
                  : "text-gray-400";

              return (
                <View className="bg-gray-900 rounded-lg p-4 mb-3 border border-gray-800">
                  <View className="flex-row items-center justify-between">
                    {/* 順位 */}
                    <View className="w-12">
                      <Text className={`text-2xl font-bold ${rankColor}`}>
                        {rank}
                      </Text>
                    </View>

                    {/* ユーザー名とスコア */}
                    <View className="flex-1 mx-4">
                      <Text className="text-white text-lg font-bold" numberOfLines={1}>
                        {item.username}
                      </Text>
                      {"displayDifficulty" in item && item.displayDifficulty ? (
                        <Text className="text-gray-400 text-xs">
                          {String(item.displayDifficulty)}
                        </Text>
                      ) : null}
                    </View>

                    {/* スコア */}
                    <View className="items-end">
                      <Text className="text-primary text-xl font-bold">
                        {item.score.toLocaleString()}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {item.maxCombo} combo
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Google AdSense 広告 */}
        <View className="mt-4 mb-4">
          <GoogleAdSense client="ca-pub-2991936078376292" slot="5726193644" />
        </View>

        {/* 戻るボタン */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-gray-800 px-8 py-4 rounded-full active:opacity-80"
        >
          <Text className="text-white font-bold text-lg text-center">戻る</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
