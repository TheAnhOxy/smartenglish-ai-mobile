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
} from '@/src/components/ds/icons';
import { colors } from '@/src/theme/colors';
import { ds, dsFont } from '@/src/theme/ds';

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
            {question.categoryTag || 'Ghép nối • Từ vựng'}
          </Text>
        </View>

        <View style={styles.progressBadge}>
          <CheckCircle2 size={14} color="#166534" />
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
            color={isBookmarked ? ds.btn : ds.muted}
            fill={isBookmarked ? ds.btn : 'transparent'}
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
            <Undo2 size={13} color={matchHistory.length === 0 ? '#8597AB' : '#33465C'} />
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
            <RotateCcw size={13} color={currentMatchedCount === 0 ? '#8597AB' : '#33465C'} />
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
          <Lightbulb size={18} color="#0F2A44" />
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
    fontFamily: dsFont.bold,
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
    fontFamily: dsFont.bold,
    color: '#166534',
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EAF2',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    shadowColor: '#0F2A44',
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
    fontFamily: dsFont.display,
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
    marginBottom: 2,
  },
  instructionText: {
    fontFamily: dsFont.body,
    fontSize: 12.5,
    color: '#5B6B7F',
    lineHeight: 18,
  },
  bookmarkBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F4F7FB',
    borderWidth: 1,
    borderColor: '#E3EAF2',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlHintText: {
    fontSize: 12,
    fontFamily: dsFont.semibold,
    color: '#5B6B7F',
  },
  actionBtnsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: dsFont.semibold,
    color: '#33465C',
  },
  actionBtnTextDisabled: {
    color: '#8597AB',
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
    fontFamily: dsFont.display,
    color: '#1A4B84',
    letterSpacing: 0.5,
  },
  columnCount: {
    fontSize: 11,
    color: '#5B6B7F',
    fontFamily: dsFont.medium,
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
    borderColor: '#E3EAF2',
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
    borderColor: '#BAE6FD',
    backgroundColor: '#F4F7FB',
  },
  indexCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3EAF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexCircleMatched: {
    backgroundColor: '#1E40AF',
  },
  indexText: {
    fontSize: 12,
    fontFamily: dsFont.bold,
    color: '#33465C',
  },
  indexTextMatched: {
    color: '#FFFFFF',
  },
  letterCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterCircleMatched: {
    backgroundColor: '#1E40AF',
  },
  letterText: {
    fontSize: 12,
    fontFamily: dsFont.bold,
    color: '#33465C',
  },
  letterTextMatched: {
    color: '#FFFFFF',
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    fontFamily: dsFont.semibold,
    color: '#0F2A44',
  },
  itemTextSelected: {
    color: '#1A4B84',
    fontFamily: dsFont.bold,
  },
  itemTextMatched: {
    color: '#0F2A44',
  },
  pairBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pairBadgeText: {
    fontSize: 11,
    fontFamily: dsFont.display,
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
    borderColor: '#CBD6E2',
    marginRight: 2,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E3EAF2',
  },
  tipIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E3EAF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 13,
    fontFamily: dsFont.bold,
    color: '#0F2A44',
    marginBottom: 1,
  },
  tipText: {
    fontFamily: dsFont.body,
    fontSize: 11.5,
    color: '#5B6B7F',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
