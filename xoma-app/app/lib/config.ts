import Constants from "expo-constants";
import { Platform } from "react-native";

function normalizeUrl(raw: string): string {
  const value = raw.trim();
  return value.startsWith("http") ? value : `http://${value}`;
}

function isPlaceholderProdUrl(value: unknown): boolean {
  if (!value) return false;
  const s = String(value).trim();
  return /(^|\/\/)api\.midominio\.com(?=[:/]|$)/i.test(s);
}

function getHostIp(): string | null {
  const candidates = [
    (Constants.expoConfig as any)?.hostUri,
    (Constants.expoConfig as any)?.debuggerHost,
    (Constants as any)?.expoGoConfig?.debuggerHost,
    (Constants as any)?.manifest?.debuggerHost,
    (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as any)?.experienceUrl,
    (Constants as any)?.linkingUri,
    (Constants as any)?.debuggerHost,
    (Constants as any)?.hostUri,
  ].filter(Boolean);

  for (const c of candidates) {
    const withoutScheme = String(c).replace(/^[a-z]+:\/\//i, "");
    const hostPort = withoutScheme.split("/")[0];
    const host = hostPort.split(":")[0];
    if (host && host !== "localhost" && host !== "127.0.0.1") return host;
  }
  return null;
}

function rewriteLocalhostForDevice(url: string): string {
  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/i.test(url);
  if (!isLocalhost) return url;

  const portMatch = url.match(/^https?:\/\/[^/]+:(\d+)(?=\/|$)/i);
  const port = portMatch?.[1] || "3000";
  const protocol = url.toLowerCase().startsWith("https://") ? "https" : "http";
  const path = url.replace(/^https?:\/\/[^/]+/i, "");

  if (Platform.OS === "android") {
    if (Constants.isDevice) {
      const hostIp = getHostIp();
      if (!hostIp) return url;
      return `${protocol}://${hostIp}:${port}${path}`;
    }
    return `${protocol}://10.0.2.2:${port}${path}`;
  }

  if (Platform.OS === "ios") {
    const hostIp = getHostIp();
    if (!Constants.isDevice || !hostIp) return url;
    return `${protocol}://${hostIp}:${port}${path}`;
  }

  return url;
}

export function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra as any;
  const execEnv = (Constants as any)?.executionEnvironment as string | undefined;
  const isExpoGo = Constants.appOwnership === "expo" || execEnv === "storeClient";
  const envAny = process.env.EXPO_PUBLIC_API_URL;
  const envDev = process.env.EXPO_PUBLIC_API_URL_DEV;
  const envProd = process.env.EXPO_PUBLIC_API_URL_PROD;

  const rawDev = (envAny || envDev || extra?.apiUrlDev) as string | undefined;
  const rawProd = (envAny || envProd || extra?.apiUrlProd) as string | undefined;

  console.log("rawDev", rawDev);
  console.log("rawProd", rawProd);

  const useDev =
    __DEV__ ||
    isExpoGo ||
    extra?.forceDevApi === true ||
    isPlaceholderProdUrl(rawProd);

  const raw = (useDev ? rawDev : rawProd) as string | undefined;

  if (!raw) {
    throw new Error(
      "API URL no configurada. Define EXPO_PUBLIC_API_URL_DEV/EXPO_PUBLIC_API_URL o extra.apiUrlDev",
    );
  }

  let normalized = normalizeUrl(raw);
  if (isPlaceholderProdUrl(normalized) && rawDev && !isPlaceholderProdUrl(rawDev)) {
    normalized = normalizeUrl(rawDev);
  }
  return useDev ? rewriteLocalhostForDevice(normalized) : normalized;
}
