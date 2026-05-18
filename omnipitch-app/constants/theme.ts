/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    bgBase: '#f8fafc',
    bgCard: '#ffffff',
    bgCardAlt: '#f1f5f9',
    bgDropdown: '#ffffff',
    heroGrad1: '#e0e7ff',
    heroGrad2: '#f1f5f9',
    heroCardBg: 'rgba(0,0,0,0.03)',
    modalOverlay: 'rgba(0,0,0,0.5)',
    textTitle: '#0f172a',
    textSub: '#475569',
    textMuted: '#64748b',
    textInverse: '#ffffff',
    heroEyebrow: '#4f46e5',
    borderBase: '#e2e8f0',
    borderSubtle: '#f1f5f9',
    borderStrong: '#cbd5e1',
    borderFocus: '#3b82f6',
    primary: '#2563eb',
    danger: '#dc2626',
    warning: '#d97706',
    success: '#059669',
    info: '#0ea5e9',
    tabBg: '#ffffff',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#2563eb',
  },
  dark: {
    bgBase: '#050c18',
    bgCard: '#08142a',
    bgCardAlt: '#0a1628',
    bgDropdown: '#08142a',
    heroGrad1: '#112060',
    heroGrad2: '#071428',
    heroCardBg: 'rgba(255,255,255,0.06)',
    modalOverlay: 'rgba(0,0,0,0.75)',
    textTitle: '#e8f0ff',
    textSub: '#7a90b0',
    textMuted: '#4a6fa5',
    textInverse: '#ffffff',
    heroEyebrow: '#3b6cc0',
    borderBase: '#0f2040',
    borderSubtle: '#142035',
    borderStrong: '#1e3d70',
    borderFocus: '#3b82f6',
    primary: '#3b82f6',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    info: '#3b82f6',
    tabBg: '#060d1a',
    tabIconDefault: '#2d4a6a',
    tabIconSelected: '#60a5fa',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
