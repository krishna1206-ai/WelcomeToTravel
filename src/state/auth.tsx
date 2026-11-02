import type { ImagePickerAsset } from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { api, ApiError, uploadFile } from '@/api/client';
import { registeredPushToken } from '@/utils/push';

export type UserDetails = { name: string; phone: string; city: string; state: string; country: string };

export type User = UserDetails & { id: number; email: string; photo: string | null; role: string };

type Session = { token: string; user: User };

type Auth = {
  user: User | null;
  token: string | null;
  ready: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<void>;
  signUp: (details: UserDetails & { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (details: UserDetails) => Promise<void>;
  changePhoto: (asset: ImagePickerAsset) => Promise<void>;
  removePhoto: () => Promise<void>;
  changeEmail: (email: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
};

const SESSION_KEY = 'welcometo-travel.session';

// SecureStore keeps the session encrypted on phones but isn't available in a browser.
const sessionStorage = {
  async read(): Promise<string | null> {
    if (Platform.OS !== 'web') return SecureStore.getItemAsync(SESSION_KEY);
    try {
      return window.localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  },
  async write(value: string): Promise<void> {
    if (Platform.OS !== 'web') return SecureStore.setItemAsync(SESSION_KEY, value);
    try {
      window.localStorage.setItem(SESSION_KEY, value);
    } catch {}
  },
  async clear(): Promise<void> {
    if (Platform.OS !== 'web') return SecureStore.deleteItemAsync(SESSION_KEY);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {}
  },
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function restore() {
      const raw = await sessionStorage.read().catch(() => null);
      if (!raw) return;
      const stored: Session = JSON.parse(raw);
      setSession(stored);
      try {
        const { user } = await api<{ user: User }>('/api/me', { token: stored.token });
        setSession({ token: stored.token, user });
      } catch (error) {
        // Offline keeps the person signed in; only a rejected session signs them out.
        if (error instanceof ApiError && error.status === 401) {
          setSession(null);
          await sessionStorage.clear();
        }
      }
    }
    restore()
      .catch((error) => console.warn('Could not restore session', error))
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const next = await api<Session>('/api/auth/signin', {
      method: 'POST',
      body: { email, password, remember },
    });
    setSession(next);
    // Without "Remember me" the session lasts only until the app is closed.
    if (remember) await sessionStorage.write(JSON.stringify(next));
    else await sessionStorage.clear();
  }, []);

  const signUp = useCallback(
    async (details: UserDetails & { email: string; password: string }) => {
      const next = await api<Session>('/api/auth/signup', {
        method: 'POST',
        body: { ...details, remember: true },
      });
      setSession(next);
      await sessionStorage.write(JSON.stringify(next));
    },
    [],
  );

  const token = session?.token ?? null;

  const signOut = useCallback(async () => {
    if (token) {
      // Stops this device getting the next person's notifications.
      const pushToken = registeredPushToken();
      if (pushToken) {
        await api('/api/me/push-token', { method: 'DELETE', token, body: { token: pushToken } }).catch(
          () => undefined,
        );
      }
      await api('/api/auth/signout', { method: 'POST', token }).catch(() => undefined);
    }
    setSession(null);
    await sessionStorage.clear();
  }, [token]);

  // Sessions without "Remember me" stay out of storage.
  const saveUser = useCallback(
    async (user: User) => {
      if (!token) return;
      const next = { token, user };
      setSession(next);
      const stored = await sessionStorage.read().catch(() => null);
      if (stored) await sessionStorage.write(JSON.stringify(next));
    },
    [token],
  );

  const updateProfile = useCallback(
    async (details: UserDetails) => {
      const { user } = await api<{ user: User }>('/api/me', { method: 'PUT', token, body: details });
      await saveUser(user);
    },
    [token, saveUser],
  );

  const changePhoto = useCallback(
    async (asset: ImagePickerAsset) => {
      const { user } = await uploadFile<{ user: User }>('/api/me/photo', asset, token);
      await saveUser(user);
    },
    [token, saveUser],
  );

  const removePhoto = useCallback(async () => {
    const { user } = await api<{ user: User }>('/api/me/photo', { method: 'DELETE', token });
    await saveUser(user);
  }, [token, saveUser]);

  const changeEmail = useCallback(
    async (email: string, currentPassword: string) => {
      const { user } = await api<{ user: User }>('/api/me/email', {
        method: 'PUT',
        token,
        body: { email, currentPassword },
      });
      await saveUser(user);
    },
    [token, saveUser],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      await api('/api/me/password', { method: 'PUT', token, body: { currentPassword, newPassword } });
    },
    [token],
  );

  const deleteAccount = useCallback(
    async (password: string) => {
      await api('/api/me', { method: 'DELETE', token, body: { password } });
      setSession(null);
      await sessionStorage.clear();
    },
    [token],
  );

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token,
      ready,
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePhoto,
      removePhoto,
      changeEmail,
      changePassword,
      deleteAccount,
    }),
    [
      session,
      token,
      ready,
      signIn,
      signUp,
      signOut,
      updateProfile,
      changePhoto,
      removePhoto,
      changeEmail,
      changePassword,
      deleteAccount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}

// Runs the action when signed in. Otherwise opens sign in, then continues to `next`.
export function useRequireAuth() {
  const { user } = useAuth();
  return useCallback(
    (next: string, action?: () => void) => {
      if (user) {
        if (action) action();
        else router.push(next as Href);
      } else {
        router.push({ pathname: '/sign-in', params: { next } });
      }
    },
    [user],
  );
}

export function safeNext(next: string | undefined, fallback: string = '/'): Href {
  return (next && next.startsWith('/') && !next.startsWith('//') ? next : fallback) as Href;
}
