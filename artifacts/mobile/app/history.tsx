/**
 * History — Histórico de limpezas com estatísticas.
 */
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { formatBytes, formatDate, formatDuration } from '@/utils/formatters';

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { history, stats } = useCleanHistory();

  // TYPE_CONFIG inside component so labels are always translated
  const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    quick: { icon: 'lightning-bolt', color: '#1469FF', label: t('typeQuickLabel') },
    smart: { icon: 'broom', color: '#1469FF', label: t('smartClean') },
    app: { icon: 'cellphone', color: '#00C8FF', label: t('typeAppLabel') },
    duplicates: { icon: 'content-copy', color: '#F97316', label: t('duplicates') },
    'large-files': { icon: 'file-search', color: '#14B8A6', label: t('largeFiles') },
    downloads: { icon: 'download', color: '#8B5CF6', label: t('downloads') },
    'empty-folders': { icon: 'folder-remove', color: '#6366F1', label: t('emptyFoldersTitle') },
    apk: { icon: 'android', color: '#3DDC84', label: t('typeApkLabel') },
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('history')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        ListHeaderComponent={
          history.length > 0 ? (
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.statsBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{formatBytes(stats.totalSpaceFreed)}</Text>
                <Text style={styles.statLbl}>{t('spaceFreed')}</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{stats.totalSessions}</Text>
                <Text style={styles.statLbl}>{t('history')}</Text>
              </View>
              <View style={styles.statDiv} />
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{stats.totalFilesRemoved}</Text>
                <Text style={styles.statLbl}>{t('filesRemoved')}</Text>
              </View>
            </LinearGradient>
          ) : null
        }
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.quick;
          return (
            <View style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.histIcon, { backgroundColor: cfg.color + '18' }]}>
                <MaterialCommunityIcons name={cfg.icon as any} size={24} color={cfg.color} />
              </View>
              <View style={styles.histInfo}>
                <Text style={[styles.histTitle, { color: colors.foreground }]}>{cfg.label}</Text>
                <Text style={[styles.histDate, { color: colors.mutedForeground }]}>{formatDate(item.date)}</Text>
                <View style={styles.histStats}>
                  <Text style={[styles.histStat, { color: colors.success }]}>
                    +{formatBytes(item.spaceFreed)}
                  </Text>
                  <Text style={[styles.histStat, { color: colors.mutedForeground }]}>
                    • {item.filesRemoved} {t('filesRemoved').toLowerCase()}
                  </Text>
                  <Text style={[styles.histStat, { color: colors.mutedForeground }]}>
                    • {formatDuration(item.durationMs)}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="history" size={64} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('noHistory')}</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {t('noHistoryDesc')}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 10 },
  statsBanner: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 4 },
  statItem: { alignItems: 'center', gap: 2 },
  statVal: { color: '#fff', fontSize: 18, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  statLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  statDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },
  historyCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  histIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  histInfo: { flex: 1, gap: 3 },
  histTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  histDate: { fontSize: 12 },
  histStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  histStat: { fontSize: 12 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 14, textAlign: 'center', maxWidth: 240 },
});
