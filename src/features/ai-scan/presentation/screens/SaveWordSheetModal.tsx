import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import {
  Folder,
  FolderPlus,
  Bookmark,
  X,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { useAuthStore } from '@/src/core/flows/authStore';
import { useDeckStore } from '@/src/features/flashcard-srs/data/deckStore';
import {
  fetchMyDecksApi,
  createDeckApi,
  saveWordToDeckApi,
  DeckItemDTO,
} from '@/src/features/flashcard-srs/data/deckApi';
import { font } from '@/src/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const { currentUser } = useAuthStore();
  const { decks: localDecks, addDeck: addLocalDeck, saveWordsToDeck: saveWordsToLocalDeck } = useDeckStore();

  const [myDecks, setMyDecks] = useState<Array<{ id: string | number; name: string; cardCount: number }>>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | number>('');
  const [isCreatingDeck, setIsCreatingDeck] = useState<boolean>(false);
  const [newDeckNameInput, setNewDeckNameInput] = useState<string>('');
  const [isLoadingDecks, setIsLoadingDecks] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Animations: Smooth timing, NO bouncing or jumping
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);

  const uid = currentUser?.id?.toString();

  // Load personal decks from backend learning-service
  const loadUserDecks = async () => {
    setIsLoadingDecks(true);
    try {
      const backendDecks: DeckItemDTO[] = await fetchMyDecksApi(uid);
      
      const combinedList: Array<{ id: string | number; name: string; cardCount: number }> = [];

      if (backendDecks && backendDecks.length > 0) {
        backendDecks.forEach((d) => {
          combinedList.push({
            id: d.id,
            name: d.name,
            cardCount: d.cardCount || 0,
          });
        });
      }

      // Merge any user-created local decks not yet in backend list
      localDecks.forEach((ld) => {
        if (!combinedList.some((d) => String(d.id) === String(ld.id) || d.name.toLowerCase() === ld.name.toLowerCase())) {
          combinedList.push({
            id: ld.id,
            name: ld.name,
            cardCount: ld.count || 0,
          });
        }
      });

      // Default fallback personal deck if completely empty
      if (combinedList.length === 0) {
        combinedList.push({
          id: 'deck-my-words',
          name: 'Bộ thẻ của tôi',
          cardCount: 0,
        });
      }

      setMyDecks(combinedList);
      if (!selectedDeckId && combinedList.length > 0) {
        setSelectedDeckId(combinedList[0].id);
      }
    } catch (e) {
      console.warn('Error loading my decks:', e);
    } finally {
      setIsLoadingDecks(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadUserDecks();
      // Clean, stable slide up without any jumping bounce
      backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) });
      sheetTranslateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      sheetTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 200, easing: Easing.in(Easing.quad) });
      setIsCreatingDeck(false);
      setNewDeckNameInput('');
      setSuccessNotice(null);
      setIsSaving(false);
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!visible && backdropOpacity.value === 0) {
    return null;
  }

  // Handle creating a new personal deck
  const handleCreateNewDeckSubmit = async () => {
    const trimmed = newDeckNameInput.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      // 1. Create in backend learning-service database (learning.decks)
      const createdOnBackend = await createDeckApi(trimmed, 'Bộ thẻ tự tạo', uid);
      const newDeckId = createdOnBackend ? createdOnBackend.id : `deck-${Date.now()}`;

      // 2. Add to local state
      const newDeckObj = {
        id: newDeckId,
        name: trimmed,
        cardCount: 0,
      };

      setMyDecks((prev) => [newDeckObj, ...prev]);
      setSelectedDeckId(newDeckId);
      addLocalDeck(trimmed);

      setNewDeckNameInput('');
      setIsCreatingDeck(false);
    } catch (err) {
      console.warn('Create deck error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle saving words into the selected personal deck
  const handleSave = async () => {
    if (!itemsToSave || itemsToSave.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);

    const targetDeck = myDecks.find((d) => String(d.id) === String(selectedDeckId)) || myDecks[0];
    const targetDeckName = targetDeck?.name || 'Bộ thẻ của tôi';
    const targetDeckIdNum = typeof targetDeck?.id === 'number' ? targetDeck.id : parseInt(String(targetDeck?.id).replace(/\D/g, '')) || undefined;

    try {
      // 1. Save all words to backend learning-service (learning.deck_cards)
      const savePromises = itemsToSave.map((item) => {
        const exampleSentence = item.examples?.easy || item.examples?.sentenceEn || `Example with ${item.word}`;
        const exampleTranslation = item.examples?.medium || item.examples?.sentenceVi || '';
        return saveWordToDeckApi({
          word: item.word,
          meaningVi: item.meaning_vi,
          ipa: item.phonetic,
          exampleEn: exampleSentence,
          userNote: exampleTranslation,
          targetDeckId: targetDeckIdNum,
          userId: uid,
        });
      });

      await Promise.all(savePromises);

      // 2. Synchronize to local Zustand store
      saveWordsToLocalDeck(String(targetDeck?.id || 'deck-my-words'), itemsToSave);

      // 3. Update local card count
      setMyDecks((prev) =>
        prev.map((d) =>
          String(d.id) === String(targetDeck?.id)
            ? { ...d, cardCount: d.cardCount + itemsToSave.length }
            : d
        )
      );

      const countText = itemsToSave.length > 1 ? `${itemsToSave.length} từ vựng` : `"${itemsToSave[0].word}"`;
      setSuccessNotice(`Đã lưu ${countText} vào "${targetDeckName}"! 🎉`);

      if (onSaved) {
        onSaved(targetDeckName);
      }

      setTimeout(() => {
        onClose();
      }, 750);
    } catch (err) {
      console.warn('Save word to deck error:', err);
      // Fallback local save anyway
      saveWordsToLocalDeck(String(targetDeck?.id || 'deck-my-words'), itemsToSave);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={s.overlayContainer} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Dark backdrop */}
      <Animated.View style={[s.backdrop, animatedBackdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Bottom Sheet View */}
      <Animated.View style={[s.sheetContainer, animatedSheetStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          {/* Top Handle */}
          <View style={s.handleBar} />

          {/* Header Row */}
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={s.badgeRow}>
                <Sparkles color="#FF6B35" size={15} />
                <Text style={s.badgeText}>Bộ thẻ cá nhân của bạn</Text>
              </View>
              <Text style={s.headerTitle}>Lưu từ vào bộ thẻ</Text>
            </View>

            <Pressable onPress={onClose} style={s.closeBtn}>
              <X color="#64748B" size={20} />
            </Pressable>
          </View>

          {/* Success notice */}
          {successNotice && (
            <Animated.View entering={FadeIn.duration(150)} style={s.successBanner}>
              <Check color="#059669" size={18} strokeWidth={2.5} />
              <Text style={s.successText}>{successNotice}</Text>
            </Animated.View>
          )}

          {/* Scanned Words Preview Chips */}
          <View style={s.previewSection}>
            <Text style={s.previewLabel}>
              Từ vựng chuẩn bị lưu ({itemsToSave.length} từ):
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsScrollContent}
            >
              {itemsToSave.map((item, idx) => (
                <View key={item.word_id || idx} style={s.wordChip}>
                  <Text style={s.chipWord}>{item.word}</Text>
                  <Text style={s.chipPhonetic}>{item.phonetic}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ─── TOP ACTION: TẠO BỘ THẺ MỚI (NẰM NGAY TRÊN ĐẦU, KHÔNG BỊ BÀN PHÍM CHE) ─── */}
          {isCreatingDeck ? (
            <Animated.View entering={FadeIn.duration(180)} style={s.createDeckCard}>
              <Text style={s.createDeckTitle}>✨ Tạo bộ thẻ mới</Text>
              <TextInput
                value={newDeckNameInput}
                onChangeText={setNewDeckNameInput}
                placeholder="Nhập tên bộ thẻ (VD: Từ vựng phòng ngủ...)"
                placeholderTextColor="#94A3B8"
                style={s.createDeckInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateNewDeckSubmit}
              />
              <View style={s.createDeckActionRow}>
                <Pressable
                  onPress={() => {
                    setIsCreatingDeck(false);
                    setNewDeckNameInput('');
                  }}
                  style={s.createDeckCancelBtn}
                >
                  <Text style={s.createDeckCancelText}>Hủy</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateNewDeckSubmit}
                  disabled={!newDeckNameInput.trim() || isSaving}
                  style={[
                    s.createDeckSubmitBtn,
                    (!newDeckNameInput.trim() || isSaving) && { opacity: 0.5 },
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Check color="#FFFFFF" size={16} strokeWidth={2.5} />
                      <Text style={s.createDeckSubmitText}>Xác nhận tạo</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <Pressable
              onPress={() => setIsCreatingDeck(true)}
              style={s.openCreateDeckBtn}
            >
              <FolderPlus color="#FF6B35" size={20} />
              <Text style={s.openCreateDeckText}>+ Tạo bộ thẻ mới</Text>
            </Pressable>
          )}

          {/* Section: Danh sách bộ thẻ cá nhân */}
          <View style={s.deckSectionHeader}>
            <Text style={s.sectionTitle}>Chọn bộ thẻ của bạn:</Text>
          </View>

          {/* Deck List Scroll */}
          <ScrollView
            style={s.deckListScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {isLoadingDecks ? (
              <View style={s.loadingBox}>
                <ActivityIndicator size="small" color="#FF6B35" />
                <Text style={s.loadingText}>Đang tải danh sách bộ thẻ...</Text>
              </View>
            ) : (
              myDecks.map((deck) => {
                const isSelected = String(selectedDeckId) === String(deck.id);
                return (
                  <Pressable
                    key={deck.id}
                    onPress={() => setSelectedDeckId(deck.id)}
                    style={[s.deckCard, isSelected && s.deckCardSelected]}
                  >
                    <View style={s.deckCardLeft}>
                      <View
                        style={[
                          s.deckIconCircle,
                          isSelected ? s.deckIconCircleSelected : s.deckIconCircleNormal,
                        ]}
                      >
                        <Folder
                          color={isSelected ? '#FFFFFF' : '#FF6B35'}
                          size={20}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text
                          style={[
                            s.deckCardName,
                            isSelected && s.deckCardNameSelected,
                          ]}
                        >
                          {deck.name}
                        </Text>
                        <Text style={s.deckCardCount}>
                          {deck.cardCount} từ vựng đã lưu
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        s.radioOuter,
                        isSelected && s.radioOuterSelected,
                      ]}
                    >
                      {isSelected && <View style={s.radioInner} />}
                    </View>
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* Bottom Primary Save Button */}
          <View style={s.footerContainer}>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={[s.mainSaveBtn, isSaving && { opacity: 0.7 }]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Bookmark color="#FFFFFF" size={20} fill="#FFFFFF" />
                  <Text style={s.mainSaveBtnText}>
                    {itemsToSave.length > 1
                      ? `Lưu ${itemsToSave.length} từ vào bộ thẻ`
                      : 'Lưu từ vào bộ thẻ'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 18, 0.72)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: SCREEN_HEIGHT * 0.84,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    fontFamily: font.family,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: font.family,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  successText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
    fontFamily: font.family,
  },
  previewSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    fontFamily: font.family,
  },
  chipsScrollContent: {
    flexDirection: 'row',
    gap: 8,
  },
  wordChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipWord: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: font.family,
  },
  chipPhonetic: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: font.family,
  },
  openCreateDeckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#FF6B35',
    borderRadius: 18,
    paddingVertical: 13,
    backgroundColor: '#FFF7ED',
    marginBottom: 14,
  },
  openCreateDeckText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
    fontFamily: font.family,
  },
  createDeckCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  createDeckTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
    marginBottom: 8,
    fontFamily: font.family,
  },
  createDeckInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1E293B',
    fontFamily: font.family,
    marginBottom: 12,
  },
  createDeckActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  createDeckCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  createDeckCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    fontFamily: font.family,
  },
  createDeckSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
  },
  createDeckSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: font.family,
  },
  deckSectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: font.family,
  },
  deckListScroll: {
    maxHeight: 180,
    marginBottom: 14,
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: font.family,
  },
  deckCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 10,
  },
  deckCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7ED',
  },
  deckCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deckIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckIconCircleNormal: {
    backgroundColor: '#FFF0EB',
  },
  deckIconCircleSelected: {
    backgroundColor: '#FF6B35',
  },
  deckCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: font.family,
  },
  deckCardNameSelected: {
    color: '#C2410C',
  },
  deckCardCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontFamily: font.family,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#FF6B35',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6B35',
  },
  footerContainer: {
    paddingTop: 4,
  },
  mainSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FF6B35',
    borderRadius: 18,
    height: 54,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  mainSaveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: font.family,
  },
});
