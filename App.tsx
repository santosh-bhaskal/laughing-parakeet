import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import TabNavigator from './src/navigation/TabNavigator';
import LaunchScreen from './src/screens/LaunchScreen';
import LoginScreen from './src/screens/LoginScreen';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Keep the native green splash screen visible while JS bundle is preparing
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

function MainContent() {
  const { theme } = useAppTheme();
  const { user, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure status bar on Android matches active theme header
    if (Platform.OS === 'android') {
      (StatusBar as any).setBackgroundColor?.(theme.colors.headerBg, true);
      (StatusBar as any).setTranslucent?.(false);
    }
  }, [theme.colors.headerBg]);

  if (!isReady || isLoading) {
    return <LaunchScreen onFinish={() => setIsReady(true)} />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      {!user ? (
        <LoginScreen />
      ) : (
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      )}
    </>
  );
}

export default function App() {
  return (
    // Green wrapper eliminates the white flash from native window background
    // before React renders LaunchScreen
    <View style={{ flex: 1, backgroundColor: '#166534' }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <MainContent />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
}
