/**
 * Downloads — Scanner de downloads com agrupamento por tipo.
 */
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { formatBytes, formatRelativeDate, getFileColor, getFileIcon } from '@/utils/formatters';

type GroupType = 'all' | 'apk' | 'zip' | 'pdf' | 'video' | 'photo' | 'doc';

const TABS: { key: GroupType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'apk', label: 'APK' },
  { key: 'zip', label: 'ZIP' },
  { key: 'pdf', label: 'PDF' },
  { key: 'video', label: 'Vídeos' },
  { key: 'photo', label: 'Fotos' },
];

interface DownloadFile {
  id: string;
  name: string;
  type: GroupType;
  size: number;
  date: number;
  selected: boolean;
  neverOpened: boolean;
}

const MOCK_DOWNLOADS: DownloadFile[] = [
  { id: '1', name: 'instagram_246.apk', type: 'apk', size: 64 * 1024 * 1024, date: Date.now() - 86400000 * 30, selected: false, neverOpened: true },
  { id: '2', name: 'spotify_installer.apk', type: 'apk', size: 45 * 1024 * 1024, date: Date.now() - 86400000 * 60, selected: false, neverOpened: true },
  { id: '3', name: 'fotos_viagem.zip', type: 'zip', size: 256 * 1024 * 1024, date: Date.now() - 86400000 * 90, selected: false, neverOpened: false },
  { id: '4', name: 'backup_docs.zip', type: 'zip', size: 128 * 1024 * 1024, date: Date.now() - 86400000 * 45, selected: false, neverOpened: true },
  { id: '5', name: 'contrato_servico.pdf', type: 'pdf', size: 4.2 * 1024 * 1024, date: Date.now() - 86400000 * 180, selected: false, neverOpened: false },
  { id: '6', name: 'manual_tv.pdf', type: 'pdf', size: 12 * 1024 * 1024, date: Date.now() - 86400000 * 365, selected: false, neverOpened: true },
  { id: '7', name: 'video_evento.mp4', type: 'video', size: 780 * 1024 * 1024, date: Date.now() - 86400000 * 15, selected: false, neverOpened: false },
  { id: '8', name: 'captura_tela.png', type: 'photo', size: 3.1 * 1024 * 1024, date: Date.now() - 86400000 * 2, selected: false, neverOpened: false },
  { id: '9', name: 'relatorio_Q4.xlsx', type: 'doc', size: 8.5 * 1024 * 1024, date: Date.now() - 86400000 * 20, selected: false, neverOpened: false },
];

export default function DownloadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addRecord } = useCleanHistory();
  const [activeTab, setActiveTab] = useState<GroupType>('all');
  const [files, setFiles] = useState(MOCK_DOWNLOADS);

  const filtered = activeTab === 'all' ? files : files.filter((f) => f.type === activeTab);
  const selected = filtered.filter((f) => f.selected);
  const totalSelected = selected.reduce((acc, f) => acc + f.size, 0);

  function toggle(id: string) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));
  }

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Apagar Downloads', `Apagar ${selected.length} arquivo(s)?\n${formatBytes(totalSelected)}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar', style: 'destructive',
        onPress: () => {
          addRecord({ date: Date.now(), type: 'downloads', spaceFreed: totalSelected, filesRemoved: selected.length, durationMs: 500, items: ['Downloads'] });
          setFiles((prev) => prev.filter((f) => !f.selected));
        },
      },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Downloads</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={TABS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.tabs}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.tab, { backgroundColor: activeTab === item.key ? colors.primary : colors.card, borderColor: activeTab === item.key ? colors.primary : colors.border }]}
            onPress={() => setActiveTab(item.key)}
          >
            <Text style={[styles.tabText, { color: activeTab === item.key ? '#fff' : colors.mutedForeground }]}>{item.label}</Text>
          </Pressable>
        )}
      />

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
                <Ionicons name={icon as any} size={22} color={iconColor} />
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.metaRow}>
                  {item.neverOpened && (
                    <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                      <Text style={[styles.badgeText, { color: colors.warning }]}>Nunca aberto</Text>
                    </View>
                  )}
                  <Text style={[styles.fileMeta, { color: colors.mutedForeground }]}>{formatRelativeDate(item.date)}</Text>
                </View>
              </View>
              <View style={styles.fileRight}>
                <Text style={[styles.fileSize, { color: colors.foreground }]}>{formatBytes(item.size)}</Text>
                <View style={[styles.checkbox, { backgroundColor: item.selected ? colors.primary : 'transparent', borderColor: item.selected ? colors.primary : colors.border }]}>
                  {item.selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.foreground }]}>Nenhum download</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
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
  title: { flex: 1, fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  tabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  fileRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 10, marginBottom: 8 },
  fileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1, gap: 4 },
  fileName: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '600' },
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
