import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ComponentRef,
  type ReactNode,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

// Browsers have no native animation thread, and React Native warns if asked to use one there.
export const NATIVE_DRIVER = Platform.OS !== 'web';

const STAGGER_MS = 60;
const MAX_STAGGERED_ITEMS = 6;
const REVEAL_MARGIN = 60;
// Entrances wait for the screen's own slide or fade, which would otherwise hide them on a phone.
const SCREEN_SETTLE_MS = Platform.OS === 'web' ? 0 : 220;
const RING_EVERY_MS = 6000;

// Lists stop staggering after a few items, so long lists don't keep people waiting.
export function staggerDelay(index: number, base = 0): number {
  return base + Math.min(index, MAX_STAGGERED_ITEMS) * STAGGER_MS;
}

let reducedMotion = false;
const reducedMotionListeners = new Set<() => void>();

function setReducedMotion(value: boolean) {
  reducedMotion = value;
  for (const listener of reducedMotionListeners) listener();
}

AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => undefined);
AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);

// Respects the phone's "reduce motion" setting, which some people need for comfort.
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (listener) => {
      reducedMotionListeners.add(listener);
      return () => reducedMotionListeners.delete(listener);
    },
    () => reducedMotion,
  );
}

export function useScreenFocused(): boolean {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}

// Runs back and forth for as long as the screen is open, without needing anything to load or tap.
function useIdleLoop(
  value: Animated.Value,
  { from, to, duration, delay = 0 }: { from: number; to: number; duration: number; delay?: number },
) {
  const reduced = useReducedMotion();
  const focused = useScreenFocused();

  useEffect(() => {
    value.setValue(from);
    if (reduced || !focused) return;
    const move = (toValue: number) =>
      Animated.timing(value, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: NATIVE_DRIVER,
      });
    const loop = Animated.loop(Animated.sequence([Animated.delay(delay), move(to), move(from)]));
    loop.start();
    return () => loop.stop();
  }, [value, from, to, duration, delay, reduced, focused]);
}

// Plays each time the screen opens, not just the first time.
export function FadeIn({
  children,
  delay = 0,
  distance = 18,
  duration = 420,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const focused = useScreenFocused();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    if (!focused) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: delay + SCREEN_SETTLE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced, focused, delay, duration]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

type RevealCheck = () => void;

const RevealContext = createContext<{ add: (check: RevealCheck) => () => void } | null>(null);

// Wrap a scrolling page in `Provider` and pass `onScroll` to its ScrollView to use Reveal inside it.
export function useRevealOnScroll() {
  const [checks] = useState(() => new Set<RevealCheck>());
  const [value] = useState(() => ({
    add(check: RevealCheck) {
      checks.add(check);
      return () => checks.delete(check);
    },
  }));
  const onScroll = useCallback(() => {
    for (const check of checks) check();
  }, [checks]);
  return { Provider: RevealContext.Provider, value, onScroll };
}

// Animates in whenever it scrolls into view, including when scrolling back to it.
export function Reveal({
  children,
  delay = 0,
  distance = 28,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const scope = useContext(RevealContext);
  const reduced = useReducedMotion();
  const focused = useScreenFocused();
  const { height } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const box = useRef<ComponentRef<typeof View>>(null);
  const shown = useRef(false);
  const running = useRef<Animated.CompositeAnimation | null>(null);

  const show = useCallback(
    (extraDelay = 0) => {
      if (shown.current) return;
      shown.current = true;
      running.current = Animated.timing(progress, {
        toValue: 1,
        duration: 520,
        delay: delay + extraDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: NATIVE_DRIVER,
      });
      running.current.start();
    },
    [progress, delay],
  );

  const hide = useCallback(() => {
    if (!shown.current) return;
    shown.current = false;
    running.current?.stop();
    progress.setValue(0);
  }, [progress]);

  const check = useCallback(
    (extraDelay = 0) => {
      // If it can't be measured it shows anyway, because hidden content is worse than a missed animation.
      if (!box.current) {
        show(extraDelay);
        return;
      }
      box.current.measureInWindow((_x, y, _width, boxHeight) => {
        if (typeof y !== 'number' || !boxHeight) show(extraDelay);
        else if (y < height - REVEAL_MARGIN && y + boxHeight > 0) show(extraDelay);
        else if (y >= height || y + boxHeight <= 0) hide();
      });
    },
    [show, hide, height],
  );

  useEffect(() => {
    if (reduced) {
      shown.current = true;
      progress.setValue(1);
      return;
    }
    if (!focused) return;
    shown.current = false;
    running.current?.stop();
    progress.setValue(0);
    if (!scope) {
      show(SCREEN_SETTLE_MS);
      return;
    }
    check(SCREEN_SETTLE_MS);
    return scope.add(() => check());
  }, [scope, check, show, reduced, focused, progress]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View ref={box} collapsable={false} style={style} onLayout={() => check()}>
      <Animated.View style={{ flexGrow: 1, opacity: progress, transform: [{ translateY }, { scale }] }}>
        {children}
      </Animated.View>
    </View>
  );
}

// Rings like a bell when `trigger` changes, then again every few seconds while it stays above 0.
export function Wiggle({ children, trigger }: { children: ReactNode; trigger: number }) {
  const reduced = useReducedMotion();
  const focused = useScreenFocused();
  const [angle] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced || trigger <= 0 || !focused) return;
    const swing = (toValue: number) =>
      Animated.timing(angle, { toValue, duration: 90, useNativeDriver: NATIVE_DRIVER });
    const ring = () =>
      Animated.sequence([swing(1), swing(-1), swing(0.7), swing(-0.7), swing(0.3), swing(0)]).start();
    ring();
    const timer = setInterval(ring, RING_EVERY_MS);
    return () => clearInterval(timer);
  }, [angle, trigger, reduced, focused]);

  const rotate = angle.interpolate({ inputRange: [-1, 1], outputRange: ['-18deg', '18deg'] });

  return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}

// Give it a `key` that changes to replay the pop, like when a heart is tapped.
export function PopIn({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    if (reduced) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      stiffness: 260,
      damping: 12,
      mass: 0.8,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [scale, reduced]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

// Gently fades in and out, for unread dots and loading placeholders.
export function Pulse({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(1));
  useIdleLoop(opacity, { from: 1, to: 0.45, duration: 800 });

  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

// Slowly drifts up and down, so small icons stay alive while nothing else is happening.
export function Float({
  children,
  delay = 0,
  distance = 5,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [offset] = useState(() => new Animated.Value(0));
  useIdleLoop(offset, { from: 0, to: -distance, duration: 1400, delay });

  return <Animated.View style={[style, { transform: [{ translateY: offset }] }]}>{children}</Animated.View>;
}

// Keeps a photo slowly zooming. The parent must clip its overflow.
export function SlowZoom({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [scale] = useState(() => new Animated.Value(1));
  useIdleLoop(scale, { from: 1, to: 1.14, duration: 7000 });

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

const SHINE_WIDTH = 70;
const SHINE_REST_MS = 2600;

// A band of light that sweeps across its parent now and then. The parent must clip its overflow.
export function Shine() {
  const reduced = useReducedMotion();
  const focused = useScreenFocused();
  const [width, setWidth] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    progress.setValue(0);
    if (reduced || !focused || width === 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.delay(SHINE_REST_MS),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, reduced, focused, width]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHINE_WIDTH, width + SHINE_WIDTH],
  });

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Animated.View style={[styles.shine, { transform: [{ translateX }, { skewX: '-18deg' }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A Pressable that dips slightly under the finger, so every tap feels answered.
export function ScalePressable({
  style,
  pressedScale = 0.97,
  breath,
  onPressIn,
  onPressOut,
  ...props
}: Omit<ComponentProps<typeof Pressable>, 'style'> & {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  breath?: Animated.Value;
}) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));

  function springTo(toValue: number) {
    if (reduced) return;
    Animated.spring(scale, {
      toValue,
      stiffness: 400,
      damping: 24,
      mass: 0.6,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }

  return (
    <AnimatedPressable
      {...props}
      style={[style, { transform: [{ scale: breath ? Animated.multiply(scale, breath) : scale }] }]}
      onPressIn={(event) => {
        springTo(pressedScale);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        springTo(1);
        onPressOut?.(event);
      }}
    />
  );
}

// For the main action on a screen: it gently grows and shrinks, with light sweeping across it.
export function AttentionPressable({
  children,
  style,
  ...props
}: ComponentProps<typeof ScalePressable> & { children: ReactNode }) {
  const [breath] = useState(() => new Animated.Value(1));
  useIdleLoop(breath, { from: 1, to: 1.035, duration: 1100 });

  return (
    <ScalePressable {...props} breath={breath} style={[style, styles.clipped]}>
      {children}
      <Shine />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  clipped: { overflow: 'hidden' },
  shine: { position: 'absolute', top: -10, bottom: -10, left: 0, width: SHINE_WIDTH },
});
