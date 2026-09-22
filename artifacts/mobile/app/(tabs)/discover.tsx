/**
 * Discover — Tela de descoberta: dicas, WhatsApp cleaner, scanner profundo.
 */
import React from 'react';
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/hooks/useColors';
import { useCleanHistory } from '@/context/CleanHistoryContext';
import { formatBytes } from '@/utils/formatters';

const FEATURES = [
  {
    id: 'whatsapp',
    title: 'Scanner WhatsApp',
    desc: 'Imagens duplicadas, stickers, status e backups antigos',
    icon: 'whatsapp',
    color: '#25D366',
    bg: '#DCFCE7',
    route: '/large-files',
  },
  {
    id: 'duplicates',
    title: 'Duplicados Avançados',
    desc: 'Fotos, vídeos, músicas — comparação por hash',
    icon: 'content-copy',
    color: '#F97316',
    bg: '#FFEDD5',
    route: '/duplicates',
  },
  {
    id: 'large-files',
    title: 'Arquivos Grandes',
    desc: 'Encontre arquivos acima de 10MB, 50MB, 100MB+',
    icon: 'file-search',
    color: '#14B8A6',
    bg: '#CCFBF1',
    route: '/large-files',
  },
  {
    id: 'apk',
    title: 'Scanner de APK',
    desc: 'APKs antigos, duplicados, inválidos e corrompidos',
    icon: 'android',
    color: '#3DDC84',
    bg: '#DCFCE7',
    route: '/apk-scanner',
  },
  {
    id: 'empty',
    title: 'Pastas Vazias',
    desc: 'Todas as pastas vazias em memória interna e SD',
    icon: 'folder-remove',
    color: '#6366F1',
    bg: '#EEF2FF',
    route: '/empty-folders',
  },
];

const TIPS = [
  {
    id: 't1',
    title: 'Limpe o cache semanalmente',
    desc: 'Apps acumulam arquivos temporários rapidamente. Limpeza semanal mantém o dispositivo rápido.',
    icon: 'calendar-check',
    color: '#1469FF',
  },
  {
    id: 't2',
    title: 'Remova APKs instaladores',
    desc: 'Após instalar um app, o APK instalador ocupa espaço desnecessariamente.',
    icon: 'delete-sweep',
    color: '#EF4444',
  },
  {
    id: 't3',
    title: 'WhatsApp acumula GB',
    desc: 'Mídias do WhatsApp (fotos, vídeos, stickers) podem ocupar gigabytes sem perceber.',
    icon: 'alert-circle',
    color: '#F59E0B',
  },
];

export default function DiscoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { stats } = useCleanHistory();

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
        <Text style={[styles.title, { color: colors.foreground }]}>Descobrir</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Ferramentas avançadas e dicas
        </Text>
      </Animated.View>

      {/* Stats banner */}
      {stats.totalSessions > 0 && (
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.statsBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{formatBytes(stats.totalSpaceFreed)}</Text>
              <Text style={styles.statLbl}>Liberados</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{stats.totalSessions}</Text>
              <Text style={styles.statLbl}>Limpezas</Text>
            </View>
            <View style={styles.statDiv} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{stats.totalFilesRemoved}</Text>
              <Text style={styles.statLbl}>Arquivos</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Seção: Ferramentas Avançadas */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Ferramentas Avançadas
        </Text>
        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.id}
              entering={FadeInDown.delay(250 + i * 50).duration(500)}
            >
              <Pressable
                style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(f.route as any)}
              >
                <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                  <MaterialCommunityIcons name={f.icon as any} size={26} color={f.color} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                    {f.title}
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>
                    {f.desc}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* Seção: Dicas */}
      <Animated.View entering={FadeInDown.delay(550).duration(500)}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Dicas de Otimização
        </Text>
        <View style={styles.tipList}>
          {TIPS.map((tip) => (
            <View
              key={tip.id}
              style={[styles.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.tipIcon, { backgroundColor: tip.color + '18' }]}>
                <MaterialCommunityIcons name={tip.icon as any} size={22} color={tip.color} />
              </View>
              <View style={styles.tipInfo}>
                <Text style={[styles.tipTitle, { color: colors.foreground }]}>
                  {tip.title}
                </Text>
                <Text style={[styles.tipDesc, { color: colors.mutedForeground }]}>
                  {tip.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },

  title: { fontSize: 24, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 14, marginTop: 4 },

  statsBanner: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statVal: { color: '#fff', fontSize: 18, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  statLbl: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  statDiv: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.3)' },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },

  featureList: { gap: 8 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: { flex: 1, gap: 3 },
  featureTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  featureDesc: { fontSize: 12 },

  tipList: { gap: 8 },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipInfo: { flex: 1, gap: 4 },
  tipTitle: { fontSize: 13, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  tipDesc: { fontSize: 12, lineHeight: 18 },
});
