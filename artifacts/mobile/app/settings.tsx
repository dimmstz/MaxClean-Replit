/**
 * Settings — Configurações completas do MaxClean.
 */
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useCleanHistory } from '@/context/CleanHistoryContext';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { clearHistory } = useCleanHistory();

  function confirmReset() {
    Alert.alert(t('resetSettings'), t('resetSettings') + '?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('confirm'), style: 'destructive', onPress: resetSettings },
    ]);
  }

  function confirmClearHistory() {
    Alert.alert(t('clearHistory'), t('clearHistory') + '?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('cleanBtn'), style: 'destructive', onPress: clearHistory },
    ]);
  }

  function cycleLanguage() {
    const langs = ['pt', 'en', 'es'] as const;
    const idx = langs.indexOf(language);
    setLanguage(langs[(idx + 1) % langs.length]);
  }

  const langLabel = { pt: 'Português', en: 'English', es: 'Español' }[language];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('settings')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Aparência */}
        <Section title={t('appearance')} colors={colors}>
          <Row icon="moon" label={t('darkMode')} colors={colors} right={
            <Switch value={isDark} onValueChange={toggleTheme} thumbColor={isDark ? colors.primary : '#fff'} trackColor={{ false: colors.border, true: colors.primary + '80' }} />
          } />
          <Div colors={colors} />
          <Row icon="language" label={t('language')} colors={colors} value={langLabel} onPress={cycleLanguage} showChevron />
        </Section>

        {/* Limpeza Automática */}
        <Section title={t('autoClean')} colors={colors}>
          {(['off', 'daily', 'weekly', 'monthly'] as const).map((schedule, i, arr) => (
            <React.Fragment key={schedule}>
              <Pressable style={styles.radioRow} onPress={() => updateSettings({ autoCleanSchedule: schedule })}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.radioLabel, { color: colors.foreground }]}>
                  {{ off: t('disabled'), daily: t('daily'), weekly: t('weekly'), monthly: t('monthly') }[schedule]}
                </Text>
                <View style={[styles.radio, {
                  borderColor: settings.autoCleanSchedule === schedule ? colors.primary : colors.border,
                  backgroundColor: settings.autoCleanSchedule === schedule ? colors.primary : 'transparent',
                }]}>
                  {settings.autoCleanSchedule === schedule && <View style={styles.radioInner} />}
                </View>
              </Pressable>
              {i < arr.length - 1 && <Div colors={colors} />}
            </React.Fragment>
          ))}
        </Section>

        {/* Lixeira */}
        <Section title={t('smartTrash')} colors={colors}>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {t('trashDays')}:
          </Text>
          {([7, 15, 30] as const).map((days, i, arr) => (
            <React.Fragment key={days}>
              <Pressable style={styles.radioRow} onPress={() => updateSettings({ trashRetentionDays: days })}>
                <Ionicons name="trash-outline" size={20} color={colors.primary} />
                <Text style={[styles.radioLabel, { color: colors.foreground }]}>{days} dias</Text>
                <View style={[styles.radio, {
                  borderColor: settings.trashRetentionDays === days ? colors.primary : colors.border,
                  backgroundColor: settings.trashRetentionDays === days ? colors.primary : 'transparent',
                }]}>
                  {settings.trashRetentionDays === days && <View style={styles.radioInner} />}
                </View>
              </Pressable>
              {i < arr.length - 1 && <Div colors={colors} />}
            </React.Fragment>
          ))}
        </Section>

        {/* Avançado */}
        <Section title={t('advanced')} colors={colors}>
          <Row icon="notifications-outline" label={t('notifications')} colors={colors} right={
            <Switch value={settings.notificationsEnabled} onValueChange={(v) => updateSettings({ notificationsEnabled: v })} thumbColor={settings.notificationsEnabled ? colors.primary : '#fff'} trackColor={{ false: colors.border, true: colors.primary + '80' }} />
          } />
          <Div colors={colors} />
          <Row icon="shield-checkmark-outline" label={t('safeDelete')} colors={colors} right={
            <Switch value={settings.safeDelete} onValueChange={(v) => updateSettings({ safeDelete: v })} thumbColor={settings.safeDelete ? colors.primary : '#fff'} trackColor={{ false: colors.border, true: colors.primary + '80' }} />
          } />
          <Div colors={colors} />
          <Row icon="scan-outline" label={t('scanNow')} colors={colors} right={
            <Switch value={settings.scanOnOpen} onValueChange={(v) => updateSettings({ scanOnOpen: v })} thumbColor={settings.scanOnOpen ? colors.primary : '#fff'} trackColor={{ false: colors.border, true: colors.primary + '80' }} />
          } />
        </Section>

        {/* Dados */}
        <Section title={t('data')} colors={colors}>
          <Row icon="trash-outline" label={t('clearHistory')} colors={colors} danger onPress={confirmClearHistory} showChevron />
          <Div colors={colors} />
          <Row icon="refresh-outline" label={t('resetSettings')} colors={colors} danger onPress={confirmReset} showChevron />
        </Section>

        {/* Sobre */}
        <Section title={t('about')} colors={colors}>
          <Row icon="information-circle-outline" label={t('version')} colors={colors} value="1.0.0" />
          <Div colors={colors} />
          <Row icon="shield-outline" label={t('privacy')} colors={colors} showChevron onPress={() => {}} />
          <Div colors={colors} />
          <Row icon="document-text-outline" label={t('terms')} colors={colors} showChevron onPress={() => {}} />
        </Section>

        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          MaxClean v1.0.0{'\n'}
          Todos os dados ficam armazenados no seu dispositivo.{'\n'}
          Nunca coletamos ou enviamos dados pessoais.
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

function Row({ icon, label, value, colors, right, showChevron, danger, onPress }: any) {
  const content = (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={danger ? colors.destructive : colors.primary} />
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
        {right ?? null}
        {showChevron ? <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} /> : null}
      </View>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

function Div({ colors }: { colors: any }) {
  return <View style={[styles.div, { backgroundColor: colors.border }]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  content: { padding: 16, gap: 16 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  sectionCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 14 },
  div: { height: StyleSheet.hairlineWidth, marginLeft: 48 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  radioLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  hint: { fontSize: 12, paddingHorizontal: 16, paddingTop: 12 },
  footer: { fontSize: 12, textAlign: 'center', lineHeight: 20 },
});
