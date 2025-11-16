import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { setTokens } from './lib/api';
import { getMe } from './lib/auth';
import { loadTokens } from './lib/storage';

export default function Index() {
  React.useEffect(() => {
    (async () => {
      const { accessToken, refreshToken } = await loadTokens();
      if (accessToken || refreshToken) {
        setTokens(accessToken || null, refreshToken || null);
        try {
          await getMe();
          router.replace('/(tabs)');
        } catch {
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    })();
  }, []);
  return <View style={{ flex: 1 }} />;
}
