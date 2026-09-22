/**
 * ToolCard — Card de ferramenta para grade de ferramentas.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ToolCardProps {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
  badge?: string;
}

export function ToolCard({ icon, label, color, bgColor, onPress, badge }: ToolCardProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[styles.container, animStyle]}
      onPressIn={() => { scale.value = withSpring(0.93, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={onPress}
    >
      <View style={[styles.iconBg, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon as any} size={26} color={color} />
        {badge ? (
          <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        style={[styles.label, { color: colors.foreground }]}
        numberOfLines={2}
        textBreakStrategy="highQuality"
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 14,
  },
});
