import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import * as Sentry from '@sentry/react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NotificationBanner } from '@/components/NotificationBanner';
import { PushNotifications } from '@/components/PushNotifications';
import { AuthProvider } from '@/state/auth';
import { StoreProvider } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Crash reports stay off until a DSN is set, and never include personal details.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
Sentry.init({ dsn: SENTRY_DSN, enabled: Boolean(SENTRY_DSN), sendDefaultPii: false });

// Uses system fonts because a crash can happen before the app's fonts have loaded.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    Sentry.captureException(error);
    SplashScreen.hideAsync();
  }, [error]);

  return (
    <View style={styles.crash}>
      <Text style={styles.crashTitle}>Something went wrong</Text>
      <Text style={styles.crashText}>Sorry about that. Please try again.</Text>
      <Pressable style={styles.crashButton} accessibilityRole="button" onPress={retry}>
        <Text style={styles.crashButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function RootLayout() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <AuthProvider>
      <StoreProvider>
        <Stack
        screenOptions={{
          animation: 'slide_from_right',
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { fontFamily: fonts.bold },
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tour/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="book/[id]" options={{ title: 'Book this tour' }} />
        <Stack.Screen name="build-request" options={{ title: 'Get my itinerary' }} />
        <Stack.Screen name="sign-in" options={{ title: '' }} />
        <Stack.Screen name="sign-up" options={{ title: '' }} />
        <Stack.Screen name="forgot-password" options={{ title: '' }} />
        <Stack.Screen name="account" options={{ title: 'Your account' }} />
        <Stack.Screen name="search" options={{ title: 'Search tours' }} />
        <Stack.Screen name="activity" options={{ title: 'Saved & requests' }} />
        <Stack.Screen name="my-trip/[id]" options={{ title: 'My Trip' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="chat" options={{ title: 'Welcome to Travel' }} />
        <Stack.Screen name="coming-soon" options={{ title: '' }} />
        </Stack>
        <NotificationBanner />
        <PushNotifications />
      </StoreProvider>
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);

const styles = StyleSheet.create({
  crash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  crashTitle: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  crashText: { fontSize: 15, lineHeight: 22, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  crashButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 13,
    marginTop: spacing.lg,
  },
  crashButtonText: { fontSize: 15, fontWeight: '700', color: colors.white },
});
