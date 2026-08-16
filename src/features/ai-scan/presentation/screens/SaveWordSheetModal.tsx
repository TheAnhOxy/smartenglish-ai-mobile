import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Check, Plus, Coffee, Briefcase, Plane, Bookmark } from 'lucide-react-native';

interface SaveWordSheetModalProps {
  visible: boolean;
  wordId: string;
  onClose: () => void;
}

export const SaveWordSheetModal: React.FC<SaveWordSheetModalProps> = ({ visible, wordId, onClose }) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>('deck-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const decks = [
    { id: 'deck-1', name: 'Daily Conversation', count: 124, icon: Coffee, color: 'bg-orange-100 text-orange-600' },
    { id: 'deck-2', name: 'Business English', count: 85, icon: Briefcase, color: 'bg-cyan-100 text-cyan-600' },
    { id: 'deck-3', name: 'Travel & Leisure', count: 42, icon: Plane, color: 'bg-amber-100 text-amber-600' }
  ];

  const handleSave = () => {
    setToastMessage('Đã lưu từ vựng vào bộ thẻ Flashcard thành công! ⚡');
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white p-6 rounded-t-3xl border-t border-gray-100 shadow-2xl">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-5" />

          {/* Header */}
          <Text className="text-xl font-bold text-neutralInk mb-1">Save to Deck</Text>
          <Text className="text-xs text-neutralGray mb-6">
            Choose a flashcard deck to save your new words.
          </Text>

          {/* Toast Notification */}
          {toastMessage && (
            <View className="bg-orange-50 border border-orange-200 p-3 rounded-xl mb-4">
              <Text className="text-xs font-bold text-[#FF6B35] text-center">{toastMessage}</Text>
            </View>
          )}

          {/* Deck List */}
          <View className="gap-3.5 mb-5">
            {decks.map((deck) => {
              const isSelected = selectedDeckId === deck.id;
              const IconComp = deck.icon;

              return (
                <Pressable
                  key={deck.id}
                  onPress={() => setSelectedDeckId(deck.id)}
                  className={`p-4 rounded-2xl border flex-row justify-between items-center ${
                    isSelected
                      ? 'bg-orange-50/50 border-[#FF6B35] shadow-sm'
                      : 'bg-white border-gray-100 active:bg-gray-50'
                  }`}
                >
                  <View className="flex-row items-center gap-3.5">
                    <View className={`w-11 h-11 rounded-2xl ${deck.color.split(' ')[0]} justify-center items-center`}>
                      <IconComp color={isSelected ? '#FF6B35' : '#475569'} size={20} />
                    </View>
                    <View>
                      <Text className="font-bold text-sm text-neutralInk">{deck.name}</Text>
                      <Text className="text-xs text-neutralGray mt-0.5">{deck.count} Cards</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View className="w-6 h-6 rounded-full bg-cyan-600 justify-center items-center">
                      <Check color="#FFFFFF" size={14} strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Create New Deck Button (Dashed) */}
          <Pressable
            onPress={() => alert('Nhập tên bộ thẻ mới...')}
            className="p-3.5 rounded-2xl border-2 border-dashed border-cyan-600/40 flex-row justify-center items-center gap-2 mb-6 active:bg-cyan-50"
          >
            <Plus color="#0891B2" size={18} />
            <Text className="text-xs font-bold text-[#0891B2]">Create New Deck</Text>
          </Pressable>

          {/* Bottom Solid Orange CTA Button */}
          <Pressable
            onPress={handleSave}
            className="bg-[#C23B00] py-4 rounded-2xl flex-row justify-center items-center gap-2 shadow-lg active:bg-[#A33200]"
          >
            <Bookmark color="#FFFFFF" size={18} fill="#FFFFFF" />
            <Text className="text-white font-bold text-base">Save to Deck</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
