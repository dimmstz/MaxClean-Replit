/**
 * Clean — Tela de Limpeza Inteligente.
 * Exibe itens encontrados, permite selecionar e deletar com confirmação.
 */
import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useFileScanner } from '@/hooks/useFileScanner';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { useLanguage } from '@/context/LanguageContext';
import { FileItem } from '@/components/FileItem';
import { ScanOverlay } from '@/components/ScanOverlay';
import { CleanResultCard } from '@/components/CleanResultCard';
import { formatBytes } from '@/utils/formatters';

export default function CleanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const scanner = useFileScanner();
  const { addRecord } = useCleanHistory();
  const [cleanStart, setCleanStart] = useState(0);

  // A tela tem seu próprio ciclo de vida; o scanner da Home não é compartilhado
  // entre rotas. Iniciar aqui evita uma tela vazia ao navegar pela Limpeza Rápida.
  useEffect(() => {
    if (scanner.state === 'idle') {
      void scanner.startScan();
    }
  }, [scanner.startScan, scanner.state]);

  // Maps file category keys to translated labels using strings.ts keys
  function getCategoryName(cat: string): string {
    const map: Record<string, string> = {
      cache: t('junkCache'),
      temp: t('tempFiles'),
      log: t('oldLogs'),
      apk: t('oldApks'),
      zip: t('zipFiles'),
      large: t('largeFiles'),
      empty_folder: t('emptyFolders'),
      download: t('uselessDownloads'),
      residual: t('appResiduals'),
      thumbnail: t('thumbnails'),
      other: t('others'),
    };
    return map[cat] ?? cat;
  }

  async function handleClean() {
    if (!scanner.result || scanner.selectedUris.size === 0) return;

    // ⚠️ Capturar valores ANTES de executeClean — ele zera selectedUris e selectedSize
    const sizeToFree = scanner.selectedSize;
    const fileCount = scanner.selectedUris.size;
    const selectedCategories = Array.from(scanner.selectedUris)
      .map((uri) => scanner.result?.files.find((file) => file.uri === uri)?.category)
      .filter((category) => category !== undefined);

    Alert.alert(
      t('cleanConfirm'),
      `${t('itemsSelected').replace('arquivo(s)', String(fileCount))}\n\n${t('spaceToFree')}: ${formatBytes(sizeToFree)}\n\n${t('cannotUndo')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('cleanBtn'),
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const start = Date.now();
            setCleanStart(start);
            await scanner.executeClean();
            addRecord({
              date: Date.now(),
              type: 'smart',
              spaceFreed: sizeToFree,        // valor capturado antes do reset
              filesRemoved: fileCount,        // valor capturado antes do reset
              durationMs: Date.now() - start,
              items: [...new Set(selectedCategories)].map((category) => getCategoryName(category)),
            });
          },
        },
      ]
    );
  }

  const allSelected =
    scanner.result && scanner.selectedUris.size === scanner.result.files.length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('smartClean')}
        </Text>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Scanning */}
      {scanner.state === 'scanning' && (
        <View style={styles.center}>
          <ScanOverlay message={scanner.progress.current} percent={scanner.progress.percent} />
        </View>
      )}

      {/* Resultado limpo */}
      {scanner.state === 'cleaned' && (
        <View style={styles.center}>
          <CleanResultCard
            spaceFreed={scanner.cleanedBytes}
            filesRemoved={scanner.cleanedCount}
            durationMs={Date.now() - cleanStart}
          />
          <Pressable
            style={[styles.rescanBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => { scanner.reset(); scanner.startScan(); }}
          >
            <Text style={[styles.rescanText, { color: colors.primary }]}>
              {t('rescanBtn')}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Lista de arquivos */}
      {(scanner.state === 'done' || scanner.state === 'cleaning') && scanner.result && (
        <>
          {/* Totais */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.totalBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View>
                <Text style={styles.totalLabel}>{t('totalFound')}</Text>
                <Text style={styles.totalValue}>
                  {formatBytes(scanner.result.totalSize)}
                </Text>
              </View>
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedText}>
                  {t('selected')}: {formatBytes(scanner.selectedSize)}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <FlatList
            data={scanner.result.files}
            keyExtractor={(item) => item.uri}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <FileItem
                file={item}
                selected={scanner.selectedUris.has(item.uri)}
                onToggle={() => scanner.toggleSelect(item.uri)}
              />
            )}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.listHeaderTitle, { color: colors.foreground }]}>
                  {t('allItems')}
                </Text>
                <Pressable onPress={scanner.toggleSelectAll}>
                  <Text style={[styles.selectAll, { color: colors.primary }]}>
                    {allSelected ? t('deselectAll') : t('selectAll')}
                  </Text>
                </Pressable>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {t('noFiles')}
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  {t('noFilesDesc')}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
          />

          {/* Botão Limpar */}
          {scanner.result.files.length > 0 && (
            <View
              style={[
                styles.bottomBar,
                { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border },
              ]}
            >
              <Pressable
                style={[
                  styles.cleanBtnWrapper,
                  { opacity: scanner.selectedUris.size === 0 ? 0.5 : 1 },
                ]}
                onPress={handleClean}
                disabled={scanner.selectedUris.size === 0 || scanner.state === 'cleaning'}
              >
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.cleanBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.cleanBtnText}>
                    {scanner.state === 'cleaning'
                      ? t('cleaning')
                      : `${t('cleanBtn')} ${formatBytes(scanner.selectedSize)}`}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* Estado inicial */}
      {scanner.state === 'idle' && (
        <View style={styles.center}>
          {scanner.error ? (
            <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
              <Ionicons name="alert-circle-outline" size={42} color={colors.destructive} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t('errorScan')}</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>{t('permDenied')}</Text>
            </View>
          ) : null}
          <Pressable
            style={[styles.scanStartBtn, { backgroundColor: colors.primary }]}
            onPress={() => void scanner.startScan()}
          >
            <Text style={styles.scanStartText}>{t('scanNow')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  settingsBtn: { padding: 4 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },

  totalBanner: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  totalValue: { color: '#fff', fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  selectedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 16 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listHeaderTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  selectAll: { fontSize: 13, fontWeight: '600' },

  emptyState: { alignItems: 'center', gap: 12, paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  emptySub: { fontSize: 14 },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cleanBtnWrapper: { borderRadius: 14, overflow: 'hidden' },
  cleanBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  cleanBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },

  rescanBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
  },
  rescanText: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },

  scanStartBtn: {
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  scanStartText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  errorCard: {
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
});
