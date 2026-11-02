import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { API_URL } from '@/api/client';
import type { User } from '@/state/auth';
import { colors, fonts, radius } from '@/theme';

// Shows the person's photo, or the first letter of their name until they add one.
export function Avatar({ user, size = 44 }: { user: User; size?: number }) {
  const dimensions = { width: size, height: size };

  if (user.photo) {
    return (
      <Image
        source={{ uri: API_URL + user.photo }}
        style={[styles.circle, dimensions]}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View style={[styles.circle, styles.initialCircle, dimensions]}>
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
        {user.name.trim().charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderRadius: radius.pill, backgroundColor: colors.primarySoft },
  initialCircle: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  initial: { fontFamily: fonts.bold, color: colors.white },
});
