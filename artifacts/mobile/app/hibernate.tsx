/**
 * Hibernate — Hibernar Apps em segundo plano.
 *
 * LIMITAÇÃO DO ANDROID: Forçar parada de outros apps requer permissão
 * FORCE_STOP_PACKAGES que só é concedida a apps do sistema.
 * Esta tela abre as configurações de cada app para parada manual,
 * que é a alternativa oficial disponível.
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
import * as IntentLauncher from 'expo-intent-launcher';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { CircularProgress } from '@/components/CircularProgress';
import { formatBytes } from '@/utils/formatters';

interface BackgroundApp {
  id: string;
  name: string;
  packageName: string;
  icon: string;
  iconColor: string;
  ramUsage: number;
  reasonKey: string;
  selected: boolean;
}

const BACKGROUND_APPS_DATA: Omit<BackgroundApp, 'selected'>[] = [
  { id: 'amz', name: 'Amazon Shopping', packageName: 'com.amazon.mShop.android.shopping', icon: 'amazon', iconColor: '#FF9900', ramUsage: 41 * 1024 * 1024, reasonKey: 'highCpu' },
  { id: 'shopee', name: 'Shopee', packageName: 'com.shopee.br', icon: 'shopping', iconColor: '#EE4D2D', ramUsage: 32 * 1024 * 1024, reasonKey: 'highRam' },
  { id: 'ml', name: 'Mercado Livre', packageName: 'com.mercadolibre', icon: 'cart', iconColor: '#FFE600', ramUsage: 28 * 1024 * 1024, reasonKey: 'runningBg' },
  { id: 'tk', name: 'TikTok', packageName: 'com.zhiliaoapp.musically', icon: 'music-note', iconColor: '#000', ramUsage: 24 * 1024 * 1024, reasonKey: 'highBattery' },
  { id: 'fb', name: 'Facebook', packageName: 'com.facebook.katana', icon: 'facebook', iconColor: '#1877F2', ramUsage: 21 * 1024 * 1024, reasonKey: 'runningBg' },
  { id: 'ig', name: 'Instagram', packageName: 'com.instagram.android', icon: 'instagram', iconColor: '#E1306C', ramUsage: 19 * 1024 * 1024, reasonKey: 'runningBg' },
  { id: 'sp', name: 'Spotify', packageName: 'com.spotify.music', icon: 'spotify', iconColor: '#1DB954', ramUsage: 18 * 1024 * 1024, reasonKey: 'runningBg' },
  { id: 'ms', name: 'Messenger', packageName: 'com.facebook.orca', icon: 'facebook-messenger', iconColor: '#0099FF', ramUsage: 15 * 1024 * 1024, reasonKey: 'highRam' },
];

export default function HibernateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const [apps, setApps] = useState<BackgroundApp[]>(
    BACKGROUND_APPS_DATA.map((a) => ({ ...a, selected: true }))
  );

  const selected = apps.filter((a) => a.selected);
  const totalRam = selected.reduce((acc, a) => acc + a.ramUsage, 0);
  const totalRamAll = apps.reduce((acc, a) => acc + a.ramUsage, 0);

  function toggle(id: string) {
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  }

  async function openAppSettings(pkg: string) {
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: `package:${pkg}` }
        );
      } catch {
        Alert.alert(t('limitationTitle'), t('limitationSystem'));
      }
    } else {
      Alert.alert(t('limitationTitle'), t('onlyAndroid'));
    }
  }

  function handleHibernate() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      t('hibernate'),
      `${t('hibernateLimitNote')}\n\n${t('selectedAppsCount')}: ${selected.length}\n${t('ramToFree')}: ${formatBytes(totalRam)}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('openAndroidSettings'),
          onPress: () => {
            selected.forEach((app, i) => {
              setTimeout(() => openAppSettings(app.packageName), i * 600);
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
          {t('hibernate')}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* RAM Card */}
      <View style={[styles.ramCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CircularProgress
          progress={totalRamAll / (4 * 1024 * 1024 * 1024)}
          size={120}
          strokeWidth={10}
          gradientId="hibRam"
          duration={1000}
        >
          <View style={styles.ramCenter}>
            <Text style={[styles.ramLabel, { color: colors.mutedForeground }]}>{t('ram')}</Text>
            <Text style={[styles.ramValue, { color: colors.foreground }]}>
              {formatBytes(totalRamAll)}
            </Text>
          </View>
        </CircularProgress>

        <View style={styles.ramStats}>
          <View>
            <Text style={[styles.statTitle, { color: colors.foreground }]}>
              {t('ramToFree')}: {formatBytes(totalRam)}
            </Text>
            <Text style={[styles.statSub, { color: colors.mutedForeground }]}>
              {apps.length} {t('appsInBackground')} ({selected.length} {t('selectedLabel')})
            </Text>
          </View>
          <View style={[styles.infoBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
            <Ionicons name="information-circle" size={13} color={colors.warning} />
            <Text style={[styles.infoText, { color: colors.warning }]}>
              {t('openSettingsNote')}
            </Text>
          </View>
        </View>
      </View>

      {/* Lista de apps */}
      <FlatList
        data={apps}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.appRow,
              {
                backgroundColor: colors.card,
                borderColor: item.selected ? colors.primary : colors.border,
              },
            ]}
            onPress={() => toggle(item.id)}
            onLongPress={() => openAppSettings(item.packageName)}
          >
            <View style={[styles.appIcon, { backgroundColor: item.iconColor + '18' }]}>
              <MaterialCommunityIcons name={item.icon as any} size={26} color={item.iconColor} />
            </View>
            <View style={styles.appInfo}>
              <Text style={[styles.appName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.appReason, { color: colors.mutedForeground }]}>
                {t(item.reasonKey as any)}
              </Text>
            </View>
            <View style={styles.appRight}>
              <Text style={[styles.appRam, { color: colors.foreground }]}>{formatBytes(item.ramUsage)}</Text>
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: item.selected ? colors.primary : 'transparent',
                    borderColor: item.selected ? colors.primary : colors.border,
                  },
                ]}
              >
                {item.selected ? (
                  <MaterialCommunityIcons name="check" size={14} color="#fff" />
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Botão Hibernar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 16, backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Pressable
          style={[styles.hibernateBtn, { opacity: selected.length === 0 ? 0.5 : 1 }]}
          onPress={handleHibernate}
          disabled={selected.length === 0}
        >
          <LinearGradient
            colors={['#00B4D8', '#0077B6']}
            style={styles.hibernateBtnInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="snowflake" size={20} color="#fff" />
            <Text style={styles.hibernateBtnText}>
              {t('hibernateBtn')} {selected.length} ({formatBytes(totalRam)})
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

  ramCard: {
    margin: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ramCenter: { alignItems: 'center', gap: 2 },
  ramLabel: { fontSize: 10, fontWeight: '600' },
  ramValue: { fontSize: 16, fontWeight: '800', fontFamily: 'Inter_700Bold', textAlign: 'center' },
  ramStats: { flex: 1, gap: 8 },
  statTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  statSub: { fontSize: 12, lineHeight: 18 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  infoText: { fontSize: 11, flex: 1 },

  list: { paddingHorizontal: 16, paddingBottom: 16 },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 12,
    marginBottom: 8,
  },
  appIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  appInfo: { flex: 1, gap: 3 },
  appName: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  appReason: { fontSize: 12 },
  appRight: { alignItems: 'flex-end', gap: 6 },
  appRam: { fontSize: 13, fontWeight: '600' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hibernateBtn: { borderRadius: 14, overflow: 'hidden' },
  hibernateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  hibernateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
});
