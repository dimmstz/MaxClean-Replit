/**
 * EmptyFolders — Scanner de pastas vazias.
 */
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useCleanHistory } from '@/context/CleanHistoryContext';

interface EmptyFolder {
  id: string;
  path: string;
  items: number;
  selected: boolean;
}

const MOCK_FOLDERS: EmptyFolder[] = [
  { id: '1', path: '/Android/data/com.xxx/cache', items: 0, selected: true },
  { id: '2', path: '/storage/emulated/0/Download/.tmp', items: 0, selected: true },
  { id: '3', path: '/storage/emulated/0/Movies/.folders', items: 0, selected: true },
  { id: '4', path: '/storage/emulated/0/Pictures/archive', items: 0, selected: true },
  { id: '5', path: '/storage/emulated/0/.temp', items: 0, selected: true },
  { id: '6', path: '/storage/emulated/0/Documents/old', items: 0, selected: true },
  { id: '7', path: '/storage/emulated/0/Telegram/.nomedia', items: 0, selected: true },
  { id: '8', path: '/storage/emulated/0/.cache', items: 0, selected: true },
];

export default function EmptyFoldersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addRecord } = useCleanHistory();
  const [folders, setFolders] = useState(MOCK_FOLDERS);

  const selected = folders.filter((f) => f.selected);

  function toggle(id: string) {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));
  }

  function handleDeleteAll() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Apagar Pastas Vazias', `Apagar ${selected.length} pasta(s) vazia(s)?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar', style: 'destructive',
        onPress: () => {
          addRecord({ date: Date.now(), type: 'empty-folders', spaceFreed: 0, filesRemoved: selected.length, durationMs: 300, items: ['Pastas Vazias'] });
          setFolders((prev) => prev.filter((f) => !f.selected));
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
        <Text style={[styles.title, { color: colors.foreground }]}>Pastas Vazias</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Resumo */}
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <MaterialCommunityIcons name="folder-remove" size={48} color="rgba(255,255,255,0.4)" />
        <View>
          <Text style={styles.bannerCount}>{folders.length}</Text>
          <Text style={styles.bannerLabel}>pastas vazias encontradas</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={folders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.folderRow, { backgroundColor: colors.card, borderColor: item.selected ? colors.primary : colors.border }]}
            onPress={() => toggle(item.id)}
          >
            <MaterialCommunityIcons name="folder-outline" size={22} color={colors.mutedForeground} />
            <Text style={[styles.folderPath, { color: colors.foreground }]} numberOfLines={2}>{item.path}</Text>
            <Text style={[styles.folderItems, { color: colors.mutedForeground }]}>0 itens</Text>
            <View style={[styles.checkbox, { backgroundColor: item.selected ? colors.primary : 'transparent', borderColor: item.selected ? colors.primary : colors.border }]}>
              {item.selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={[styles.emptyText, { color: colors.foreground }]}>Nenhuma pasta vazia</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {folders.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable style={[styles.deleteBtn, { opacity: selected.length === 0 ? 0.5 : 1 }]} onPress={handleDeleteAll} disabled={selected.length === 0}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.deleteBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.deleteBtnText}>APAGAR TUDO ({selected.length} pastas)</Text>
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
  banner: { margin: 16, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerCount: { color: '#fff', fontSize: 42, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  folderRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 10, marginBottom: 8 },
  folderPath: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular' },
  folderItems: { fontSize: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  deleteBtn: { borderRadius: 14, overflow: 'hidden' },
  deleteBtnInner: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  deleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: 'Inter_700Bold' },
});
