/**
 * Home — Tela principal do MaxClean.
 * Dashboard com circular gauge, stats reais e grade de ferramentas.
 */
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { useFileScanner } from '@/hooks/useFileScanner';
import { useLanguage } from '@/context/LanguageContext';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { useSettings } from '@/context/SettingsContext';
import { CircularProgress } from '@/components/CircularProgress';
import { StatCard } from '@/components/StatCard';
import { ToolCard } from '@/components/ToolCard';
import { formatBytes, formatRelativeDate } from '@/utils/formatters';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Ferramentas rápidas da home
const HOME_TOOLS = [
  { id: 'app-clean', labelKey: 'typeAppLabel', icon: 'cellphone', color: '#1469FF', bg: '#E8F0FF', route: '/app-clean' },
  { id: 'hibernate', labelKey: 'hibernate', icon: 'snowflake', color: '#00C8FF', bg: '#E0F9FF', route: '/hibernate' },
  { id: 'cpu', labelKey: 'monitor', icon: 'cpu-64-bit', color: '#8B5CF6', bg: '#EDE9FE', route: '/monitor' },
  { id: 'block', labelKey: 'blockSave', icon: 'shield-lock', color: '#EF4444', bg: '#FEE2E2', route: '/hibernate' },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { stats, history } = useCleanHistory();
  const { settings } = useSettings();
  const device = useDeviceInfo();
  const scanner = useFileScanner();

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  // Inicia scan automático ao abrir
  useEffect(() => {
    if (!settings.scanOnOpen || scanner.state !== 'idle') return;
    const timer = setTimeout(() => void scanner.startScan(), 800);
    return () => clearTimeout(timer);
  }, [scanner.startScan, scanner.state, settings.scanOnOpen]);

  const totalJunkBytes = scanner.result?.totalSize ?? 0;
  const junkGB = totalJunkBytes / (1024 * 1024 * 1024);
  const gaugeProgress = Math.min(1, junkGB / 2); // satura em 2 GB

  // Subtitle do gauge
  const gaugeSubtitle =
    scanner.state === 'scanning'
      ? t('scanning')
      : scanner.state === 'cleaned'
      ? t('noFilesDesc')
      : t('scanComplete');

  const junkLabel =
    scanner.state === 'scanning'
      ? '...'
      : junkGB > 0
      ? junkGB.toFixed(2) + ' GB'
      : '0 MB';

  function handleQuickClean() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (scanner.state === 'idle') {
      scanner.startScan();
      return;
    }
    if (scanner.result && scanner.result.totalSize > 0) {
      router.push('/clean');
    } else {
      scanner.startScan();
    }
  }

  const lastScan = history.length > 0
    ? formatRelativeDate(history[0].date)
    : t('never');

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 90,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Animated.View
        entering={FadeInDown.delay(0).duration(500)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="broom" size={20} color="#fff" />
          </View>
          <Text style={[styles.logoText, { color: colors.foreground }]}>
            Max<Text style={{ color: colors.primary }}>Clean</Text>
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.headerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="settings-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </Animated.View>

      {/* ── Circular Gauge Card ── */}
      <Animated.View entering={FadeInDown.delay(100).duration(600)}>
        <View style={[styles.gaugeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CircularProgress
            progress={gaugeProgress}
            size={200}
            strokeWidth={14}
            gradientId="homeGauge"
          >
            <View style={styles.gaugeCenter}>
              <Text style={[styles.gaugeLabel, { color: colors.mutedForeground }]}>
                {t('junkFound')}
              </Text>
              <Text style={[styles.gaugeValue, { color: colors.foreground }]}>
                {junkLabel}
              </Text>
              <Text style={[styles.gaugeSub, { color: colors.mutedForeground }]}>
                {gaugeSubtitle}
              </Text>
            </View>
          </CircularProgress>

          {/* Último scan */}
          <Text style={[styles.lastScan, { color: colors.mutedForeground }]}>
            {t('lastScan')}: {lastScan}
          </Text>
        </View>
      </Animated.View>

      {/* ── Botão Limpeza Rápida ── */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <AnimatedPressable
          style={[styles.cleanBtnWrapper, btnStyle]}
          onPressIn={() => { btnScale.value = withSpring(0.96, { damping: 15 }); }}
          onPressOut={() => { btnScale.value = withSpring(1, { damping: 15 }); }}
          onPress={handleQuickClean}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cleanBtn}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={22} color="#fff" />
            <Text style={styles.cleanBtnText}>
              {scanner.state === 'scanning' ? t('scanning') : t('quickClean')}
            </Text>
          </LinearGradient>
        </AnimatedPressable>
      </Animated.View>

      {/* ── Stats Grid ── */}
      <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            label={t('storage')}
            value={`${Math.round(device.storagePercent * 100)}%`}
            subtitle={`${formatBytes(device.storageFree)} ${t('free')}`}
            icon="database"
            iconColor="#1469FF"
            progress={device.storagePercent}
            progressColor={[colors.gradientStart, colors.gradientEnd]}
          />
          <StatCard
            label={t('ram')}
            value={`${Math.round(device.ramPercent * 100)}%`}
            subtitle={`${formatBytes(device.ramUsed)} / ${formatBytes(device.ramTotal)}`}
            icon="memory"
            iconColor="#8B5CF6"
            progress={device.ramPercent}
            progressColor={['#8B5CF6', '#A78BFA']}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label={t('temperature')}
            value={device.cpuTemp !== null ? `${device.cpuTemp}°C` : 'N/D'}
            subtitle={t('cpuTempLabel')}
            icon="thermometer"
            iconColor="#F59E0B"
          />
          <StatCard
            label={t('battery')}
            value={`${Math.round(device.batteryLevel * 100)}%`}
            subtitle={device.batteryCharging ? t('chargeStatus') : t('remaining')}
            icon="battery"
            iconColor={device.batteryLevel > 0.2 ? '#22C55E' : '#EF4444'}
            progress={device.batteryLevel}
            progressColor={
              device.batteryLevel > 0.2 ? ['#22C55E', '#4ADE80'] : ['#EF4444', '#F97316']
            }
          />
        </View>
      </Animated.View>

      {/* ── Ferramentas Rápidas ── */}
      <Animated.View entering={FadeInDown.delay(400).duration(600)}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('tools')}
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/tools')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              {t('seeAll')}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.toolsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.toolsRow}>
            {HOME_TOOLS.map((tool) => (
              <ToolCard
                key={tool.id}
                icon={tool.icon}
                label={t(tool.labelKey)}
                color={tool.color}
                bgColor={tool.bg}
                onPress={() => router.push(tool.route as any)}
              />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* ── Stats Totais ── */}
      {stats.totalSessions > 0 && (
        <Animated.View entering={FadeInDown.delay(500).duration(600)}>
          <Pressable
            onPress={() => router.push('/history')}
            style={[styles.historyCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
          >
            <View style={styles.historyContent}>
              <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
              <View style={styles.historyInfo}>
                <Text style={[styles.historyTitle, { color: colors.foreground }]}>
                  {formatBytes(stats.totalSpaceFreed)} {t('released').toLowerCase()}
                </Text>
                <Text style={[styles.historyMeta, { color: colors.mutedForeground }]}>
                  {stats.totalSessions} {t('cleanups').toLowerCase()} • {stats.totalFilesRemoved} {t('filesLabel').toLowerCase()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </View>
          </Pressable>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gaugeCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  gaugeCenter: { alignItems: 'center', gap: 4 },
  gaugeLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  gaugeValue: { fontSize: 40, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  gaugeSub: { fontSize: 13, fontWeight: '500' },
  lastScan: { fontSize: 12 },

  cleanBtnWrapper: { borderRadius: 16, overflow: 'hidden' },
  cleanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  cleanBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },

  statsGrid: { gap: 10 },
  statsRow: { flexDirection: 'row', gap: 10 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  seeAll: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },

  toolsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  toolsRow: { flexDirection: 'row', gap: 8 },

  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  historyContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyInfo: { flex: 1, gap: 2 },
  historyTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  historyMeta: { fontSize: 12 },
});
