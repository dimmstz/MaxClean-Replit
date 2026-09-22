/**
 * MaxClean Design Tokens
 * Tema azul cobalto com suporte completo a dark mode.
 * Nunca use hex diretamente nos componentes — use useColors().
 */

const colors = {
  light: {
    // legado / compatibilidade
    text: '#0D1020',
    tint: '#1469FF',

    // Superfícies principais
    background: '#F0F5FF',
    foreground: '#0D1020',

    // Cards
    card: '#FFFFFF',
    cardForeground: '#0D1020',

    // Ação primária — azul MaxClean
    primary: '#1469FF',
    primaryForeground: '#FFFFFF',

    // Secundário
    secondary: '#E8F0FF',
    secondaryForeground: '#1469FF',

    // Muted
    muted: '#E8EEFF',
    mutedForeground: '#6B7280',

    // Accent — ciano
    accent: '#00C8FF',
    accentForeground: '#FFFFFF',

    // Destrutivo
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    // Bordas e inputs
    border: '#DDE5FF',
    input: '#DDE5FF',

    // Extras
    success: '#22C55E',
    successBg: '#DCFCE7',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    info: '#3B82F6',
    infoBg: '#EFF6FF',

    // Gradiente MaxClean
    gradientStart: '#1469FF',
    gradientEnd: '#00C8FF',

    // UI utilitários
    overlay: 'rgba(13,16,32,0.5)',
    scanBg: 'rgba(20,105,255,0.06)',
  },

  dark: {
    text: '#F0F5FF',
    tint: '#4A90FF',

    background: '#0D1020',
    foreground: '#F0F5FF',

    card: '#161929',
    cardForeground: '#F0F5FF',

    primary: '#4A90FF',
    primaryForeground: '#FFFFFF',

    secondary: '#1A2040',
    secondaryForeground: '#7AA3FF',

    muted: '#1A2040',
    mutedForeground: '#9CA3AF',

    accent: '#00C8FF',
    accentForeground: '#FFFFFF',

    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    border: '#1E2848',
    input: '#1E2848',

    success: '#22C55E',
    successBg: 'rgba(34,197,94,0.15)',
    warning: '#F59E0B',
    warningBg: 'rgba(245,158,11,0.15)',
    info: '#3B82F6',
    infoBg: 'rgba(59,130,246,0.15)',

    gradientStart: '#1469FF',
    gradientEnd: '#00C8FF',

    overlay: 'rgba(0,0,0,0.7)',
    scanBg: 'rgba(74,144,255,0.08)',
  },

  radius: 16,
};

export default colors;
export type ColorScheme = typeof colors.light;
