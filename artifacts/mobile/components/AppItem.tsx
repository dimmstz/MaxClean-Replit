/**
 * AppItem — Linha de aplicativo na lista de App Clean.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { formatBytes } from '@/utils/formatters';

export interface AppInfo {
  id: string;
  name: string;
  packageName: string;
  cacheSize: number;  // bytes estimados
  icon: string;       // nome do ícone MaterialCommunityIcons
  iconColor: string;
  iconBg: string;
  description: string; // ex: "Limpar cache e arquivos temporários"
  selected: boolean;
}

interface AppItemProps {
  app: AppInfo;
  onToggle: () => void;
  onOpenSettings: () => void;
}

export function AppItem({ app, onToggle, onOpenSettings }: AppItemProps) {
  const colors = useColors();

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: app.selected ? colors.primary : colors.border,
        },
      ]}
      onPress={onToggle}
    >
      {/* Ícone do app */}
      <View style={[styles.appIcon, { backgroundColor: app.iconBg }]}>
        <MaterialCommunityIcons name={app.icon as any} size={28} color={app.iconColor} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]}>
          {app.name}
        </Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
          {app.description}
        </Text>
      </View>

      {/* Tamanho + checkbox */}
      <View style={styles.right}>
        <Text style={[styles.size, { color: colors.foreground }]}>
          {formatBytes(app.cacheSize)}
        </Text>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: app.selected ? colors.primary : 'transparent',
              borderColor: app.selected ? colors.primary : colors.border,
            },
          ]}
        >
          {app.selected ? (
            <MaterialCommunityIcons name="check" size={14} color="#fff" />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  appIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  desc: {
    fontSize: 11,
    fontWeight: '400',
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  size: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
