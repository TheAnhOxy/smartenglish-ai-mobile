import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BookOpen,
  ChevronRight,
  PlayCircle,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { colors } from "@/src/theme";
import { BackButton } from "@/src/core/components/BackButton";
import { withLoginRequired } from "@/src/core/components/GuestLoginPrompt";
import { useRefetchOnFocus } from "@/src/hooks/useRefetchOnFocus";
import { useAuthStore } from "@/src/core/flows/authStore";
import { normalizeCefr } from "@/src/features/onboarding/application/learnerLevel";
import { useSkillLessonsQuery } from "@/src/features/quiz-exam/application/useExamCatalog";
import type { SkillLessonSummary } from "@/src/features/quiz-exam/data/examCatalogApi";

const LEVELS = ["ALL", "A1", "A2", "B1", "B2", "C1", "C2"];

/** So khớp tìm kiếm không phân biệt hoa thường và dấu tiếng Việt. */
const foldText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

interface Props {
  kind: "READING" | "LISTENING";
}

/** Danh sách bài đọc hoặc bài nghe đã xuất bản, lọc theo trình độ, chủ đề và từ khóa. */
const SkillLessonListContent = ({ kind }: Props) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const learnerLevel = normalizeCefr(
    useAuthStore((s) => s.currentUser?.cefr_level),
  );
  const [level, setLevel] = useState<string>(learnerLevel ?? "ALL");
  const [topic, setTopic] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = useSkillLessonsQuery(kind);
  // Bài mới được duyệt: quay lại màn là tải lại
  useRefetchOnFocus(query.refetch);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await query.refetch().finally(() => setRefreshing(false));
  }, [query.refetch]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    (query.data ?? []).forEach((l) => l.topic && set.add(l.topic));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [query.data]);

  const lessons = useMemo(() => {
    const q = foldText(search.trim());
    return (query.data ?? []).filter((l) => {
      if (level !== "ALL" && l.cefrLevel !== level) return false;
      if (topic !== "ALL" && l.topic !== topic) return false;
      if (
        q &&
        !foldText(`${l.title} ${l.subtitle ?? ""} ${l.topic}`).includes(q)
      )
        return false;
      return true;
    });
  }, [query.data, level, topic, search]);

  const open = useCallback(
    (lesson: SkillLessonSummary) =>
      router.push(
        (lesson.kind === "LISTENING"
          ? `/(student)/practice/listening/${lesson.id}`
          : `/(student)/practice/reading/${lesson.id}`) as never,
      ),
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: SkillLessonSummary }) => (
      <Pressable
        onPress={() => open(item)}
        style={s.card}
        accessibilityLabel={`Mở ${item.title}`}
      >
        <View style={s.cardIcon}>
          {item.kind === "LISTENING" ? (
            <PlayCircle size={20} color={colors.primary} />
          ) : (
            <BookOpen size={20} color={colors.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={s.cardMeta} numberOfLines={1}>
            {[
              item.cefrLevel,
              item.topic,
              item.questionCount ? `${item.questionCount} câu` : null,
              item.durationLabel,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textSoft} />
      </Pressable>
    ),
    [open],
  );

  const filterCount = (level !== "ALL" ? 1 : 0) + (topic !== "ALL" ? 1 : 0);

  const chips = (
    values: string[],
    active: string,
    onPick: (v: string) => void,
  ) => (
    <View style={s.chipRow}>
      {values.map((v) => (
        <Pressable
          key={v}
          onPress={() => onPick(v)}
          style={[s.chip, active === v && s.chipActive]}
        >
          <Text style={[s.chipText, active === v && s.chipTextActive]}>
            {v === "ALL" ? "Tất cả" : v}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const header = (
    <View style={s.header}>
      <View style={s.searchWrap}>
        <Search size={16} color={colors.textSoft} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={
            kind === "LISTENING" ? "Tìm bài nghe..." : "Tìm bài đọc..."
          }
          placeholderTextColor={colors.textSoft}
          style={s.searchInput}
        />
        {search ? (
          <Pressable
            onPress={() => setSearch("")}
            hitSlop={8}
            accessibilityLabel="Xoá tìm kiếm"
          >
            <X size={14} color={colors.textSoft} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => setFiltersOpen((v) => !v)}
          hitSlop={8}
          accessibilityLabel="Bộ lọc"
          style={[s.filterBtn, (filtersOpen || filterCount > 0) && s.filterBtnActive]}
        >
          <SlidersHorizontal
            size={18}
            color={filtersOpen || filterCount > 0 ? colors.primary : colors.textSoft}
          />
          {filterCount > 0 ? <Text style={s.filterCount}>{filterCount}</Text> : null}
        </Pressable>
      </View>
      {filtersOpen ? (
        <View style={s.filterPanel}>
          <Text style={s.filterLabel}>Trình độ</Text>
          {chips(LEVELS, level, setLevel)}
          {topics.length > 0 ? (
            <>
              <Text style={[s.filterLabel, { marginTop: 10 }]}>Chủ đề</Text>
              {chips(["ALL", ...topics], topic, setTopic)}
            </>
          ) : null}
          {filterCount > 0 ? (
            <Pressable
              onPress={() => {
                setLevel("ALL");
                setTopic("ALL");
              }}
              hitSlop={6}
              style={s.clearBtn}
            >
              <Text style={s.link}>Xoá bộ lọc</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (query.isLoading) {
    empty = (
      <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
    );
  } else if (query.isError) {
    empty = (
      <View style={s.emptyBox}>
        <Text style={s.emptyTitle}>Không tải được danh sách bài</Text>
        <Pressable onPress={() => query.refetch()} hitSlop={6}>
          <Text style={s.link}>Thử lại</Text>
        </Pressable>
      </View>
    );
  } else {
    empty = (
      <View style={s.emptyBox}>
        <Text style={s.emptyTitle}>Chưa có bài phù hợp</Text>
        {level !== "ALL" || topic !== "ALL" || search ? (
          <Pressable
            onPress={() => {
              setLevel("ALL");
              setTopic("ALL");
              setSearch("");
            }}
            hitSlop={6}
          >
            <Text style={s.link}>Xoá bộ lọc</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + 8 }]}>
      <View style={s.topBar}>
        <BackButton />
        <Text style={s.topTitle}>
          {kind === "LISTENING" ? "Luyện nghe" : "Luyện đọc"}
        </Text>
        <View style={s.topSpacer} />
      </View>
      <FlatList
        data={lessons}
        keyExtractor={(l) => `${l.kind}-${l.id}`}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        onRefresh={onRefresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export const SkillLessonListScreen = withLoginRequired(SkillLessonListContent);

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  topTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  topSpacer: { width: 40 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  header: { gap: 10, paddingTop: 8, marginBottom: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    padding: 6,
    borderRadius: 10,
  },
  filterBtnActive: { backgroundColor: colors.primarySoft },
  filterCount: { fontSize: 11, fontWeight: "700", color: colors.primary },
  filterPanel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textSoft,
    marginBottom: 8,
  },
  clearBtn: { alignSelf: "flex-end", marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.textSoft },
  chipTextActive: { color: "#FFFFFF" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  cardMeta: { fontSize: 12, color: colors.textSoft, marginTop: 2 },
  emptyBox: { alignItems: "center", gap: 8, paddingVertical: 32 },
  emptyTitle: { fontSize: 14, fontWeight: "600", color: colors.textSoft },
  link: { fontSize: 13, fontWeight: "700", color: colors.primary },
});
