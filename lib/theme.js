// 主题配置 - 跟随系统暗/亮模式
import { useColorScheme } from 'react-native';

export const LIGHT = {
  bg: '#FFFFFF',
  bgCard: '#F8FAFC',
  bgInput: '#F1F5F9',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  tabBg: '#FFFFFF',
  tabBorder: '#E2E8F0',
  shadow: '#00000010',
};

export const DARK = {
  bg: '#0F172A',
  bgCard: '#1E293B',
  bgInput: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  primary: '#3B82F6',
  primaryLight: '#1E3A5F',
  danger: '#F87171',
  dangerLight: '#3B1A1A',
  success: '#34D399',
  successLight: '#1A3B2A',
  warning: '#FBBF24',
  tabBg: '#1E293B',
  tabBorder: '#334155',
  shadow: '#00000040',
};

export function useTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? DARK : LIGHT;
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};
