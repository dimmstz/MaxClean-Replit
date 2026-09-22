/**
 * APKScanner — Scanner de arquivos APK.
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
import { formatBytes, formatRelativeDate } from '@/utils/formatters';

interface ApkFile {
  id: string;
  name: string;
  version: string;
  size: number;
  date: number;
  path: string;
  type: 'old' | 'duplicate' | 'invalid' | 'installer';
  selected: boolean;
}

const MOCK_APKS: ApkFile[] = [
  { id: '1', name: 'instagram_246.1.0.apk', version: '246.1.0', size: 64 * 1024 * 1024, date: Date.now() - 86400000 * 30, path: '/Download/', type: 'old', selected: false },
  { id: '2', name: 'whatsapp_2.23.apk', version: '2.23.0', size: 53 * 1024 * 1024, date: Date.now() - 86400000 * 60, path: '/Download/', type: 'old', selected: false },
  { id: '3', name: 'tiktok_update.apk', version: '28.5.1', size: 98 * 1024 * 1024, date: Date.now() - 86400000 * 15, path: '/Download/', type: 'installer', selected: false },
  { id: '4', name: 'unknown_app.apk', version: '1.0.0', size: 12 * 1024 * 1024, date: Date.now() - 86400000 * 90, path: '/Download/', type: 'invalid', selected: false },
  { id: '5', name: 'instagram_246_copy.apk', version: '246.1.0', size: 64 * 1024 * 1024, date: Date.now() - 86400000 * 31, path: '/Download/old/', type: 'duplicate', selected: false },
  { id: '6', name: 'shopee_installer.apk', version: '3.12.0', size: 45 * 1024 * 1024, date: Date.now() - 86400000 * 45, path: '/Download/', type: 'installer', selected: false },
];

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  old: { bg: '#FEF3C7', text: '#F59E0B', label: 'Antigo' },
  duplicate: { bg: '#FEE2E2', text: '#EF4444', label: 'Duplicado' },
  invalid: { bg: '#F3F4F6', text: '#6B7280', label: 'Inválido' },
  installer: { bg: '#EFF6FF', text: '#3B82F6', label: 'Instalador' },
};

export default function ApkScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addRecord } = useCleanHistory();
  const [apks, setApks] = useState(MOCK_APKS);

  const selected = apks.filter((a) => a.selected);
  const totalSelected = selected.reduce((acc, a) => acc + a.size, 0);

  function toggle(id: string) {
    setApks((prev) => prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a)));
  }

  function handleDelete() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Apagar APKs', `Apagar ${selected.length} APK(s)?\n${formatBytes(totalSelected)}`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar', style: 'destructive',
        onPress: () => {
          addRecord({ date: Date.now(), type: 'apk', spaceFreed: totalSelected, filesRemoved: selected.length, durationMs: 400, items: ['APKs'] });
          setApks((prev) => prev.filter((a) => !a.selected));
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
        <Text style={[styles.title, { color: colors.foreground }]}>Scanner de APK</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Resumo */}
      <LinearGradient colors={['#3B82F6', '#1469FF']} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <MaterialCommunityIcons name="android" size={40} color="rgba(255,255,255,0.4)" />
        <View>
          <Text style={styles.bannerCount}>{apks.length} APKs</Text>
          <Text style={styles.bannerSize}>{formatBytes(apks.reduce((acc, a) => acc + a.size, 0))} no total</Text>
        </View>
      </LinearGradient>

      <FlatList
        data={apks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const typeInfo = TYPE_COLORS[item.type];
          return (
            <Pressable
              style={[styles.apkRow, { backgroundColor: colors.card, borderColor: item.selected ? colors.primary : colors.border }]}
              onPress={() => toggle(item.id)}
            >
              <View style={[styles.apkIcon, { backgroundColor: '#3B82F620' }]}>
                <MaterialCommunityIcons name="android" size={26} color="#3B82F6" />
              </View>
              <View style={styles.apkInfo}>
                <Text style={[styles.apkName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <View style={styles.apkMeta}>
                  <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: typeInfo.text }]}>{typeInfo.label}</Text>
                  </View>
                  <Text style={[styles.apkMetaText, { color: colors.mutedForeground }]}>
                    v{item.version} • {formatRelativeDate(item.date)}
                  </Text>
                </View>
              </View>
              <View style={styles.apkRight}>
                <Text style={[styles.apkSize, { color: colors.foreground }]}>{formatBytes(item.size)}</Text>
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
            <Text style={[styles.emptyText, { color: colors.foreground }]}>Nenhum APK encontrado</Text>
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
  banner: { margin: 16, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerCount: { color: '#fff', fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  bannerSize: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  apkRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 10, marginBottom: 8 },
  apkIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  apkInfo: { flex: 1, gap: 5 },
  apkName: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  apkMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '600' },
  apkMetaText: { fontSize: 11 },
  apkRight: { alignItems: 'flex-end', gap: 6 },
  apkSize: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyText: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  deleteBtn: { borderRadius: 14, overflow: 'hidden' },
  deleteBtnInner: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter_700Bold' },
});
