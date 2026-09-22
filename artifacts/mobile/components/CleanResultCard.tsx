/**
 * CleanResultCard — Card de resultado pós-limpeza com animação.
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { formatBytes, formatDuration } from '@/utils/formatters';

interface CleanResultCardProps {
  spaceFreed: number;
  filesRemoved: number;
  durationMs: number;
  onClose?: () => void;
}

export function CleanResultCard({
  spaceFreed,
  filesRemoved,
  durationMs,
}: CleanResultCardProps) {
  const colors = useColors();

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Ícone de sucesso */}
        <View style={styles.iconBg}>
          <MaterialCommunityIcons name="check-circle" size={48} color="#fff" />
        </View>

        <Text style={styles.title}>Limpeza Concluída!</Text>

        <View style={styles.statsRow}>
          <Stat label="Espaço Liberado" value={formatBytes(spaceFreed)} />
          <View style={styles.divider} />
          <Stat label="Arquivos Removidos" value={String(filesRemoved)} />
          <View style={styles.divider} />
          <Stat label="Tempo Gasto" value={formatDuration(durationMs)} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
