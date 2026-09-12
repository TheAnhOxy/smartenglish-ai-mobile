import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput } from 'react-native';
import { Check, Plus, Coffee, Briefcase, Plane, Sparkles, Folder, Bookmark, X } from 'lucide-react-native';
import { useDeckStore } from '@/src/features/flashcard-srs/data/deckStore';

interface SaveWordSheetModalProps {
  visible: boolean;
  itemsToSave: Array<{
    word_id: string;
    word: string;
    phonetic: string;
    pos: string;
    meaning_vi: string;
    examples?: any;
  }>;
  onClose: () => void;
  onSaved?: (deckName: string) => void;
}

export const SaveWordSheetModal: React.FC<SaveWordSheetModalProps> = ({
  visible,
  itemsToSave,
  onClose,
  onSaved,
}) => {
  const { decks, saveWordsToDeck, addDeck } = useDeckStore();
  const [selectedDeckId, setSelectedDeckId] = useState<string>(decks[0]?.id || 'deck-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreatingDeck, setIsCreatingDeck] = useState<boolean>(false);
  const [newDeckNameInput, setNewDeckNameInput] = useState<string>('');

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'coffee': return Coffee;
      case 'briefcase': return Briefcase;
      case 'plane': return Plane;
      case 'sparkles': return Sparkles;
      default: return Folder;
    }
  };

  const handleSave = () => {
    if (!itemsToSave || itemsToSave.length === 0) {
      onClose();
      return;
    }

    const targetDeck = decks.find((d) => d.id === selectedDeckId) || decks[0];
    saveWordsToDeck(targetDeck.id, itemsToSave);

    const countText = itemsToSave.length === 1 
      ? `"${itemsToSave[0].word}"` 
      : `${itemsToSave.length} từ vựng`;

    setToastMessage(`Đã lưu ${countText} vào bộ thẻ "${targetDeck.name}" thành công! ✨`);

    if (onSaved) {
      onSaved(targetDeck.name);
    }

    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 1200);
  };

  const handleCreateNewDeckSubmit = () => {
    if (!newDeckNameInput.trim()) return;
    const created = addDeck(newDeckNameInput.trim());
    setSelectedDeckId(created.id);
    setNewDeckNameInput('');
    setIsCreatingDeck(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white p-6 rounded-t-3xl border-t border-gray-100 shadow-2xl">
          <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />

          {/* Top Sheet Header */}
          <View className="flex-row justify-between items-center mb-1">
            <Text className="text-xl font-bold text-neutralInk">
              {itemsToSave.length > 1 ? `Lưu ${itemsToSave.length} Từ Vựng Vào Bộ Thẻ` : 'Lưu Vào Bộ Thẻ'}
            </Text>
            <Pressable onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 justify-center items-center">
              <X color="#64748B" size={18} />
            </Pressable>
          </View>

          <Text className="text-xs text-neutralGray mb-5">
            Chọn bộ thẻ Flashcard của bản thân để lưu và ôn tập hàng ngày theo thuật toán SM-2.
          </Text>

          {/* Toast Notification */}
          {toastMessage && (
            <View className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl mb-4 flex-row items-center justify-center gap-2">
              <Sparkles color="#10B981" size={16} />
              <Text className="text-xs font-bold text-emerald-700 text-center">{toastMessage}</Text>
            </View>
          )}

          {/* Inline Create Deck Input Form */}
          {isCreatingDeck ? (
            <View className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200 mb-4">
              <Text className="text-xs font-bold text-[#FF6B35] mb-2">Tên bộ thẻ mới</Text>
              <View className="flex-row gap-2">
                <TextInput
                  value={newDeckNameInput}
                  onChangeText={setNewDeckNameInput}
                  placeholder="VD: Từ Vựng Tiếng Anh Giao Tiếp..."
                  className="flex-1 bg-white px-3 py-2 rounded-xl border border-gray-200 text-xs text-neutralInk"
                  autoFocus
                />
                <Pressable
                  onPress={handleCreateNewDeckSubmit}
                  className="bg-[#FF6B35] px-4 py-2 rounded-xl justify-center items-center"
                >
                  <Text className="text-xs font-bold text-white">Tạo</Text>
                </Pressable>
                <Pressable
                  onPress={() => setIsCreatingDeck(false)}
                  className="bg-gray-200 px-3 py-2 rounded-xl justify-center items-center"
                >
                  <Text className="text-xs font-bold text-gray-700">Hủy</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Deck List */}
          <View className="gap-3 mb-5 max-h-60">
            {decks.map((deck) => {
              const isSelected = selectedDeckId === deck.id;
              const IconComp = getIconComponent(deck.iconName);

              return (
                <Pressable
                  key={deck.id}
                  onPress={() => setSelectedDeckId(deck.id)}
                  className={`p-3.5 rounded-2xl border flex-row justify-between items-center ${
                    isSelected
                      ? 'bg-orange-50/60 border-[#FF6B35] shadow-sm'
                      : 'bg-white border-gray-100 active:bg-gray-50'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`w-10 h-10 rounded-2xl ${deck.color.split(' ')[0]} justify-center items-center`}>
                      <IconComp color={isSelected ? '#FF6B35' : '#475569'} size={18} />
                    </View>
                    <View>
                      <Text className="font-bold text-sm text-neutralInk">{deck.name}</Text>
                      <Text className="text-xs text-neutralGray mt-0.5">{deck.count} thẻ từ</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View className="w-6 h-6 rounded-full bg-[#FF6B35] justify-center items-center">
                      <Check color="#FFFFFF" size={14} strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Create New Deck Button (Dashed) */}
          {!isCreatingDeck && (
            <Pressable
              onPress={() => setIsCreatingDeck(true)}
              className="p-3 rounded-2xl border-2 border-dashed border-[#FF6B35]/40 flex-row justify-center items-center gap-2 mb-5 active:bg-orange-50/50"
            >
              <Plus color="#FF6B35" size={16} />
              <Text className="text-xs font-bold text-[#FF6B35]">Tạo Bộ Thẻ Mới</Text>
            </Pressable>
          )}

          {/* Bottom Solid Orange CTA Button */}
          <Pressable
            onPress={handleSave}
            className="bg-[#FF6B35] py-3.5 rounded-2xl flex-row justify-center items-center gap-2 shadow-lg active:bg-orange-600"
          >
            <Bookmark color="#FFFFFF" size={18} fill="#FFFFFF" />
            <Text className="text-white font-bold text-sm">
              {itemsToSave.length > 1 ? `Lưu Tất Cả (${itemsToSave.length} Từ)` : 'Lưu Vào Bộ Thẻ'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
