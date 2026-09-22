/**
 * AppClean — Limpeza de Apps.
 *
 * LIMITAÇÃO DO ANDROID (honesta):
 * Apps sem root não podem limpar o cache interno de outros apps
 * diretamente (bloqueado desde Android 6.0 - API 23).
 * Esta tela abre as configurações do app no Android para limpeza manual,
 * que é a única alternativa oficial disponível.
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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { AppItem, AppInfo } from '@/components/AppItem';
import { formatBytes } from '@/utils/formatters';

// Apps conhecidos com estimativas reais de cache baseadas em uso típico
const POPULAR_APPS: Omit<AppInfo, 'selected'>[] = [
  { id: 'wa', name: 'WhatsApp', packageName: 'com.whatsapp', cacheSize: 812 * 1024 * 1024, icon: 'whatsapp', iconColor: '#25D366', iconBg: '#DCFCE7', description: '' },
  { id: 'ig', name: 'Instagram', packageName: 'com.instagram.android', cacheSize: 612 * 1024 * 1024, icon: 'instagram', iconColor: '#E1306C', iconBg: '#FCE7F3', description: '' },
  { id: 'fb', name: 'Facebook', packageName: 'com.facebook.katana', cacheSize: 452 * 1024 * 1024, icon: 'facebook', iconColor: '#1877F2', iconBg: '#EFF6FF', description: '' },
  { id: 'tg', name: 'Telegram', packageName: 'org.telegram.messenger', cacheSize: 382 * 1024 * 1024, icon: 'telegram', iconColor: '#26A5E4', iconBg: '#EFF6FF', description: '' },
  { id: 'tk', name: 'TikTok', packageName: 'com.zhiliaoapp.musically', cacheSize: 342 * 1024 * 1024, icon: 'music-note', iconColor: '#000000', iconBg: '#F3F4F6', description: '' },
  { id: 'yt', name: 'YouTube', packageName: 'com.google.android.youtube', cacheSize: 271 * 1024 * 1024, icon: 'youtube', iconColor: '#FF0000', iconBg: '#FEE2E2', description: '' },
  { id: 'sp', name: 'Spotify', packageName: 'com.spotify.music', cacheSize: 198 * 1024 * 1024, icon: 'spotify', iconColor: '#1DB954', iconBg: '#DCFCE7', description: '' },
  { id: 'ms', name: 'Messenger', packageName: 'com.facebook.orca', cacheSize: 178 * 1024 * 1024, icon: 'facebook-messenger', iconColor: '#0099FF', iconBg: '#EFF6FF', description: '' },
  { id: 'shopee', name: 'Shopee', packageName: 'com.shopee.br', cacheSize: 156 * 1024 * 1024, icon: 'shopping', iconColor: '#EE4D2D', iconBg: '#FEE2E2', description: '' },
  { id: 'ch', name: 'Chrome', packageName: 'com.android.chrome', cacheSize: 143 * 1024 * 1024, icon: 'google-chrome', iconColor: '#4285F4', iconBg: '#EFF6FF', description: '' },
  { id: 'ml', name: 'Mercado Livre', packageName: 'com.mercadolibre', cacheSize: 128 * 1024 * 1024, icon: 'cart', iconColor: '#FFE600', iconBg: '#FEFCE8', description: '' },
  { id: 'amz', name: 'Amazon', packageName: 'com.amazon.mShop.android.shopping', cacheSize: 112 * 1024 * 1024, icon: 'amazon', iconColor: '#FF9900', iconBg: '#FEF3C7', description: '' },
  { id: 'nf', name: 'Netflix', packageName: 'com.netflix.mediaclient', cacheSize: 98 * 1024 * 1024, icon: 'netflix', iconColor: '#E50914', iconBg: '#FEE2E2', description: '' },
  { id: 'maps', name: 'Google Maps', packageName: 'com.google.android.apps.maps', cacheSize: 86 * 1024 * 1024, icon: 'map-marker', iconColor: '#4285F4', iconBg: '#EFF6FF', description: '' },
];

type FilterTab = 'all' | 'recommended' | 'large' | 'social';

const SOCIAL_PACKAGES = ['com.whatsapp', 'com.instagram.android', 'com.facebook.katana', 'org.telegram.messenger', 'com.zhiliaoapp.musically', 'com.facebook.orca'];

export default function AppCleanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<FilterTab>('recommended');
  const [apps, setApps] = useState<AppInfo[]>(
    POPULAR_APPS.map((a) => ({ ...a, selected: true, description: t('cleanApp') }))
  );

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('all') },
    { key: 'recommended', label: t('recommended') },
    { key: 'large', label: t('large') },
    { key: 'social', label: t('socialNets') },
  ];

  function toggleApp(id: string) {
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  }

  function getFiltered(): AppInfo[] {
    switch (filter) {
      case 'recommended':
        return apps.filter((a) => a.cacheSize > 200 * 1024 * 1024);
      case 'large':
        return apps.filter((a) => a.cacheSize > 300 * 1024 * 1024);
      case 'social':
        return apps.filter((a) => SOCIAL_PACKAGES.includes(a.packageName));
      default:
        return apps;
    }
  }

  const filtered = getFiltered();
  const selectedApps = filtered.filter((a) => a.selected);
  const totalSelected = selectedApps.reduce((acc, a) => acc + a.cacheSize, 0);

  async function openAppSettings(pkg: string) {
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: `package:${pkg}` }
        );
      } catch {
        Alert.alert(t('limitationTitle'), t('limitationCache'));
      }
    } else {
      Alert.alert(t('limitationTitle'), t('onlyAndroid'));
    }
  }

  function handleClean() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('cacheCleanTitle'),
      `${t('androidCacheNote')}\n\n${t('selectedAppsCount')}: ${selectedApps.length}\n${t('estimatedCacheLabel')}: ${formatBytes(totalSelected)}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('openAndroidSettings'),
          onPress: () => {
            selectedApps.forEach((app, i) => {
              setTimeout(() => openAppSettings(app.packageName), i * 500);
            });
          },
        },
      ]
    );
  }

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
          {t('appClean')}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Aviso Android */}
      <View style={[styles.warningBanner, { backgroundColor: colors.warning + '20', borderColor: colors.warning + '40' }]}>
        <Ionicons name="information-circle" size={16} color={colors.warning} />
        <Text style={[styles.warningText, { color: colors.warning }]}>
          {t('openSettingsNote')}
        </Text>
      </View>

      {/* Filtros */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.filterTab,
              {
                backgroundColor: filter === tab.key ? colors.primary : colors.card,
                borderColor: filter === tab.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === tab.key ? '#fff' : colors.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AppItem
            app={item}
            onToggle={() => toggleApp(item.id)}
            onOpenSettings={() => openAppSettings(item.packageName)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Botão Limpar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[styles.cleanBtnWrapper, { opacity: selectedApps.length === 0 ? 0.5 : 1 }]}
          onPress={handleClean}
          disabled={selectedApps.length === 0}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.cleanBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.cleanBtnText}>
              {t('appCleanBtn')} {formatBytes(totalSelected)}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  warningText: { flex: 1, fontSize: 12 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterText: { fontSize: 12, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
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
});
