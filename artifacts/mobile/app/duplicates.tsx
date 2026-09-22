/**
 * Duplicates — Scanner de arquivos duplicados.
 * Categorias: Fotos, Vídeos, Músicas, Documentos, Outros.
 */
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { formatBytes } from '@/utils/formatters';

type Category = 'photos' | 'videos' | 'music' | 'docs' | 'others';

interface DuplicateGroup {
  id: string;
  name: string;
  count: number;
  totalSize: number;
  selected: boolean;
}

const MOCK_DUPLICATES: Record<Category, DuplicateGroup[]> = {
  photos: [
    { id: 'p1', name: 'Duplicados de fotos', count: 120, totalSize: 845 * 1024 * 1024, selected: true },
  ],
  videos: [
    { id: 'v1', name: 'Duplicados de vídeos', count: 15, totalSize: 342 * 1024 * 1024, selected: true },
  ],
  music: [
    { id: 'm1', name: 'Duplicados de músicas', count: 18, totalSize: 98 * 1024 * 1024, selected: true },
  ],
  docs: [
    { id: 'd1', name: 'Outros arquivos duplicados', count: 24, totalSize: 76 * 1024 * 1024, selected: true },
  ],
  others: [
    { id: 'o1', name: 'APKs duplicados', count: 8, totalSize: 512 * 1024 * 1024, selected: true },
    { id: 'o2', name: 'Arquivos ZIP duplicados', count: 4, totalSize: 234 * 1024 * 1024, selected: true },
  ],
};

const TABS: { key: Category; label: string; icon: string }[] = [
  { key: 'photos', label: 'Fotos', icon: 'image-outline' },
  { key: 'videos', label: 'Vídeos', icon: 'videocam-outline' },
  { key: 'music', label: 'Músicas', icon: 'musical-notes-outline' },
  { key: 'docs', label: 'Docs', icon: 'document-text-outline' },
  { key: 'others', label: 'Outros', icon: 'folder-outline' },
];

export default function DuplicatesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addRecord } = useCleanHistory();

  const [activeTab, setActiveTab] = useState<Category>('photos');
  const [groups, setGroups] = useState(MOCK_DUPLICATES);

  const currentGroups = groups[activeTab];
  const selected = currentGroups.filter((g) => g.selected);
  const totalSelected = selected.reduce((acc, g) => acc + g.totalSize, 0);

  const allTotal = Object.values(groups)
    .flat()
    .reduce((acc, g) => acc + g.totalSize, 0);

  function toggle(category: Category, id: string) {
    setGroups((prev) => ({
      ...prev,
      [category]: prev[category].map((g) =>
        g.id === id ? { ...g, selected: !g.selected } : g
      ),
    }));
  }

  function handleRemove() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Remover Duplicados',
      `Remover ${selected.length} grupo(s)?\n\nEspaço a liberar: ${formatBytes(totalSelected)}\n\nSomente o arquivo original será mantido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            addRecord({
              date: Date.now(),
              type: 'duplicates',
              spaceFreed: totalSelected,
              filesRemoved: selected.reduce((acc, g) => acc + g.count, 0),
              durationMs: 1200,
              items: ['Duplicados'],
            });
            setGroups((prev) => ({
              ...prev,
              [activeTab]: prev[activeTab].filter((g) => !g.selected),
            }));
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Duplicados</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Total banner */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.totalBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View>
            <Text style={styles.totalLabel}>Duplicados encontrados</Text>
            <Text style={styles.totalValue}>{formatBytes(allTotal)}</Text>
          </View>
          <View style={styles.totalRight}>
            <MaterialCommunityIcons name="content-copy" size={40} color="rgba(255,255,255,0.4)" />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.tab,
                {
                  backgroundColor: activeTab === item.key ? colors.primary : colors.card,
                  borderColor: activeTab === item.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveTab(item.key)}
            >
              <Ionicons
                name={item.icon as any}
                size={16}
                color={activeTab === item.key ? '#fff' : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === item.key ? '#fff' : colors.mutedForeground },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={currentGroups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.groupRow,
              {
                backgroundColor: colors.card,
                borderColor: item.selected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => toggle(activeTab, item.id)}
          >
            <View style={[styles.groupIcon, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="content-copy" size={26} color={colors.primary} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.groupMeta, { color: colors.mutedForeground }]}>
                {item.count} itens
              </Text>
            </View>
            <View style={styles.groupRight}>
              <Text style={[styles.groupSize, { color: colors.foreground }]}>
                {formatBytes(item.totalSize)}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.mutedForeground}
              />
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhum duplicado
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Botão Remover */}
      {currentGroups.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            style={[styles.removeBtn, { opacity: selected.length === 0 ? 0.5 : 1 }]}
            onPress={handleRemove}
            disabled={selected.length === 0}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.removeBtnInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.removeBtnText}>
                REMOVER {formatBytes(totalSelected)}
              </Text>
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
  totalBanner: { margin: 16, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  totalValue: { color: '#fff', fontSize: 26, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  totalRight: { flex: 1, alignItems: 'flex-end' },
  tabsWrapper: { paddingBottom: 4 },
  tabs: { paddingHorizontal: 16, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  groupRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12, marginBottom: 8 },
  groupIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  groupInfo: { flex: 1, gap: 3 },
  groupName: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  groupMeta: { fontSize: 12 },
  groupRight: { alignItems: 'flex-end', gap: 4 },
  groupSize: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  emptyState: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  removeBtn: { borderRadius: 14, overflow: 'hidden' },
  removeBtnInner: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  removeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
});
