/**
 * FileItem — Linha de arquivo na lista de scan.
 */
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { formatBytes, getFileIcon, getFileColor, formatRelativeDate } from '@/utils/formatters';
import { ScannedFile } from '@/utils/fileUtils';

interface FileItemProps {
  file: ScannedFile;
  selected: boolean;
  onToggle: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  cache: 'Cache inútil',
  temp: 'Arquivo temporário',
  log: 'Log antigo',
  apk: 'APK antigo',
  zip: 'Arquivo comprimido',
  large: 'Arquivo grande',
  empty_folder: 'Pasta vazia',
  download: 'Download',
  residual: 'Resíduo de app',
  thumbnail: 'Miniatura',
  other: 'Outro',
};

export function FileItem({ file, selected, onToggle }: FileItemProps) {
  const colors = useColors();
  const iconName = getFileIcon(file.name);
  const iconColor = getFileColor(file.name);

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { borderColor: colors.primary, backgroundColor: colors.scanBg },
      ]}
      onPress={onToggle}
    >
      {/* Ícone do arquivo */}
      <View style={[styles.iconBg, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={iconName as any} size={22} color={iconColor} />
      </View>

      {/* Informações */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {CATEGORY_LABELS[file.category] ?? 'Outro'}
          {file.modificationTime
            ? ' • ' + formatRelativeDate(file.modificationTime * 1000)
            : ''}
        </Text>
      </View>

      {/* Tamanho + checkbox */}
      <View style={styles.right}>
        <Text style={[styles.size, { color: colors.foreground }]}>
          {formatBytes(file.size)}
        </Text>
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: selected ? colors.primary : 'transparent',
              borderColor: selected ? colors.primary : colors.border,
            },
          ]}
        >
          {selected ? (
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
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  meta: {
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
