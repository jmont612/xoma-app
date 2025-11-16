import { post, setTokens, clearTokens, get, patch } from './api';
import { saveTokens, saveUser, clearStoredTokens, clearStoredUser } from './storage';

interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: any; // Puedes tipar el user con tu esquema real
}

interface ApiResponse<T> {
  data: T;
  message: string;
}

export async function login(email: string, password: string): Promise<LoginResponseData> {
  const res = await post<ApiResponse<LoginResponseData>>('/auth/login', { email, password }, { skipAuth: true });
  const { accessToken, refreshToken, user } = res.data;

  if (!accessToken || !refreshToken) {
    throw new Error('Respuesta de login inválida');
  }

  setTokens(accessToken, refreshToken);
  await saveTokens(accessToken, refreshToken);
  await saveUser(user);
  return { accessToken, refreshToken, user };
}

interface RegisterPayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  consentAccepted: boolean;
}

export async function register(payload: RegisterPayload): Promise<any> {
  const res = await post<ApiResponse<any>>('/auth/register', payload, { skipAuth: true });
  return res.data;
}

export async function getMe(): Promise<any> {
  const res = await get<ApiResponse<any>>('/auth/me');
  const user = res.data;
  await saveUser(user);
  return user;
}

export async function updateUser(
  id: string,
  payload: Partial<{ firstName: string; lastName: string; username: string; email: string; password: string; age: number; gender: string; consentAccepted: boolean }>
): Promise<any> {
  const res = await patch<ApiResponse<any>>(`/users/${id}`, payload);
  const user = res.data;
  await saveUser(user);
  return user;
}

export function logout() {
  clearTokens();
  clearStoredTokens();
  clearStoredUser();
}