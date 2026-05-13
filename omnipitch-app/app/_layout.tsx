import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from '@/context/AppContext';

const OmniPitchDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3b82f6',
    background: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    notification: '#f59e0b',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemeProvider value={OmniPitchDarkTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                title: 'Agent Trace Detail',
                headerStyle: { backgroundColor: '#1e293b' },
                headerTintColor: '#f1f5f9',
              }}
            />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
