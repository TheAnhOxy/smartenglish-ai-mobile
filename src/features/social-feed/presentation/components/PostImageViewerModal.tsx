import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { X, ZoomIn } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PostImageViewerModalProps {
  visible: boolean;
  imageUrl: string | null;
  caption?: string | null;
  authorName?: string;
  onClose: () => void;
}

export const PostImageViewerModal: React.FC<PostImageViewerModalProps> = ({
  visible,
  imageUrl,
  caption,
  authorName,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {authorName && (
              <Text style={styles.authorText} numberOfLines={1}>
                {authorName}
              </Text>
            )}
            <Text style={styles.subText}>Hình ảnh bài viết</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <X color="#FFFFFF" size={24} />
          </Pressable>
        </View>

        {/* Image Content Container */}
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>

        {/* Caption bar */}
        {caption ? (
          <View style={styles.captionBox}>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  authorText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.72,
  },
  captionBox: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  captionText: {
    color: '#E2E8F0',
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
});
