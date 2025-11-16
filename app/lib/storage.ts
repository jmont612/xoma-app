import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';
const USER_KEY = 'USER';

export async function saveTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function loadTokens(): Promise<{ accessToken?: string; refreshToken?: string }> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  return { accessToken: accessToken || undefined, refreshToken: refreshToken || undefined };
}

export async function clearStoredTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveUser(user: any) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function loadUser<T = any>(): Promise<T | null> {
  const value = await SecureStore.getItemAsync(USER_KEY);
  return value ? (JSON.parse(value) as T) : null;
}

export async function clearStoredUser() {
  await SecureStore.deleteItemAsync(USER_KEY);
}