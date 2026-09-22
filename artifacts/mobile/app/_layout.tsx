/**
 * Root Layout — Providers globais do MaxClean.
 * Ordem: SafeAreaProvider → ErrorBoundary → Theme → Language → History → Settings → QueryClient → Gesture → Keyboard
 */
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { CleanHistoryProvider } from '@/context/CleanHistoryContext';
import { SettingsProvider } from '@/context/SettingsContext';

// Impede que a splash screen se esconda antes de carregar
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#0D1020' : '#F0F5FF' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="clean" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="app-clean" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="monitor" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="hibernate" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="duplicates" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="large-files" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="downloads" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="empty-folders" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="apk-scanner" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="history" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <LanguageProvider>
            <CleanHistoryProvider>
              <SettingsProvider>
                <QueryClientProvider client={queryClient}>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </QueryClientProvider>
              </SettingsProvider>
            </CleanHistoryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
