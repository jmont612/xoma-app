import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as any;
  const raw = __DEV__ ? extra?.apiUrlDev : extra?.apiUrlProd;
  if (!raw) {
    throw new Error('API URL no configurada en app.json (extra.apiUrlDev/apiUrlProd)');
  }
  let url = raw.startsWith('http') ? raw : `http://${raw}`;
  const hostUri = (Constants.expoConfig as any)?.hostUri || (Constants as any).debuggerHost;

  if (__DEV__) {
    try {
      const u = new URL(url);
      const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1';

      if (Platform.OS === 'android') {
        if (Constants.isDevice) {
          // Dispositivo físico: usar IP LAN del host detectada desde hostUri
          if (hostUri && isLocalhost) {
            const ip = String(hostUri).split(':')[0];
            url = `http://${ip}:${u.port || '3000'}`;
          }
        } else {
          // Emulador: mapear localhost -> 10.0.2.2
          if (isLocalhost) {
            u.hostname = '192.168.18.45';
            url = u.toString();
          }
        }
      } else if (Platform.OS === 'ios') {
        if (Constants.isDevice && hostUri && isLocalhost) {
          const ip = String(hostUri).split(':')[0];
          url = `http://${ip}:${u.port || '3000'}`;
        }
      }
    } catch {}
  }
  return url;
}