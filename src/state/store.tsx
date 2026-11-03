import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { api, photoSource } from '@/api/client';
import type { Tour, TourCollection } from '@/data/tours';
import { useAuth } from '@/state/auth';

export type RequestStatus = 'new' | 'confirmed' | 'cancelled';

export type PaymentStatus = 'none' | 'pending' | 'deposit' | 'paid';

export type Booking = {
  id: number;
  tourId: string | null;
  tourTitle: string;
  date: string;
  travellers: number;
  total: number | null;
  status: RequestStatus;
  paymentStatus: PaymentStatus;
  paymentPlan?: 'full' | 'deposit';
  pickupPoint?: string;
  feeCents?: number;
  totalCents?: number;
  paidCents?: number;
  dueNowCents?: number;
};

export type NewBooking = {
  tourId: string;
  date: string;
  travellers: number;
  plan?: 'full' | 'deposit';
  pickupPoint?: string;
  traveller?: Record<string, string>;
  billing?: Record<string, string>;
  agreedToTerms?: boolean;
};

export type Notification = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

export type ChatMessage = {
  id: number;
  sender: 'customer' | 'admin';
  body: string;
  read: boolean;
  createdAt: string;
};

export const CHAT_NAME = 'Welcome to Travel';

export type BuildChoices = {
  stay: string;
  transport: string;
  activities: string[];
  startingPoint: string | null;
};

export type ItineraryRequest = BuildChoices & {
  id: number;
  date: string;
  status: RequestStatus;
};

type ApiTour = Omit<Tour, 'photo' | 'gallery'> & { photo: string | null; gallery?: string[] };

type ToursStatus = 'loading' | 'ready' | 'error';

type Store = {
  tours: Tour[];
  toursStatus: ToursStatus;
  reloadTours: () => Promise<void>;
  getTour: (id: string | undefined) => Tour | undefined;
  toursIn: (collection: TourCollection) => Tour[];
  savedIds: string[];
  bookings: Booking[];
  itineraries: ItineraryRequest[];
  notifications: Notification[];
  chat: ChatMessage[];
  unreadChat: number;
  unreadCount: number;
  build: BuildChoices;
  toggleSaved: (tourId: string) => void;
  addBooking: (booking: NewBooking) => Promise<Booking>;
  cancelBooking: (id: number) => Promise<void>;
  payBooking: (id: number) => Promise<void>;
  markNotificationRead: (id: number) => void;
  deleteNotifications: (ids: number[]) => Promise<void>;
  refreshAccount: () => Promise<void>;
  refreshChat: () => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  markChatRead: () => void;
  updateBuild: (changes: Partial<BuildChoices>) => void;
  addItinerary: (date: string) => Promise<void>;
  cancelItinerary: (id: number) => Promise<void>;
  sendMessage: (message: { name: string; email: string; question: string }) => Promise<void>;
};

const BUILD_KEY = 'welcometo-travel/build/v1';
const TOURS_KEY = 'welcometo-travel/tours/v1';
const REFRESH_MS = 30_000;
const TOURS_REFRESH_MS = 60_000;

const DEFAULT_BUILD: BuildChoices = {
  stay: 'Premium',
  transport: 'Bus',
  activities: [],
  startingPoint: null,
};

type AccountData = {
  token: string | null;
  savedIds: string[];
  bookings: Booking[];
  itineraries: ItineraryRequest[];
  notifications: Notification[];
  chat: ChatMessage[];
};

const NO_ACCOUNT: AccountData = {
  token: null,
  savedIds: [],
  bookings: [],
  itineraries: [],
  notifications: [],
  chat: [],
};

const StoreContext = createContext<Store | null>(null);

function toTour(tour: ApiTour): Tour {
  return {
    ...tour,
    photo: tour.photo ? photoSource(tour.photo) : null,
    gallery: (tour.gallery ?? []).map(photoSource),
  };
}

async function fetchTours(): Promise<{ tours: Tour[]; status: ToursStatus }> {
  try {
    const data = await api<{ tours: ApiTour[] }>('/api/tours');
    AsyncStorage.setItem(TOURS_KEY, JSON.stringify(data.tours)).catch(() => undefined);
    return { tours: data.tours.map(toTour), status: 'ready' };
  } catch {
    // Shows the last trips seen when the server can't be reached.
    const cached = await AsyncStorage.getItem(TOURS_KEY).catch(() => null);
    if (cached) return { tours: (JSON.parse(cached) as ApiTour[]).map(toTour), status: 'ready' };
    return { tours: [], status: 'error' };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [toursStatus, setToursStatus] = useState<ToursStatus>('loading');
  const [loadedAccount, setAccount] = useState<AccountData>(NO_ACCOUNT);
  const [build, setBuild] = useState<BuildChoices>(DEFAULT_BUILD);
  const [buildLoaded, setBuildLoaded] = useState(false);
  const paymentsInProgress = useRef(new Set<number>());

  // Data loaded for an earlier sign-in is never shown to whoever is signed in now.
  const account = loadedAccount.token === token ? loadedAccount : NO_ACCOUNT;
  const { savedIds, bookings, itineraries, notifications, chat } = account;
  const unreadChat = chat.filter((item) => item.sender === 'admin' && !item.read).length;
  const unreadCount = notifications.filter((item) => !item.read).length + unreadChat;

  useEffect(() => {
    fetchTours().then((result) => {
      setTours(result.tours);
      setToursStatus(result.status);
    });
  }, []);

  const reloadTours = useCallback(async () => {
    setToursStatus('loading');
    const result = await fetchTours();
    setTours(result.tours);
    setToursStatus(result.status);
  }, []);

  // Picks up trips the team added, changed or deleted. If the server can't be reached, the list stays as it is.
  useEffect(() => {
    const refresh = () => {
      api<{ tours: ApiTour[] }>('/api/tours')
        .then((data) => {
          AsyncStorage.setItem(TOURS_KEY, JSON.stringify(data.tours)).catch(() => undefined);
          setTours(data.tours.map(toTour));
          setToursStatus('ready');
        })
        .catch(() => undefined);
    };
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, TOURS_REFRESH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(BUILD_KEY)
      .then((raw) => {
        if (raw) setBuild({ ...DEFAULT_BUILD, ...JSON.parse(raw) });
      })
      .catch((error) => console.warn('Could not load trip choices', error))
      .finally(() => setBuildLoaded(true));
  }, []);

  // Waits for the first load so the defaults never overwrite stored choices.
  useEffect(() => {
    if (!buildLoaded) return;
    AsyncStorage.setItem(BUILD_KEY, JSON.stringify(build)).catch((error) =>
      console.warn('Could not save trip choices', error),
    );
  }, [buildLoaded, build]);

  useEffect(() => {
    if (!token) return;
    let current = true;
    Promise.all([
      api<{ tourIds: string[] }>('/api/me/saved', { token }),
      api<{ bookings: Booking[] }>('/api/me/bookings', { token }),
      api<{ itineraries: ItineraryRequest[] }>('/api/me/itineraries', { token }),
      api<{ notifications: Notification[] }>('/api/me/notifications', { token }),
      api<{ messages: ChatMessage[] }>('/api/me/chat', { token }),
    ])
      .then(([saved, mine, requests, messages, conversation]) => {
        if (!current) return;
        setAccount({
          token,
          savedIds: saved.tourIds,
          bookings: mine.bookings,
          itineraries: requests.itineraries,
          notifications: messages.notifications,
          chat: conversation.messages,
        });
      })
      .catch((error) => console.warn('Could not load account data', error));
    return () => {
      current = false;
    };
  }, [token]);

  // Picks up admin decisions and finished payments. Being offline just waits for the next try.
  const refreshAccount = useCallback(async () => {
    if (!token) return;
    try {
      for (const id of [...paymentsInProgress.current]) {
        const { booking } = await api<{ booking: Booking }>(`/api/bookings/${id}/payment/check`, {
          method: 'POST',
          token,
        });
        if (booking.paymentStatus === 'paid') paymentsInProgress.current.delete(id);
      }
      const [mine, requests, messages, conversation] = await Promise.all([
        api<{ bookings: Booking[] }>('/api/me/bookings', { token }),
        api<{ itineraries: ItineraryRequest[] }>('/api/me/itineraries', { token }),
        api<{ notifications: Notification[] }>('/api/me/notifications', { token }),
        api<{ messages: ChatMessage[] }>('/api/me/chat', { token }),
      ]);
      setAccount((current) =>
        current.token === token
          ? {
              ...current,
              bookings: mine.bookings,
              itineraries: requests.itineraries,
              notifications: messages.notifications,
              chat: conversation.messages,
            }
          : current,
      );
    } catch {}
  }, [token]);

  const refreshChat = useCallback(async () => {
    if (!token) return;
    try {
      const { messages } = await api<{ messages: ChatMessage[] }>('/api/me/chat', { token });
      setAccount((current) => (current.token === token ? { ...current, chat: messages } : current));
    } catch {}
  }, [token]);

  const sendChatMessage = useCallback(
    async (message: string) => {
      const data = await api<{ message: ChatMessage }>('/api/me/chat', {
        method: 'POST',
        token,
        body: { message },
      });
      setAccount((current) =>
        current.chat.some((item) => item.id === data.message.id)
          ? current
          : { ...current, chat: [...current.chat, data.message] },
      );
    },
    [token],
  );

  const markChatRead = useCallback(() => {
    setAccount((current) => ({
      ...current,
      chat: current.chat.map((item) => (item.sender === 'admin' ? { ...item, read: true } : item)),
    }));
    api('/api/me/chat/read', { method: 'POST', token }).catch((error) =>
      console.warn('Could not mark chat as read', error),
    );
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const payments = paymentsInProgress.current;
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refreshAccount();
    }, REFRESH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAccount();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
      payments.clear();
    };
  }, [token, refreshAccount]);

  const getTour = useCallback(
    (id: string | undefined) => tours.find((tour) => tour.id === id),
    [tours],
  );

  const toursIn = useCallback(
    (collection: TourCollection) => tours.filter((tour) => tour.collection === collection),
    [tours],
  );

  const toggleSaved = useCallback(
    (tourId: string) => {
      const wasSaved = savedIds.includes(tourId);
      const apply = (saved: boolean) =>
        setAccount((current) => {
          const others = current.savedIds.filter((id) => id !== tourId);
          return { ...current, savedIds: saved ? [...others, tourId] : others };
        });
      apply(!wasSaved);
      api(`/api/me/saved/${tourId}`, { method: wasSaved ? 'DELETE' : 'PUT', token }).catch((error) => {
        console.warn('Could not update saved trip', error);
        apply(wasSaved);
      });
    },
    [savedIds, token],
  );

  const addBooking = useCallback(
    async (booking: NewBooking) => {
      const data = await api<{ booking: Booking }>('/api/bookings', {
        method: 'POST',
        token,
        body: booking,
      });
      setAccount((current) => ({ ...current, token, bookings: [data.booking, ...current.bookings] }));
      return data.booking;
    },
    [token],
  );

  // Android returns as soon as the browser opens, so the result arrives through refreshAccount.
  const payBooking = useCallback(
    async (id: number) => {
      const { url } = await api<{ url: string | null }>(`/api/bookings/${id}/pay`, {
        method: 'POST',
        token,
      });
      if (url) {
        paymentsInProgress.current.add(id);
        await WebBrowser.openBrowserAsync(url);
      }
      await refreshAccount();
    },
    [token, refreshAccount],
  );

  const markNotificationRead = useCallback(
    (id: number) => {
      setAccount((current) => ({
        ...current,
        notifications: current.notifications.map((item) =>
          item.id === id ? { ...item, read: true } : item,
        ),
      }));
      api(`/api/me/notifications/${id}/read`, { method: 'POST', token }).catch((error) =>
        console.warn('Could not mark notification as read', error),
      );
    },
    [token],
  );

  // Removed from the screen straight away. If the server refuses, they come back.
  const deleteNotifications = useCallback(
    async (ids: number[]) => {
      const removed = new Set(ids);
      let previous: Notification[] = [];
      setAccount((current) => {
        previous = current.notifications;
        return { ...current, notifications: current.notifications.filter((item) => !removed.has(item.id)) };
      });
      try {
        await api('/api/me/notifications', { method: 'DELETE', token, body: { ids } });
      } catch (error) {
        setAccount((current) => ({ ...current, notifications: previous }));
        throw error;
      }
    },
    [token],
  );

  const cancelBooking = useCallback(
    async (id: number) => {
      const data = await api<{ booking: Booking }>(`/api/bookings/${id}/cancel`, { method: 'POST', token });
      setAccount((current) => ({
        ...current,
        bookings: current.bookings.map((item) => (item.id === id ? data.booking : item)),
      }));
    },
    [token],
  );

  const updateBuild = useCallback((changes: Partial<BuildChoices>) => {
    setBuild((current) => ({ ...current, ...changes }));
  }, []);

  const addItinerary = useCallback(
    async (date: string) => {
      const data = await api<{ itinerary: ItineraryRequest }>('/api/itineraries', {
        method: 'POST',
        token,
        body: { ...build, date },
      });
      setAccount((current) => ({
        ...current,
        token,
        itineraries: [data.itinerary, ...current.itineraries],
      }));
    },
    [build, token],
  );

  const cancelItinerary = useCallback(
    async (id: number) => {
      const data = await api<{ itinerary: ItineraryRequest }>(`/api/itineraries/${id}/cancel`, {
        method: 'POST',
        token,
      });
      setAccount((current) => ({
        ...current,
        itineraries: current.itineraries.map((item) => (item.id === id ? data.itinerary : item)),
      }));
    },
    [token],
  );

  const sendMessage = useCallback(
    async (message: { name: string; email: string; question: string }) => {
      await api('/api/messages', { method: 'POST', token, body: message });
    },
    [token],
  );

  const value = useMemo(
    () => ({
      tours,
      toursStatus,
      reloadTours,
      getTour,
      toursIn,
      savedIds,
      bookings,
      itineraries,
      notifications,
      chat,
      unreadChat,
      unreadCount,
      build,
      toggleSaved,
      addBooking,
      cancelBooking,
      payBooking,
      markNotificationRead,
      deleteNotifications,
      refreshAccount,
      refreshChat,
      sendChatMessage,
      markChatRead,
      updateBuild,
      addItinerary,
      cancelItinerary,
      sendMessage,
    }),
    [
      tours,
      toursStatus,
      reloadTours,
      getTour,
      toursIn,
      savedIds,
      bookings,
      itineraries,
      notifications,
      chat,
      unreadChat,
      unreadCount,
      build,
      toggleSaved,
      addBooking,
      cancelBooking,
      payBooking,
      markNotificationRead,
      deleteNotifications,
      refreshAccount,
      refreshChat,
      sendChatMessage,
      markChatRead,
      updateBuild,
      addItinerary,
      cancelItinerary,
      sendMessage,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
