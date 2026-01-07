import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { ScreenContainer } from "@/components/screen-container";
import { useGame } from "@/lib/game-context";
import { songs } from "@/lib/song-data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_SPACING = 20;

export default function SongSelectScreen() {
  const router = useRouter();
  const { setSelectedSong } = useGame();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelectSong = (index: number) => {
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    setSelectedSong(songs[selectedIndex]);
    router.push("/difficulty");
  };



  return (
    <ScreenContainer className="bg-black p-6">
      <View className="flex-1">
        {/* ヘッダー */}
        <View className="mb-8">
          <Text className="text-white text-3xl font-bold text-center mb-2">
            SELECT SONG
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            曲を選択してください
          </Text>
        </View>

        {/* 曲カードスクロール */}
        <ScrollView
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
            gap: CARD_SPACING,
          }}
          className="flex-grow-0 mb-8"
        >
          {songs.map((song, index) => {
            const isSelected = selectedIndex === index;
            return (
              <TouchableOpacity
                key={song.id}
                onPress={() => handleSelectSong(index)}
                activeOpacity={0.9}
                style={{ width: CARD_WIDTH }}
              >
                <View
                  className={`rounded-2xl overflow-hidden ${
                    isSelected ? "border-4 border-primary" : "border-2 border-gray-700"
                  }`}
                >
                  {/* カバー画像 */}
                  <View className="bg-gray-800">
                    <Image
                      source={song.coverImage}
                      style={{ width: "100%", aspectRatio: 1 }}
                      contentFit="cover"
                      contentPosition="center"
                    />
                  </View>

                  {/* 曲情報 */}
                  <View className="bg-gray-900 p-4">
                    <Text
                      className={`font-bold text-lg mb-1 ${
                        isSelected ? "text-primary" : "text-white"
                      }`}
                      numberOfLines={2}
                    >
                      {song.title}
                    </Text>
                    <View className="flex-row gap-3">
                      <Text className="text-gray-400 text-sm">BPM: {song.bpm}</Text>
                      <Text className="text-gray-400 text-sm">•</Text>
                      <Text className="text-gray-400 text-sm">{song.durationDisplay}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 選択中の曲情報 */}
        <View className="bg-gray-900 rounded-2xl p-6 mb-8 border-2 border-primary">
          <Text className="text-gray-400 text-sm mb-2">選択中の曲</Text>
          <Text className="text-white text-2xl font-bold mb-1">
            {songs[selectedIndex].title}
          </Text>
          <View className="flex-row gap-4">
            <Text className="text-primary text-lg">BPM: {songs[selectedIndex].bpm}</Text>
            <Text className="text-gray-400 text-lg">•</Text>
            <Text className="text-primary text-lg">{songs[selectedIndex].durationDisplay}</Text>
          </View>
        </View>

        {/* ボタン */}
        <View className="gap-4">
          {/* ランキングボタン */}
          <TouchableOpacity
            onPress={() => router.push(`/song-ranking?songId=${songs[selectedIndex].id}` as any)}
            className="bg-gray-800 px-8 py-3 rounded-full active:opacity-80 border-2 border-primary"
          >
            <Text className="text-primary font-bold text-lg text-center">
              🏆 ランキングを見る
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            className="bg-primary px-8 py-4 rounded-full active:opacity-80"
          >
            <Text className="text-white font-bold text-xl text-center">
              この曲で遊ぶ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-800 px-8 py-4 rounded-full active:opacity-80"
          >
            <Text className="text-white font-bold text-lg text-center">戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
