import { Colors } from '@/constants/theme';

/**
 * Returns the Finora theme colors (light mode).
 */
export function useThemeColors() {
  return {
    ...Colors,
    isDark: false,
  };
}
