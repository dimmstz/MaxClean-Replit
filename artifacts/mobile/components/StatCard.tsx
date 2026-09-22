/**
 * StatCard — Card de estatística compacto para a Home.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  progress?: number; // 0-1
  progressColor?: [string, string]; // gradiente
  onPress?: () => void;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  iconColor,
  progress,
  progressColor,
}: StatCardProps) {
  const colors = useColors();
  const iColor = iconColor ?? colors.primary;
  const bar = progressColor ?? [colors.gradientStart, colors.gradientEnd];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Ícone + label */}
      <View style={styles.header}>
        <MaterialCommunityIcons name={icon as any} size={16} color={iColor} />
        <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
          {label}
        </Text>
      </View>

      {/* Valor principal */}
      <Text style={[styles.value, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>

      {/* Subtitle */}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}

      {/* Barra de progresso */}
      {progress !== undefined ? (
        <View style={[styles.trackBg, { backgroundColor: colors.muted }]}>
          <LinearGradient
            colors={bar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: `${Math.min(100, progress * 100)}%` }]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 4,
    minHeight: 90,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '400',
  },
  trackBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
});
