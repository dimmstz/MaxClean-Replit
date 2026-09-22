/**
 * LargeFiles — Scanner de arquivos grandes.
 */
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { formatBytes, getFileIcon, getFileColor, formatRelativeDate } from '@/utils/formatters';

const SIZE_FILTERS = [
  { label: '10 MB', min: 10 * 1024 * 1024 },
  { label: '50 MB', min: 50 * 1024 * 1024 },
  { label: '100 MB', min: 100 * 1024 * 1024 },
  { label: '500 MB', min: 500 * 1024 * 1024 },
  { label: '1 GB', min: 1024 * 1024 * 1024 },
];

interface LargeFile {
  id: string;
  name: string;
  path: string;
  size: number;
  date: number;
  selected: boolean;
}

const MOCK_FILES: LargeFile[] = [
  { id: '1', name: 'backup_fotos_2024.zip', path: '/Download/backup_fotos_2024.zip', size: 2.1 * 1024 * 1024 * 1024, date: Date.now() - 86400000 * 90, selected: false },
  { id: '2', name: 'video_casamento_4k.mp4', path: '/Movies/video_casamento_4k.mp4', size: 1.8 * 1024 * 1024 * 1024, date: Date.now() - 86400000 * 30, selected: false },
  { id: '3', name: 'instagram_update.apk', path: '/Download/instagram_update.apk', size: 512 * 1024 * 1024, date: Date.now() - 86400000 * 15, selected: false },
  { id: '4', name: 'Filme_HD.mkv', path: '/Movies/Filme_HD.mkv', size: 890 * 1024 * 1024, date: Date.now() - 86400000 * 45, selected: false },
  { id: '5', name: 'musicas_baixadas.zip', path: '/Download/musicas_baixadas.zip', size: 450 * 1024 * 1024, date: Date.now() - 86400000 * 60, selected: false },
  { id: '6', name: 'whatsapp_backup.crypt14', path: '/WhatsApp/Backups/backup.crypt14', size: 380 * 1024 * 1024, date: Date.now() - 86400000 * 7, selected: false },
  { id: '7', name: 'relatorio_empresa.pdf', path: '/Documents/relatorio_empresa.pdf', size: 220 * 1024 * 1024, date: Date.now() - 86400000 * 20, selected: false },
  { id: '8', name: 'chrome_cache.bin', path: '/Android/data/chrome/cache.bin', size: 180 * 1024 * 1024, date: Date.now() - 86400000 * 3, selected: false },
  { id: '9', name: 'podcast_episodio.mp3', path: '/Music/podcast_episodio.mp3', size: 150 * 1024 * 1024, date: Date.now() - 86400000 * 12, selected: false },
  { id: '10', name: 'update_system.apk', path: '/Download/update_system.apk', size: 120 * 1024 * 1024, date: Date.now() - 86400000 * 180, selected: false },
];

export default function LargeFilesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addRecord } = useCleanHistory();
  const [filterIdx, setFilterIdx] = useState(1); // padrão: 50 MB
  const [files, setFiles] = useState(MOCK_FILES);

  const minSize = SIZE_FILTERS[filterIdx].min;
  const filtered = files.filter((f) => f.size >= minSize);
  const selected = filtered.filter((f) => f.selected);
  const totalSelected = selected.reduce((acc, f) => acc + f.size, 0);

  function toggle(id: string) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));
  }

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Apagar Arquivos',
      `Apagar ${selected.length} arquivo(s)?\nEspaço a liberar: ${formatBytes(totalSelected)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => {
            addRecord({
              date: Date.now(),
              type: 'large-files',
              spaceFreed: totalSelected,
              filesRemoved: selected.length,
              durationMs: 800,
              items: ['Arquivos Grandes'],
            });
            setFiles((prev) => prev.filter((f) => !f.selected || f.size < minSize));
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Arquivos Grandes</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filtros de tamanho */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {SIZE_FILTERS.map((f, i) => (
          <Pressable
            key={f.label}
            style={[styles.filterChip, {
              backgroundColor: filterIdx === i ? colors.primary : colors.card,
              borderColor: filterIdx === i ? colors.primary : colors.border,
            }]}
            onPress={() => setFilterIdx(i)}
          >
            <Text style={[styles.filterText, { color: filterIdx === i ? '#fff' : colors.mutedForeground }]}>
              {f.label}+
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const icon = getFileIcon(item.name);
          const iconColor = getFileColor(item.name);
          return (
            <Pressable
              style={[styles.fileRow, { backgroundColor: colors.card, borderColor: item.selected ? colors.primary : colors.border }]}
              onPress={() => toggle(item.id)}
            >
              <View style={[styles.fileIcon, { backgroundColor: iconColor + '20' }]}>
                <Ionicons name={icon as any} size={24} color={iconColor} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.fileMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {formatRelativeDate(item.date)} • {item.path}
                </Text>
              </View>
              <View style={styles.fileRight}>
                <Text style={[styles.fileSize, { color: colors.foreground }]}>{formatBytes(item.size)}</Text>
                <View style={[styles.checkbox, {
                  backgroundColor: item.selected ? colors.primary : 'transparent',
                  borderColor: item.selected ? colors.primary : colors.border,
                }]}>
                  {item.selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.foreground }]}>Nenhum arquivo grande</Text>
          </View>
        }
      />

      {selected.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.deleteBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.deleteBtnText}>APAGAR {formatBytes(totalSelected)}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  fileRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 10, marginBottom: 8 },
  fileIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1, gap: 3 },
  fileName: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  fileMeta: { fontSize: 11 },
  fileRight: { alignItems: 'flex-end', gap: 6 },
  fileSize: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  deleteBtn: { borderRadius: 14, overflow: 'hidden' },
  deleteBtnInner: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter_700Bold' },
});
