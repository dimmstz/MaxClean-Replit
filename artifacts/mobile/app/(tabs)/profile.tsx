/**
 * Profile — Tela de perfil e configurações rápidas.
 */
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';
import { formatBytes } from '@/utils/formatters';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { stats, clearHistory } = useCleanHistory();
  const device = useDeviceInfo();

  function confirmClearHistory() {
    Alert.alert(
      t('clearHistory'),
      t('clearHistory') + '?',
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('cleanBtn'), style: 'destructive', onPress: clearHistory },
      ]
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(0).duration(500)}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('tabProfile')}</Text>
      </Animated.View>

      {/* Stats Card */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.statsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.statsTitle}>{t('appName')} — {t('history')}</Text>
          <View style={styles.statsRow}>
            <StatItem label={t('spaceFreed')} value={formatBytes(stats.totalSpaceFreed)} />
            <View style={styles.divider} />
            <StatItem label={t('history')} value={String(stats.totalSessions)} />
            <View style={styles.divider} />
            <StatItem label={t('filesRemoved')} value={String(stats.totalFilesRemoved)} />
          </View>

          {/* Device Info */}
          <View style={styles.deviceRow}>
            <Text style={styles.deviceInfo}>
              {t('storage')}: {formatBytes(device.storageFree)} {t('free').toLowerCase()} de {formatBytes(device.storageTotal)}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Aparência */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <SectionCard title={t('appearance')} colors={colors}>
          <SettingRow
            icon="moon"
            label={t('darkMode')}
            colors={colors}
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                thumbColor={isDark ? colors.primary : '#fff'}
                trackColor={{ false: colors.border, true: colors.primary + '80' }}
              />
            }
          />
          <SettingDivider colors={colors} />
          <SettingRow
            icon="language"
            label={t('language')}
            colors={colors}
            value={language === 'pt' ? 'Português' : language === 'en' ? 'English' : 'Español'}
            onPress={() => {
              const langs = ['pt', 'en', 'es'] as const;
              const idx = langs.indexOf(language);
              setLanguage(langs[(idx + 1) % langs.length]);
            }}
          />
        </SectionCard>
      </Animated.View>

      {/* Configurações completas */}
      <Animated.View entering={FadeInDown.delay(300).duration(500)}>
        <SectionCard title={t('settings')} colors={colors}>
          <SettingRow
            icon="settings-outline"
            label={t('settings')}
            colors={colors}
            onPress={() => router.push('/settings')}
            showChevron
          />
          <SettingDivider colors={colors} />
          <SettingRow
            icon="time-outline"
            label={t('history')}
            colors={colors}
            onPress={() => router.push('/history')}
            showChevron
          />
        </SectionCard>
      </Animated.View>

      {/* Sobre */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)}>
        <SectionCard title={t('about')} colors={colors}>
          <SettingRow
            icon="information-circle-outline"
            label={t('version')}
            colors={colors}
            value="1.0.0"
          />
          <SettingDivider colors={colors} />
          <SettingRow
            icon="shield-checkmark-outline"
            label={t('privacy')}
            colors={colors}
            showChevron
            onPress={() => {}}
          />
          <SettingDivider colors={colors} />
          <SettingRow
            icon="star-outline"
            label={t('rate')}
            colors={colors}
            showChevron
            onPress={() => {}}
          />
        </SectionCard>
      </Animated.View>

      {/* Danger zone */}
      <Animated.View entering={FadeInDown.delay(500).duration(500)}>
        <SectionCard title={t('items')} colors={colors}>
          <SettingRow
            icon="trash-outline"
            label={t('clearHistory')}
            colors={colors}
            danger
            onPress={confirmClearHistory}
          />
        </SectionCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(600).duration(500)}>
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          MaxClean v1.0.0 — Feito com amor{'\n'}
          Todos os dados ficam no seu dispositivo
        </Text>
      </Animated.View>
    </ScrollView>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

function SectionCard({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  colors,
  right,
  showChevron,
  danger,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  colors: any;
  right?: React.ReactNode;
  showChevron?: boolean;
  danger?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.settingRow}>
      <Ionicons
        name={icon as any}
        size={20}
        color={danger ? colors.destructive : colors.primary}
      />
      <Text style={[styles.settingLabel, { color: danger ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value ? (
          <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>
        ) : null}
        {right ?? null}
        {showChevron ? (
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        ) : null}
      </View>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

function SettingDivider({ colors }: { colors: any }) {
  return (
    <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  title: { fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold' },

  statsCard: {
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  statsTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statVal: { color: '#fff', fontSize: 20, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  statLbl: { color: 'rgba(255,255,255,0.75)', fontSize: 11, textAlign: 'center' },
  divider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },
  deviceRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 10 },
  deviceInfo: { color: 'rgba(255,255,255,0.8)', fontSize: 12, textAlign: 'center' },

  sectionTitle: { fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 6 },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14 },
  settingDivider: { height: StyleSheet.hairlineWidth, marginLeft: 48 },

  footer: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
