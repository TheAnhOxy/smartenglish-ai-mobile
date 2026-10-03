import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Bookmark,
  CheckCircle2,
  Undo2,
  RotateCcw,
  Lightbulb,
} from 'lucide-react-native';
import { colors } from '@/src/theme/colors';

export interface MatchingPairItem {
  id: string; // key for left item (e.g. "1")
  leftText: string; // e.g. "reserve"
  rightId: string; // key for right item (e.g. "C")
  rightText: string; // e.g. "đặt trước"
}

export interface MatchingQuestionData {
  id: string;
  categoryTag?: string; // e.g. "Ghép nối • Từ vựng"
  instruction?: string; // e.g. "Chạm chọn một từ bên trái, sau đó chọn nghĩa tương ứng ở cột bên phải."
  pairs: MatchingPairItem[]; // full list of pairs
  shuffledRight: { id: string; text: string; letter: string }[];
}

interface Props {
  question: MatchingQuestionData;
  matchedPairs: Record<string, string>; // leftId -> rightId
  onMatchesChange: (matches: Record<string, string>) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function MatchingPairsView({
  question,
  matchedPairs = {},
  onMatchesChange,
  isBookmarked,
  onToggleBookmark,
}: Props) {
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<Array<{ leftId: string; rightId: string }>>([]);

  const totalPairsCount = question.pairs.length;
  const currentMatchedCount = Object.keys(matchedPairs).length;

  // Map to get badge number #1, #2...
  const pairOrderMap: Record<string, number> = {};
  matchHistory.forEach((item, index) => {
    pairOrderMap[item.leftId] = index + 1;
    pairOrderMap[item.rightId] = index + 1;
  });

  const handleSelectLeft = (leftId: string) => {
    // If left item is already matched, remove its match
    if (matchedPairs[leftId]) {
      const rightId = matchedPairs[leftId];
      const newMatches = { ...matchedPairs };
      delete newMatches[leftId];
      onMatchesChange(newMatches);
      setMatchHistory((prev) => prev.filter((p) => p.leftId !== leftId));
      if (selectedLeftId === leftId) setSelectedLeftId(null);
      return;
    }

    setSelectedLeftId(leftId === selectedLeftId ? null : leftId);
  };

  const handleSelectRight = (rightId: string) => {
    // Check if rightId is already matched with another left item
    const matchedLeftKey = Object.keys(matchedPairs).find((k) => matchedPairs[k] === rightId);
    if (matchedLeftKey) {
      // Unmatch this pair
      const newMatches = { ...matchedPairs };
      delete newMatches[matchedLeftKey];
      onMatchesChange(newMatches);
      setMatchHistory((prev) => prev.filter((p) => p.rightId !== rightId));
      return;
    }

    // If a left item is currently selected, match them!
    if (selectedLeftId) {
      const newMatches = { ...matchedPairs, [selectedLeftId]: rightId };
      onMatchesChange(newMatches);
      setMatchHistory((prev) => [...prev.filter((p) => p.leftId !== selectedLeftId), { leftId: selectedLeftId, rightId }]);
      setSelectedLeftId(null);
    }
  };

  const handleUndoLast = () => {
    if (matchHistory.length === 0) return;
    const last = matchHistory[matchHistory.length - 1];
    const newMatches = { ...matchedPairs };
    delete newMatches[last.leftId];
    onMatchesChange(newMatches);
    setMatchHistory((prev) => prev.slice(0, -1));
  };

  const handleResetAll = () => {
    onMatchesChange({});
    setMatchHistory([]);
    setSelectedLeftId(null);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Top Status & Category Badges */}
      <View style={styles.topBadgesRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            🔗 {question.categoryTag || 'Ghép nối • Từ vựng'}
          </Text>
        </View>

        <View style={styles.progressBadge}>
          <CheckCircle2 size={14} color="#15803D" />
          <Text style={styles.progressBadgeText}>
            Đã ghép: {currentMatchedCount}/{totalPairsCount} cặp
          </Text>
        </View>
      </View>

      {/* Instruction Card */}
      <View style={styles.instructionCard}>
        <View style={styles.infoIconWrapper}>
          <Text style={styles.infoIconText}>ⓘ</Text>
        </View>
        <View style={styles.instructionContent}>
          <Text style={styles.instructionTitle}>Hướng dẫn làm bài</Text>
          <Text style={styles.instructionText}>
            {question.instruction ||
              'Chạm chọn một từ bên trái, sau đó chọn nghĩa tương ứng ở cột bên phải.'}
          </Text>
        </View>
        <Pressable
          onPress={onToggleBookmark}
          style={({ pressed }) => [styles.bookmarkBtn, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Bookmark
            size={18}
            color={isBookmarked ? colors.primary : colors.textSoft}
            fill={isBookmarked ? colors.primary : 'transparent'}
          />
        </Pressable>
      </View>

      {/* Control Actions Row (Hoàn tác / Làm lại) */}
      <View style={styles.controlRow}>
        <Text style={styles.controlHintText}>Chọn cặp từ thích hợp</Text>
        <View style={styles.actionBtnsGroup}>
          <Pressable
            onPress={handleUndoLast}
            disabled={matchHistory.length === 0}
            style={({ pressed }) => [
              styles.actionBtn,
              matchHistory.length === 0 && styles.actionBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Undo2 size={13} color={matchHistory.length === 0 ? '#94A3B8' : '#334155'} />
            <Text
              style={[
                styles.actionBtnText,
                matchHistory.length === 0 && styles.actionBtnTextDisabled,
              ]}
            >
              Hoàn tác ghép cuối
            </Text>
          </Pressable>

          <Pressable
            onPress={handleResetAll}
            disabled={currentMatchedCount === 0}
            style={({ pressed }) => [
              styles.actionBtn,
              currentMatchedCount === 0 && styles.actionBtnDisabled,
              pressed && styles.pressed,
            ]}
          >
            <RotateCcw size={13} color={currentMatchedCount === 0 ? '#94A3B8' : '#334155'} />
            <Text
              style={[
                styles.actionBtnText,
                currentMatchedCount === 0 && styles.actionBtnTextDisabled,
              ]}
            >
              Làm lại
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Column Headers */}
      <View style={styles.columnsHeaderRow}>
        <View style={styles.columnHeaderLeft}>
          <Text style={styles.columnTitle}>TỪ VỰNG (EN)</Text>
          <Text style={styles.columnCount}>{totalPairsCount} mục</Text>
        </View>
        <View style={styles.columnHeaderRight}>
          <Text style={styles.columnTitle}>Ý NGHĨA (VI)</Text>
          <Text style={styles.columnCount}>
            {currentMatchedCount === totalPairsCount ? 'Hoàn thành' : 'Chờ ghép'}
          </Text>
        </View>
      </View>

      {/* Two Columns Grid */}
      <View style={styles.matchingGrid}>
        {/* Left Column (EN) */}
        <View style={styles.columnContainer}>
          {question.pairs.map((item, index) => {
            const isSelected = selectedLeftId === item.id;
            const isMatched = Boolean(matchedPairs[item.id]);
            const badgeNum = pairOrderMap[item.id];

            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelectLeft(item.id)}
                style={({ pressed }) => [
                  styles.itemPill,
                  isSelected && styles.itemPillSelected,
                  isMatched && styles.itemPillMatched,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.indexCircle, isMatched && styles.indexCircleMatched]}>
                  <Text style={[styles.indexText, isMatched && styles.indexTextMatched]}>
                    {index + 1}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.itemText,
                    isSelected && styles.itemTextSelected,
                    isMatched && styles.itemTextMatched,
                  ]}
                  numberOfLines={1}
                >
                  {item.leftText}
                </Text>

                {/* Right side indicator: Badge #1 or selection dot */}
                {isMatched && badgeNum ? (
                  <View style={styles.pairBadge}>
                    <Text style={styles.pairBadgeText}>#{badgeNum}</Text>
                  </View>
                ) : isSelected ? (
                  <View style={styles.selectedDot} />
                ) : (
                  <View style={styles.placeholderDot} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Right Column (VI) */}
        <View style={styles.columnContainer}>
          {question.shuffledRight.map((item) => {
            const matchedLeftKey = Object.keys(matchedPairs).find((k) => matchedPairs[k] === item.id);
            const isMatched = Boolean(matchedLeftKey);
            const badgeNum = isMatched ? pairOrderMap[item.id] : null;

            return (
              <Pressable
                key={item.id}
                onPress={() => handleSelectRight(item.id)}
                style={({ pressed }) => [
                  styles.itemPill,
                  isMatched && styles.itemPillMatched,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.letterCircle, isMatched && styles.letterCircleMatched]}>
                  <Text style={[styles.letterText, isMatched && styles.letterTextMatched]}>
                    {item.letter}
                  </Text>
                </View>

                <Text
                  style={[styles.itemText, isMatched && styles.itemTextMatched]}
                  numberOfLines={1}
                >
                  {item.text}
                </Text>

                {/* Right indicator: Badge #1 or empty radio */}
                {isMatched && badgeNum ? (
                  <View style={styles.pairBadge}>
                    <Text style={styles.pairBadgeText}>#{badgeNum}</Text>
                  </View>
                ) : (
                  <View style={styles.radioCircle} />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Memory Tip Card */}
      <View style={styles.tipCard}>
        <View style={styles.tipIconWrapper}>
          <Lightbulb size={18} color="#1E293B" />
        </View>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Mẹo ghi nhớ</Text>
          <Text style={styles.tipText}>
            Chạm vào một cặp đã ghép để hủy liên kết bất kỳ lúc nào.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#E6F0FA',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A4B84',
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  infoIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBF3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: '#1A4B84',
    fontSize: 15,
    fontWeight: '800',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },
  bookmarkBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  actionBtnTextDisabled: {
    color: '#94A3B8',
  },
  columnsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  columnHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  columnHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  columnTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1A4B84',
    letterSpacing: 0.5,
  },
  columnCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  matchingGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  columnContainer: {
    flex: 1,
    gap: 10,
  },
  itemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemPillSelected: {
    borderColor: '#1A4B84',
    backgroundColor: '#F0F6FC',
  },
  itemPillMatched: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
  },
  indexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexCircleMatched: {
    backgroundColor: '#1E40AF',
  },
  indexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  indexTextMatched: {
    color: '#FFFFFF',
  },
  letterCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircleMatched: {
    backgroundColor: '#1E40AF',
  },
  letterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  letterTextMatched: {
    color: '#FFFFFF',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemTextSelected: {
    color: '#1A4B84',
    fontWeight: '700',
  },
  itemTextMatched: {
    color: '#1E293B',
  },
  pairBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pairBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1A4B84',
    marginRight: 4,
  },
  placeholderDot: {
    width: 8,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginRight: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
  },
  tipText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
