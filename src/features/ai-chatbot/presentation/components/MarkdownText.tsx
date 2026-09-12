import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { Volume2 } from 'lucide-react-native';

interface MarkdownTextProps {
  content: string;
  textColor?: string;
  onSpeak?: (text: string) => void;
}

/**
 * Parses markdown formatted text into styled React Native elements.
 * Handles:
 * - Headings (#, ##, ###)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Inline code (`text`)
 * - Bullet lists (- or *)
 * - Correction blocks (❌ Incorrect, ✅ Correct)
 * - English text audio TTS trigger
 */
export const MarkdownText: React.FC<MarkdownTextProps> = ({
  content,
  textColor = '#334155',
  onSpeak,
}) => {
  const lines = content.split('\n');

  const speakEnglishText = (text: string) => {
    // Clean markdown tags for TTS
    const clean = text.replace(/[*_`#]/g, '').trim();
    if (onSpeak) {
      onSpeak(clean);
    } else {
      Speech.stop();
      Speech.speak(clean, { language: 'en-US', pitch: 1.0, rate: 0.9 });
    }
  };

  const parseFormattedInline = (inlineText: string, keyPrefix: string) => {
    // Regex matches **bold**, *italic*, `code`
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const parts = inlineText.split(regex);

    return parts.map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={key} style={styles.boldText}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <Text key={key} style={styles.italicText}>
            {part.slice(1, -1)}
          </Text>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <View key={key} style={styles.inlineCodeBadge}>
            <Text style={styles.inlineCodeText}>{part.slice(1, -1)}</Text>
          </View>
        );
      }
      return <Text key={key}>{part}</Text>;
    });
  };

  return (
    <View style={styles.container}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <View key={idx} style={{ height: 6 }} />;
        }

        // Headings
        if (trimmed.startsWith('# ')) {
          return (
            <Text key={idx} style={styles.h1}>
              {trimmed.slice(2)}
            </Text>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <Text key={idx} style={styles.h2}>
              {trimmed.slice(3)}
            </Text>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <Text key={idx} style={styles.h3}>
              {trimmed.slice(4)}
            </Text>
          );
        }

        // Incorrect Correction Box
        if (trimmed.includes('❌ Incorrect:') || trimmed.includes('❌ **Incorrect:**') || trimmed.startsWith('❌')) {
          const textWithoutIcon = trimmed.replace('❌', '').trim();
          return (
            <View key={idx} style={styles.incorrectBox}>
              <Text style={styles.incorrectIcon}>❌</Text>
              <Text style={styles.incorrectText}>
                {parseFormattedInline(textWithoutIcon, `inc-${idx}`)}
              </Text>
            </View>
          );
        }

        // Correct Box
        if (trimmed.includes('✅ Correct:') || trimmed.includes('✅ **Correct:**') || trimmed.startsWith('✅')) {
          const textWithoutIcon = trimmed.replace('✅', '').trim();
          return (
            <View key={idx} style={styles.correctBox}>
              <Text style={styles.correctIcon}>✅</Text>
              <Text style={styles.correctText}>
                {parseFormattedInline(textWithoutIcon, `cor-${idx}`)}
              </Text>
              <Pressable
                onPress={() => speakEnglishText(textWithoutIcon)}
                style={styles.ttsBtnInline}
                hitSlop={8}
              >
                <Volume2 size={15} color="#16A34A" />
              </Pressable>
            </View>
          );
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const bulletContent = trimmed.slice(2);
          return (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={[styles.bodyText, { color: textColor }]}>
                {parseFormattedInline(bulletContent, `b-${idx}`)}
              </Text>
            </View>
          );
        }

        // Quote / Why / Example Block
        if (trimmed.startsWith('💡') || trimmed.startsWith('📝') || trimmed.startsWith('✨')) {
          const icon = trimmed.slice(0, 2);
          const rest = trimmed.slice(2).trim();
          return (
            <View key={idx} style={styles.featureBox}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={[styles.bodyText, { color: textColor }]}>
                {parseFormattedInline(rest, `f-${idx}`)}
              </Text>
            </View>
          );
        }

        // Standard Text Line
        return (
          <Text key={idx} style={[styles.bodyText, { color: textColor }]}>
            {parseFormattedInline(trimmed, `t-${idx}`)}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  h1: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
    marginBottom: 4,
  },
  h2: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
    marginBottom: 2,
  },
  h3: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0EA5E9',
    marginTop: 4,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    flexWrap: 'wrap',
  },
  boldText: {
    fontWeight: '800',
    color: '#0F172A',
  },
  italicText: {
    fontStyle: 'italic',
    color: '#475569',
  },
  inlineCodeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingLeft: 4,
    marginVertical: 1,
  },
  bulletDot: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '800',
    marginTop: 1,
  },
  incorrectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginVertical: 4,
  },
  incorrectIcon: {
    fontSize: 14,
  },
  incorrectText: {
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  correctBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginVertical: 4,
  },
  correctIcon: {
    fontSize: 14,
  },
  correctText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '700',
    flex: 1,
  },
  ttsBtnInline: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
  },
  featureBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
    marginVertical: 3,
  },
  featureIcon: {
    fontSize: 14,
    marginTop: 1,
  },
});
