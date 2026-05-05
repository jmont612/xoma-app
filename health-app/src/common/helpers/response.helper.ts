import { ApiResponse } from '../interfaces/response.interface';

export function apiResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    data,
    message,
  };
}
