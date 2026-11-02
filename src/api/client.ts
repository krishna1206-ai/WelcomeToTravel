import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

export const API_URL =(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4100').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function send<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_URL + path, init);
  } catch {
    throw new ApiError('Can’t reach the server. Check your connection and try again.', 0);
  }

  const text = await response.text();
  let data: { error?: string } | null = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    throw new ApiError(data?.error ?? 'Something went wrong. Please try again.', response.status);
  }
  return data as T;
}

export function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  return send<T>(path, {
    method: options.method ?? 'GET',
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

export function uploadFile<T>(path: string, asset: ImagePickerAsset, token: string | null): Promise<T> {
  const form = new FormData();
  if (Platform.OS === 'web' && asset.file) {
    form.append('photo', asset.file);
  } else {
    // React Native sends a file from this shape, which the web FormData type doesn't describe.
    form.append('photo', {
      uri: asset.uri,
      name: asset.fileName ?? 'photo.jpg',
      type: asset.mimeType ?? 'image/jpeg',
    } as unknown as Blob);
  }
  return send<T>(path, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
