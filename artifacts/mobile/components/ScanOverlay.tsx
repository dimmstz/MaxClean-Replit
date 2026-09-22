/**
 * ScanOverlay — Overlay animado exibido durante o escaneamento.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';

interface ScanOverlayProps {
  message?: string;
  percent?: number;
}

export function ScanOverlay({ message = 'Escaneando...', percent = 0 }: ScanOverlayProps) {
  const colors = useColors();

  // Animação de pulso
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.ease) })
      ),
      -1,
      false
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Círculo pulsante */}
      <Animated.View style={[styles.pulseRing, pulseStyle]}>
        <Animated.View style={[styles.innerRing, rotateStyle]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={[styles.percent, { color: colors.primary }]}>
            {Math.round(percent)}%
          </Text>
        </View>
      </Animated.View>

      <Text style={[styles.message, { color: colors.foreground }]}>
        {message}
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Aguarde enquanto escaneamos seu dispositivo
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 40,
  },
  pulseRing: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 70,
    opacity: 0.3,
  },
  center: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  sub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 240,
  },
});
