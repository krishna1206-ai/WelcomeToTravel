import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SlowZoom } from '@/components/Motion';
import type { Tour } from '@/data/tours';
import { colors, fonts, radius, spacing } from '@/theme';

function pageFrom(event: NativeSyntheticEvent<NativeScrollEvent>, width: number): number {
  return Math.round(event.nativeEvent.contentOffset.x / width);
}

export function TourGallery({ tour, height }: { tour: Tour; height: number }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const [viewerStart, setViewerStart] = useState<number | null>(null);
  const [viewerPage, setViewerPage] = useState(0);

  const photos: ImageProps['source'][] = [...(tour.photo ? [tour.photo] : []), ...tour.gallery];
  const many = photos.length > 1;

  if (photos.length === 0) return <View style={[styles.placeholder, { height }]} />;

  return (
    <View style={[styles.frame, { height }]}>
      <ScrollView
        horizontal
        pagingEnabled
        scrollEnabled={many}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={32}
        accessibilityLabel={`${photos.length} photos of ${tour.title}`}
        onScroll={(event) => setPage(pageFrom(event, width))}>
        {photos.map((photo, index) => (
          <Pressable
            key={index}
            style={[styles.page, { width, height }]}
            accessibilityRole="button"
            accessibilityLabel={`Open photo ${index + 1} of ${photos.length}`}
            onPress={() => {
              setViewerStart(index);
              setViewerPage(index);
            }}>
            <SlowZoom>
              <Image source={photo} style={{ width, height }} contentFit="cover" transition={150} />
            </SlowZoom>
          </Pressable>
        ))}
      </ScrollView>

      {many && (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((_, index) => (
            <View key={index} style={[styles.dot, index === page && styles.dotActive]} />
          ))}
        </View>
      )}

      <Modal
        visible={viewerStart !== null}
        animationType="fade"
        onRequestClose={() => setViewerStart(null)}
        statusBarTranslucent>
        <View style={styles.viewer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (viewerStart ?? 0) * width, y: 0 }}
            scrollEventThrottle={32}
            onScroll={(event) => setViewerPage(pageFrom(event, width))}>
            {photos.map((photo, index) => (
              <Image key={index} source={photo} style={{ width, height: '100%' }} contentFit="contain" />
            ))}
          </ScrollView>
          <View style={[styles.viewerBar, { top: insets.top + spacing.sm }]}>
            <Text style={styles.viewerCount}>
              {viewerPage + 1} of {photos.length}
            </Text>
            <Pressable
              style={styles.viewerClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close photos"
              onPress={() => setViewerStart(null)}>
              <Ionicons name="close" size={24} color={colors.white} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', backgroundColor: colors.primarySoft },
  placeholder: { backgroundColor: colors.primarySoft },
  page: { overflow: 'hidden' },
  dots: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotActive: { width: 18, backgroundColor: colors.white },
  viewer: { flex: 1, backgroundColor: '#000' },
  viewerBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewerCount: { fontFamily: fonts.semibold, fontSize: 15, color: colors.white },
  viewerClose: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
