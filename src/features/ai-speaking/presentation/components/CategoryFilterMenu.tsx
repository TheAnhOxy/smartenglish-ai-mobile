import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { AppColors } from '@/src/core/theme/colors';

interface CategoryFilterMenuProps {
  visible: boolean;
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
  onClose: () => void;
  /** Khoảng cách từ đỉnh màn hình tới mép dưới thanh tìm kiếm */
  top: number;
}

/** Menu chọn chủ đề mở từ nút bộ lọc trên thanh tìm kiếm. */
export const CategoryFilterMenu: React.FC<CategoryFilterMenuProps> = ({ visible, categories, selected, onSelect, onClose, top }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable className="flex-1" onPress={onClose}>
      <View
        className="absolute right-4 w-48 bg-white dark:bg-darkCard rounded-2xl border border-gray-100 dark:border-gray-800 py-1"
        style={{ top, shadowColor: '#0F172A', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
      >
        {categories.map((cat) => {
          const active = cat === selected;
          return (
            <Pressable
              key={cat}
              onPress={() => {
                onSelect(cat);
                onClose();
              }}
              className={`flex-row items-center justify-between px-4 py-2.5 ${active ? 'bg-primary/10' : ''}`}
            >
              <Text className={`text-sm ${active ? 'font-bold text-primary' : 'text-neutralInk dark:text-white'}`}>{cat}</Text>
              {active ? <Check size={16} color={AppColors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Pressable>
  </Modal>
);
