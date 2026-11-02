import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

export default function ComingSoonScreen() {
  useStatusBar('dark');
  const { title } = useLocalSearchParams<{ title?: string }>();

  return (
    <View style={styles.screen}>
      <View style={styles.icon}>
        <Ionicons name="construct-outline" size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title ?? 'This page'}</Text>
      <Text style={styles.text}>This isn’t available in the app yet. Please check back soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    textAlign: 'center',
    color: colors.text,
    marginTop: spacing.lg,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
