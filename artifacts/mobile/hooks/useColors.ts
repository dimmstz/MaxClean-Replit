/**
 * useColors — Retorna o esquema de cores baseado no tema atual.
 * Leia cores daqui, nunca hardcode hex nos componentes.
 */
import { useColorScheme } from 'react-native';
import colors, { ColorScheme } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export function useColors(): ColorScheme & { radius: number; isDark: boolean } {
  const { isDark } = useTheme();
  const scheme = isDark ? colors.dark : colors.light;
  return { ...scheme, radius: colors.radius, isDark };
}
