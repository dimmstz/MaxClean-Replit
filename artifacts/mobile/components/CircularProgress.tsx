/**
 * CircularProgress — Medidor circular SVG animado.
 * Usa react-native-svg + react-native-reanimated.
 */
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  /** Valor atual do progresso (0-1) */
  progress: number;
  /** Tamanho externo do componente em pixels */
  size?: number;
  /** Espessura do anel em pixels */
  strokeWidth?: number;
  /** Cor de início do gradiente (opcional, usa tema se não passado) */
  colorStart?: string;
  /** Cor de fim do gradiente (opcional) */
  colorEnd?: string;
  /** Conteúdo filho renderizado no centro */
  children?: React.ReactNode;
  /** Cor do anel de fundo */
  trackColor?: string;
  /** Duração da animação em ms */
  duration?: number;
  /** ID único para o gradiente SVG (deve ser único por instância) */
  gradientId?: string;
}

export function CircularProgress({
  progress,
  size = 220,
  strokeWidth = 14,
  colorStart,
  colorEnd,
  children,
  trackColor,
  duration = 1200,
  gradientId = 'cpGrad',
}: CircularProgressProps) {
  const colors = useColors();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(Math.min(1, Math.max(0, progress)), {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, duration]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  const cx = size / 2;
  const cy = size / 2;
  const start = colorStart ?? colors.gradientStart;
  const end = colorEnd ?? colors.gradientEnd;
  const track = trackColor ?? (colors.isDark ? '#1E2848' : '#E8EEFF');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${size} ${size}`}
      >
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={start} />
            <Stop offset="100%" stopColor={end} />
          </LinearGradient>
        </Defs>

        {/* Anel de fundo */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Anel de progresso animado */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>

      {/* Conteúdo central */}
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
