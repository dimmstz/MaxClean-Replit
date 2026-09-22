/**
 * Tools — Grade completa de ferramentas do MaxClean.
 */
import React from 'react';
import {
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/useColors';
import { ToolCard } from '@/components/ToolCard';

interface Tool {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
  route: string;
  badge?: string;
}

interface Section {
  title: string;
  data: Tool[][];
}

const TOOLS_SECTIONS: Section[] = [
  {
    title: 'Otimização',
    data: [
      [
        { id: 'smart-clean', label: 'Limpeza\nInteligente', icon: 'broom', color: '#1469FF', bg: '#E8F0FF', route: '/clean' },
        { id: 'app-clean', label: 'Limpeza\nde Apps', icon: 'cellphone', color: '#00C8FF', bg: '#E0F9FF', route: '/app-clean' },
        { id: 'hibernate', label: 'Hibernar\nApps', icon: 'snowflake', color: '#3B82F6', bg: '#EFF6FF', route: '/hibernate' },
        { id: 'block', label: 'Bloqueador\nde Apps', icon: 'shield-lock', color: '#EF4444', bg: '#FEE2E2', route: '/hibernate' },
      ],
      [
        { id: 'cpu', label: 'Reiniciar\nCPU', icon: 'cpu-64-bit', color: '#8B5CF6', bg: '#EDE9FE', route: '/monitor' },
        { id: 'battery', label: 'Economia\nde Bateria', icon: 'battery-charging', color: '#22C55E', bg: '#DCFCE7', route: '/monitor' },
        { id: 'turbo', label: 'Turbo\nBoost', icon: 'rocket-launch', color: '#F59E0B', bg: '#FEF3C7', route: '/clean' },
        { id: 'empty-folders', label: 'Pastas\nVazias', icon: 'folder-remove', color: '#6366F1', bg: '#EEF2FF', route: '/empty-folders' },
      ],
    ],
  },
  {
    title: 'Outros',
    data: [
      [
        { id: 'duplicates', label: 'Duplicados', icon: 'content-copy', color: '#F97316', bg: '#FFEDD5', route: '/duplicates' },
        { id: 'large-files', label: 'Arquivos\nGrandes', icon: 'file-search', color: '#14B8A6', bg: '#CCFBF1', route: '/large-files' },
        { id: 'screenshots', label: 'Screenshots\nAntigas', icon: 'image-remove', color: '#EC4899', bg: '#FCE7F3', route: '/large-files' },
        { id: 'clipboard', label: 'Limpar\nClipboard', icon: 'clipboard-remove', color: '#8B5CF6', bg: '#EDE9FE', route: '/clean' },
      ],
      [
        { id: 'history', label: 'Histórico\nde Limpezas', icon: 'history', color: '#64748B', bg: '#F1F5F9', route: '/history' },
        { id: 'schedule', label: 'Agendamento', icon: 'calendar-clock', color: '#1469FF', bg: '#E8F0FF', route: '/settings' },
        { id: 'widget', label: 'Widget\nFlutuante', icon: 'widgets', color: '#22C55E', bg: '#DCFCE7', route: '/settings' },
        { id: 'settings-tool', label: 'Configurações', icon: 'cog', color: '#6B7280', bg: '#F3F4F6', route: '/settings' },
      ],
    ],
  },
];

export default function ToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  function handleTool(route: string) {
    Haptics.selectionAsync();
    router.push(route as any);
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
      <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Ferramentas</Text>
        <Pressable
          onPress={() => router.push('/settings')}
          style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Ionicons name="settings-outline" size={20} color={colors.mutedForeground} />
        </Pressable>
      </Animated.View>

      {/* Monitor Sistema — destaque */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <Pressable
          style={[styles.monitorCard, { borderColor: colors.border }]}
          onPress={() => handleTool('/monitor')}
        >
          <View style={styles.monitorGrad}>
            <View style={styles.monitorLeft}>
              <Text style={styles.monitorTitle}>Monitor do Sistema</Text>
              <Text style={styles.monitorSub}>CPU • RAM • Bateria • Armazenamento</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
          </View>
        </Pressable>
      </Animated.View>

      {/* APK Scanner — destaque */}
      <Animated.View entering={FadeInDown.delay(150).duration(500)}>
        <Pressable
          style={[styles.apkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => handleTool('/apk-scanner')}
        >
          <View style={[styles.apkIcon, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="phone-portrait-outline" size={26} color="#3B82F6" />
          </View>
          <View style={styles.apkInfo}>
            <Text style={[styles.apkTitle, { color: colors.foreground }]}>
              Scanner de APK
            </Text>
            <Text style={[styles.apkSub, { color: colors.mutedForeground }]}>
              Encontre APKs inválidos, duplicados e antigos
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
      </Animated.View>

      {/* Downloads */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Pressable
          style={[styles.apkCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => handleTool('/downloads')}
        >
          <View style={[styles.apkIcon, { backgroundColor: '#F9731620' }]}>
            <Ionicons name="download-outline" size={26} color="#F97316" />
          </View>
          <View style={styles.apkInfo}>
            <Text style={[styles.apkTitle, { color: colors.foreground }]}>
              Scanner de Downloads
            </Text>
            <Text style={[styles.apkSub, { color: colors.mutedForeground }]}>
              APK, ZIP, PDF, Vídeos, Fotos esquecidos
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </Pressable>
      </Animated.View>

      {/* Seções de ferramentas */}
      {TOOLS_SECTIONS.map((section, si) => (
        <Animated.View
          key={section.title}
          entering={FadeInDown.delay(300 + si * 100).duration(500)}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {section.title}
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {section.data.map((row, ri) => (
              <View key={ri} style={[styles.toolsRow, ri < section.data.length - 1 && styles.toolsRowBorder, { borderBottomColor: colors.border }]}>
                {row.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    icon={tool.icon}
                    label={tool.label}
                    color={tool.color}
                    bgColor={tool.bg}
                    badge={tool.badge}
                    onPress={() => handleTool(tool.route)}
                  />
                ))}
              </View>
            ))}
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 14 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  monitorCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
  },
  monitorGrad: {
    backgroundColor: '#1469FF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
  },
  monitorLeft: { flex: 1, gap: 4 },
  monitorTitle: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  monitorSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },

  apkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  apkIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apkInfo: { flex: 1, gap: 3 },
  apkTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  apkSub: { fontSize: 12 },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolsRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  toolsRowBorder: {
    borderBottomWidth: 1,
  },
});
