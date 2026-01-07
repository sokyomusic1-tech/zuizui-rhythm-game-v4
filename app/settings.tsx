import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";

export default function SettingsScreen() {
  const router = useRouter();
  const { noteSpeed, setNoteSpeed } = useGame();
  const [localSpeed, setLocalSpeed] = useState(noteSpeed);

  useEffect(() => {
    setLocalSpeed(noteSpeed);
  }, [noteSpeed]);

  const handleSpeedChange = async (newSpeed: number) => {
    setLocalSpeed(newSpeed);
    await setNoteSpeed(newSpeed);
  };

  const speedOptions = [
    { value: 0.5, label: "0.5x (遅い)" },
    { value: 0.75, label: "0.75x" },
    { value: 1.0, label: "1.0x (標準)" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.5x" },
    { value: 1.75, label: "1.75x" },
    { value: 2.0, label: "2.0x (速い)" },
  ];

  return (
    <ScreenContainer className="bg-black">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 p-6 gap-6">
          {/* ヘッダー */}
          <View className="items-center gap-2 mt-8">
            <Text className="text-4xl font-bold text-white">設定</Text>
            <View className="w-16 h-1 bg-primary rounded-full" />
          </View>

          {/* ノーツスピード設定 */}
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm self-center border-2 border-primary">
            <Text className="text-primary text-xl font-bold mb-2 text-center">ノーツスピード</Text>
            <Text className="text-gray-400 text-sm mb-6 text-center">
              ノーツの落下速度を調整できます
            </Text>

            {/* 現在のスピード表示 */}
            <View className="bg-gray-800 rounded-lg p-4 mb-6">
              <Text className="text-white text-center text-lg font-bold">
                {localSpeed.toFixed(2)}x
              </Text>
            </View>

            {/* スピード選択ボタン */}
            <View className="gap-3">
              {speedOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSpeedChange(option.value)}
                  className={`rounded-lg p-4 border-2 ${
                    Math.abs(localSpeed - option.value) < 0.01
                      ? "bg-primary border-primary"
                      : "bg-gray-800 border-gray-700"
                  }`}
                >
                  <Text
                    className={`text-center font-bold ${
                      Math.abs(localSpeed - option.value) < 0.01
                        ? "text-white"
                        : "text-gray-400"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 説明 */}
          <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm self-center">
            <Text className="text-white text-sm leading-relaxed">
              <Text className="font-bold">Fast/Late表示について{"\n"}</Text>
              <Text className="text-gray-400">
                判定時にタイミングが早いか遅いかを表示します。{"\n"}
                • FAST (水色): タップが早すぎた{"\n"}
                • LATE (オレンジ): タップが遅すぎた
              </Text>
            </Text>
          </View>

          {/* 戻るボタン */}
          <View className="items-center mt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-gray-800 px-12 py-4 rounded-full active:opacity-80 border-2 border-gray-600"
            >
              <Text className="text-white font-bold text-xl">戻る</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
