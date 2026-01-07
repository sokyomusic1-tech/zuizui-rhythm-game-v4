import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useGame, type Difficulty } from "@/lib/game-context";
import { NOTES_COUNT } from "@/lib/notes-data";

export default function DifficultyScreen() {
  const router = useRouter();
  const { highScores, loadHighScores, setCurrentDifficulty, selectedSong } = useGame();

  useEffect(() => {
    loadHighScores();
  }, []);

  const handleSelectDifficulty = (difficulty: Difficulty) => {
    setCurrentDifficulty(difficulty);
    router.push("/game");
  };

  const difficulties: Array<{
    id: Difficulty;
    name: string;
    description: string;
    color: string;
  }> = [
    {
      id: "easy",
      name: "EASY",
      description: "初心者向け - ゆっくりとしたペース",
      color: "bg-green-600",
    },
    {
      id: "normal",
      name: "NORMAL",
      description: "標準的な難易度",
      color: "bg-blue-600",
    },
    {
      id: "hard",
      name: "HARD",
      description: "上級者向け - 高速ノーツ",
      color: "bg-red-600",
    },
  ];

  return (
    <ScreenContainer className="bg-black p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center gap-6">
          {/* タイトル */}
          <View className="items-center mb-4">
            <Text className="text-white text-3xl font-bold">難易度を選択</Text>
            {selectedSong && (
              <View className="flex-row items-center gap-2 mt-2">
                <Text className="text-gray-400 text-sm">{selectedSong.title}</Text>
                <Text className="text-gray-400 text-sm">•</Text>
                <Text className="text-primary text-sm font-bold">{selectedSong.durationDisplay}</Text>
              </View>
            )}
          </View>

          {/* 難易度カード */}
          {difficulties.map((diff) => (
            <TouchableOpacity
              key={diff.id}
              onPress={() => handleSelectDifficulty(diff.id)}
              className="bg-gray-900 border-2 border-primary rounded-2xl p-6 active:opacity-80"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className={`${diff.color} px-4 py-2 rounded-full`}>
                  <Text className="text-white font-bold text-lg">{diff.name}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-300 text-sm">High Score</Text>
                  <Text className="text-white text-2xl font-bold">{highScores[diff.id]}</Text>
                </View>
              </View>

              <Text className="text-gray-300 text-base mb-2">{diff.description}</Text>

              <View className="flex-row items-center gap-2">
                <Text className="text-gray-400 text-sm">ノーツ数:</Text>
                <Text className="text-white text-sm font-semibold">{NOTES_COUNT[diff.id]}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* 戻るボタン */}
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="bg-gray-800 py-4 rounded-full active:opacity-80 mt-4"
          >
            <Text className="text-white text-center font-bold text-lg">戻る</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
