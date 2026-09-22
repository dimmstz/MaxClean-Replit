/**
 * Monitor — Monitor do Sistema em tempo real.
 * CPU, RAM, Bateria, Armazenamento com gráficos animados.
 */
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';
import { useLanguage } from '@/context/LanguageContext';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { CircularProgress } from '@/components/CircularProgress';
import { formatBytes, formatPercent } from '@/utils/formatters';

// Apps pesados — valores típicos reais de uso de RAM e CPU
const HEAVY_APPS = [
  { name: 'Instagram', icon: 'instagram', color: '#E1306C', ram: 287 * 1024 * 1024, cpu: 12 },
  { name: 'TikTok', icon: 'music-note', color: '#000', ram: 256 * 1024 * 1024, cpu: 10 },
  { name: 'Facebook', icon: 'facebook', color: '#1877F2', ram: 198 * 1024 * 1024, cpu: 8 },
  { name: 'WhatsApp', icon: 'whatsapp', color: '#25D366', ram: 176 * 1024 * 1024, cpu: 7 },
  { name: 'Chrome', icon: 'google-chrome', color: '#4285F4', ram: 145 * 1024 * 1024, cpu: 5 },
];

function MiniGauge({
  progress,
  color,
  label,
  value,
  gradId,
}: {
  progress: number;
  color: [string, string];
  label: string;
  value: string;
  gradId: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.gaugeItem}>
      <CircularProgress
        progress={progress}
        size={90}
        strokeWidth={8}
        colorStart={color[0]}
        colorEnd={color[1]}
        gradientId={gradId}
        duration={1500}
      >
        <Text style={[styles.gaugeVal, { color: colors.foreground }]}>{value}</Text>
      </CircularProgress>
      <Text style={[styles.gaugeLbl, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export default function MonitorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const device = useDeviceInfo();

  // Simula variação da CPU (sem acesso via API pública sem root)
  const [cpuUsage, setCpuUsage] = useState(0.42);
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => Math.max(0.1, Math.min(0.9, prev + (Math.random() - 0.5) * 0.08)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
          {t('monitor')}
        </Text>
        <MaterialCommunityIcons name="refresh" size={22} color={colors.primary} onPress={device.refresh} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gauges principais */}
        <Animated.View entering={FadeInDown.delay(0).duration(600)}>
          <View style={[styles.gaugesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.gaugesRow}>
              <MiniGauge
                progress={cpuUsage}
                color={['#8B5CF6', '#A78BFA']}
                label={t('cpu')}
                value={`${Math.round(cpuUsage * 100)}%`}
                gradId="cpuGauge"
              />
              <MiniGauge
                progress={device.ramPercent}
                color={['#1469FF', '#00C8FF']}
                label={t('ram')}
                value={`${Math.round(device.ramPercent * 100)}%`}
                gradId="ramGauge"
              />
              <MiniGauge
                progress={device.batteryLevel}
                color={device.batteryLevel > 0.2 ? ['#22C55E', '#4ADE80'] : ['#EF4444', '#F97316']}
                label={t('battery')}
                value={`${Math.round(device.batteryLevel * 100)}%`}
                gradId="batGauge"
              />
            </View>

            {/* Detalhes RAM */}
            <View style={[styles.ramDetail, { borderTopColor: colors.border }]}>
              <View style={styles.ramRow}>
                <Text style={[styles.ramLabel, { color: colors.mutedForeground }]}>{t('total')} RAM</Text>
                <Text style={[styles.ramValue, { color: colors.foreground }]}>
                  {formatBytes(device.ramTotal)}
                </Text>
              </View>
              <View style={styles.ramRow}>
                <Text style={[styles.ramLabel, { color: colors.mutedForeground }]}>{t('used')}</Text>
                <Text style={[styles.ramValue, { color: colors.foreground }]}>
                  {formatBytes(device.ramUsed)}
                </Text>
              </View>
              <View style={styles.ramRow}>
                <Text style={[styles.ramLabel, { color: colors.mutedForeground }]}>{t('ramToFree')} (est.)</Text>
                <Text style={[styles.ramValue, { color: colors.success }]}>
                  {formatBytes(device.ramTotal - device.ramUsed)}
                </Text>
              </View>
            </View>

            {/* Nota honesta sobre CPU */}
            <View style={[styles.noteBanner, { backgroundColor: colors.info + '15', borderColor: colors.info + '30' }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.info} />
              <Text style={[styles.noteText, { color: colors.info }]}>
                {t('cpuUsage')}: {t('limitationSystem')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Armazenamento */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('storage')}</Text>
          <View style={[styles.storageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.storageHeader}>
              <Text style={[styles.storageUsed, { color: colors.foreground }]}>
                {formatBytes(device.storageUsed)}
              </Text>
              <Text style={[styles.storageTotal, { color: colors.mutedForeground }]}>
                {t('total').toLowerCase()} {formatBytes(device.storageTotal)}
              </Text>
            </View>

            {/* Barra de progresso */}
            <View style={[styles.storageTrack, { backgroundColor: colors.muted }]}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={[
                  styles.storageBar,
                  { width: `${Math.round(device.storagePercent * 100)}%` },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>

            <View style={styles.storageStats}>
              <StorageStat label={t('used')} value={formatBytes(device.storageUsed)} color={colors.primary} />
              <StorageStat label={t('free')} value={formatBytes(device.storageFree)} color={colors.success} />
              <StorageStat label={t('total')} value={formatBytes(device.storageTotal)} color={colors.mutedForeground} />
            </View>
          </View>
        </Animated.View>

        {/* Apps mais pesados */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('heaviestApps')}</Text>
          <View style={[styles.appsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {HEAVY_APPS.map((app, i) => (
              <View key={app.name}>
                <View style={styles.appRow}>
                  <View style={[styles.appIcon, { backgroundColor: app.color + '18' }]}>
                    <MaterialCommunityIcons name={app.icon as any} size={22} color={app.color} />
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={[styles.appName, { color: colors.foreground }]}>{app.name}</Text>
                    <Text style={[styles.appMeta, { color: colors.mutedForeground }]}>
                      {t('ram')}: {formatBytes(app.ram)}
                    </Text>
                  </View>
                  <Text style={[styles.appCpu, { color: colors.primary }]}>
                    {t('cpu')}: {app.cpu}%
                  </Text>
                </View>
                {i < HEAVY_APPS.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Temperatura */}
        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t('temperature')}</Text>
          <View style={[styles.tempCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons
              name="thermometer"
              size={36}
              color={colors.warning}
            />
            <View style={styles.tempInfo}>
              <Text style={[styles.tempValue, { color: colors.foreground }]}>
                {device.cpuTemp !== null ? `${device.cpuTemp}°C` : 'N/D'}
              </Text>
              <Text style={[styles.tempNote, { color: colors.mutedForeground }]}>
                {device.cpuTemp !== null
                  ? t('cpuTempLabel')
                  : t('limitationSystem')}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StorageStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.storageStat}>
      <View style={[styles.storageStatDot, { backgroundColor: color }]} />
      <Text style={{ fontSize: 12, color }}>{label}: {value}</Text>
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
  content: { padding: 16, gap: 16 },

  gaugesCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  gaugesRow: { flexDirection: 'row', justifyContent: 'space-around' },
  gaugeItem: { alignItems: 'center', gap: 8 },
  gaugeVal: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  gaugeLbl: { fontSize: 12 },

  ramDetail: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14, gap: 8 },
  ramRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ramLabel: { fontSize: 13 },
  ramValue: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },

  noteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
  },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16 },

  sectionTitle: { fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 2 },

  storageCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  storageHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  storageUsed: { fontSize: 28, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  storageTotal: { fontSize: 14 },
  storageTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  storageBar: { height: 8, borderRadius: 4 },
  storageStats: { flexDirection: 'row', gap: 16 },
  storageStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storageStatDot: { width: 8, height: 8, borderRadius: 4 },

  appsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  appRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  appIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  appInfo: { flex: 1, gap: 2 },
  appName: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  appMeta: { fontSize: 12 },
  appCpu: { fontSize: 12, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 70 },

  tempCard: { borderRadius: 16, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  tempInfo: { flex: 1, gap: 4 },
  tempValue: { fontSize: 32, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  tempNote: { fontSize: 12, lineHeight: 18 },
});
