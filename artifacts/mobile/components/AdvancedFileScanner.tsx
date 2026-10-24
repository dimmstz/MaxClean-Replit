import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { useFileScanner } from '@/hooks/useFileScanner';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { useLanguage } from '@/context/LanguageContext';
import { FileScanMode, ScannedFile, getFileKind } from '@/utils/fileUtils';
import { formatBytes, formatRelativeDate, getFileColor, getFileIcon } from '@/utils/formatters';
import { StringKey } from '@/constants/strings';

interface AdvancedFileScannerProps {
  mode: Exclude<FileScanMode, 'junk'>;
  titleKey: StringKey;
  emptyKey: StringKey;
  minSize?: number;
  filter?: 'none' | 'downloads' | 'large';
}

const LARGE_FILTERS = [
  { label: '10 MB', value: 10 * 1024 * 1024 },
  { label: '50 MB', value: 50 * 1024 * 1024 },
  { label: '100 MB', value: 100 * 1024 * 1024 },
  { label: '500 MB', value: 500 * 1024 * 1024 },
  { label: '1 GB', value: 1024 * 1024 * 1024 },
];

const DOWNLOAD_FILTERS: { key: ReturnType<typeof getFileKind> | 'all'; labelKey: StringKey }[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'apk', labelKey: 'apks' },
  { key: 'zip', labelKey: 'zips' },
  { key: 'pdf', labelKey: 'pdfs' },
  { key: 'video', labelKey: 'videos' },
  { key: 'photo', labelKey: 'photos' },
];

function itemLabel(mode: AdvancedFileScannerProps['mode'], t: (key: StringKey) => string) {
  if (mode === 'empty-folders') return t('emptyFolders');
  if (mode === 'apk') return t('apks');
  if (mode === 'duplicates') return t('duplicates');
  if (mode === 'downloads') return t('downloads');
  return t('largeFiles');
}

export function AdvancedFileScanner({
  mode,
  titleKey,
  emptyKey,
  minSize = mode === 'large-files' ? LARGE_FILTERS[0].value : undefined,
  filter = 'none',
}: AdvancedFileScannerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { addRecord } = useCleanHistory();
  const scanner = useFileScanner(mode, minSize);
  const [largeFilter, setLargeFilter] = useState(1);
  const [downloadFilter, setDownloadFilter] = useState<ReturnType<typeof getFileKind> | 'all'>('all');

  useEffect(() => {
    if (scanner.state === 'idle' && !scanner.error) void scanner.startScan();
  }, [scanner.error, scanner.startScan, scanner.state]);

  const visibleFiles = useMemo(() => {
    const files = scanner.result?.files ?? [];
    if (filter === 'large') {
      return files.filter((file) => file.size >= LARGE_FILTERS[largeFilter].value);
    }
    if (filter === 'downloads' && downloadFilter !== 'all') {
      return files.filter((file) => getFileKind(file.name) === downloadFilter);
    }
    return files;
  }, [downloadFilter, filter, largeFilter, scanner.result]);

  const visibleUris = useMemo(() => new Set(visibleFiles.map((file) => file.uri)), [visibleFiles]);
  const selectedFiles = visibleFiles.filter((file) => scanner.selectedUris.has(file.uri));
  const selectedSize = selectedFiles.reduce((total, file) => total + file.size, 0);
  const typeLabel = itemLabel(mode, t);

  function handleDelete() {
    if (selectedFiles.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('cleanConfirm'),
      `${selectedFiles.length} ${typeLabel}\n\n${t('spaceToFree')}: ${formatBytes(selectedSize)}\n\n${t('cannotUndo')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('deleteSelected'),
          style: 'destructive',
          onPress: async () => {
            const startedAt = Date.now();
            const selectedUris = selectedFiles.map((file) => file.uri);
            const cleaned = await scanner.executeClean(selectedUris);
            addRecord({
              date: Date.now(),
              type: mode,
              spaceFreed: cleaned.deletedBytes,
              filesRemoved: cleaned.deletedCount,
              durationMs: Date.now() - startedAt,
              items: [typeLabel],
            });
            const summary = t('cleanResultSummary')
              .replace('{deleted}', String(cleaned.deletedCount))
              .replace('{failed}', String(cleaned.failedCount));
            Alert.alert(
              cleaned.failedCount > 0 ? t('cleanPartial') : t('cleanDone'),
              summary,
            );
          },
        },
      ],
    );
  }

  function renderFile({ item }: { item: ScannedFile }) {
    const selected = scanner.selectedUris.has(item.uri);
    const isFolder = item.isDirectory;
    const icon = isFolder ? 'folder-outline' : getFileIcon(item.name);
    const iconColor = isFolder ? colors.warning : getFileColor(item.name);
    return (
      <Pressable
        style={[styles.fileRow, { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border }]}
        onPress={() => scanner.toggleSelect(item.uri)}
      >
        <View style={[styles.fileIcon, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.fileMeta, { color: colors.mutedForeground }]} numberOfLines={2}>
            {isFolder ? item.path : `${formatRelativeDate(item.modificationTime ?? Date.now())} • ${item.path}`}
          </Text>
        </View>
        <View style={styles.fileRight}>
          <Text style={[styles.fileSize, { color: colors.foreground }]}>{isFolder ? t('emptyFolders') : formatBytes(item.size)}</Text>
          <View style={[styles.checkbox, { backgroundColor: selected ? colors.primary : 'transparent', borderColor: selected ? colors.primary : colors.border }]}>
            {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
        </View>
      </Pressable>
    );
  }

  const hasFiles = visibleFiles.length > 0;
  const scanErrorText = scanner.errorCode === 'permission-denied' ? t('permDenied') : t('errorScan');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{t(titleKey)}</Text>
        <Pressable onPress={() => scanner.reset()} style={styles.backBtn} accessibilityLabel={t('rescanBtn')}>
          <Ionicons name="refresh-outline" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {filter === 'large' && (
        <FlatList
          horizontal
          data={LARGE_FILTERS}
          keyExtractor={(item) => item.label}
          contentContainerStyle={styles.filters}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Pressable
              style={[styles.filterChip, { backgroundColor: largeFilter === index ? colors.primary : colors.card, borderColor: largeFilter === index ? colors.primary : colors.border }]}
              onPress={() => setLargeFilter(index)}
            >
              <Text style={[styles.filterText, { color: largeFilter === index ? '#fff' : colors.foreground }]}>{item.label}</Text>
            </Pressable>
          )}
        />
      )}
      {filter === 'downloads' && (
        <FlatList
          horizontal
          data={DOWNLOAD_FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filters}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, { backgroundColor: downloadFilter === item.key ? colors.primary : colors.card, borderColor: downloadFilter === item.key ? colors.primary : colors.border }]}
              onPress={() => setDownloadFilter(item.key)}
            >
              <Text style={[styles.filterText, { color: downloadFilter === item.key ? '#fff' : colors.foreground }]}>{t(item.labelKey)}</Text>
            </Pressable>
          )}
        />
      )}

      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <MaterialCommunityIcons name={mode === 'empty-folders' ? 'folder-remove' : mode === 'apk' ? 'android' : 'file-search-outline'} size={44} color="rgba(255,255,255,0.4)" />
        <View>
          <Text style={styles.bannerCount}>{visibleFiles.length}</Text>
          <Text style={styles.bannerLabel}>{t(emptyKey)}</Text>
        </View>
      </LinearGradient>

      {scanner.result?.mediaAccess === 'limited' && (
        <Text style={[styles.limitedAccessNote, { color: colors.warning }]}>
          {t('limitedMediaNotice')}
        </Text>
      )}

      {scanner.error ? (
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={54} color={colors.warning} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>{t('permTitle')}</Text>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{scanErrorText}</Text>
          <Pressable style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={() => scanner.reset()}>
            <Text style={styles.retryText}>{t('rescanBtn')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleFiles}
          keyExtractor={(item) => item.uri}
          contentContainerStyle={styles.list}
          renderItem={renderFile}
          ListEmptyComponent={
            scanner.state === 'scanning' ? (
              <View style={styles.center}><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t('scanning')}</Text></View>
            ) : (
              <View style={styles.center}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                <Text style={[styles.emptyText, { color: colors.foreground }]}>{t(emptyKey)}</Text>
                <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>{t('noFilesDesc')}</Text>
              </View>
            )
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {hasFiles && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable style={[styles.deleteBtn, { opacity: selectedFiles.length === 0 || scanner.state === 'cleaning' ? 0.5 : 1 }]} onPress={handleDelete} disabled={selectedFiles.length === 0 || scanner.state === 'cleaning'}>
            <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.deleteBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.deleteBtnText}>{t('deleteSelected').toUpperCase()} {formatBytes(selectedSize)}</Text>
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
  filters: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  banner: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerCount: { color: '#fff', fontSize: 30, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  limitedAccessNote: { marginHorizontal: 20, marginBottom: 8, fontSize: 12, lineHeight: 17 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  fileRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 10, marginBottom: 8 },
  fileIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1, gap: 4 },
  fileName: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  fileMeta: { fontSize: 11 },
  fileRight: { alignItems: 'flex-end', gap: 6 },
  fileSize: { fontSize: 12, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 48 },
  emptyText: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptyDescription: { fontSize: 13, textAlign: 'center' },
  errorTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryButton: { borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  retryText: { color: '#fff', fontWeight: '700' },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  deleteBtn: { borderRadius: 14, overflow: 'hidden' },
  deleteBtnInner: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  deleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: 'Inter_700Bold' },
});