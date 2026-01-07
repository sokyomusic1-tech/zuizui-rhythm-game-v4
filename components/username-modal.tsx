import { View, Text, TextInput, TouchableOpacity, Modal } from "react-native";
import { useState } from "react";

interface UsernameModalProps {
  visible: boolean;
  onSubmit: (username: string) => void;
}

export function UsernameModal({ visible, onSubmit }: UsernameModalProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = username.trim();
    
    if (trimmed.length === 0) {
      setError("ユーザー名を入力してください");
      return;
    }
    
    if (trimmed.length > 50) {
      setError("ユーザー名は50文字以内で入力してください");
      return;
    }

    onSubmit(trimmed);
    setUsername("");
    setError("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center bg-black/80">
        <View className="bg-gray-900 rounded-2xl p-8 w-11/12 max-w-md border-2 border-primary">
          <Text className="text-white text-2xl font-bold mb-2 text-center">
            ユーザー名を入力
          </Text>
          <Text className="text-gray-400 text-sm mb-6 text-center">
            ランキングに表示される名前です
          </Text>

          <TextInput
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setError("");
            }}
            placeholder="ユーザー名"
            placeholderTextColor="#6B7280"
            maxLength={50}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            className="bg-gray-800 text-white px-4 py-3 rounded-lg mb-2 text-lg"
          />

          {error ? (
            <Text className="text-red-400 text-sm mb-4">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            className="bg-primary px-6 py-4 rounded-full active:opacity-80"
          >
            <Text className="text-white font-bold text-lg text-center">決定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
