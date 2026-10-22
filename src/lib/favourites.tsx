import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'be-still:favourites';

type FavouritesContextValue = {
  ids: string[];
  isFavourite: (trackId: string) => boolean;
  toggleFavourite: (trackId: string) => void;
};

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

/**
 * Favourites saved on this device for now.
 * Step 3 adds the `favourites` table so hearts follow people to every device.
 */
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setIds(JSON.parse(raw)))
      .catch(() => {});
  }, []);

  function toggleFavourite(trackId: string) {
    const next = ids.includes(trackId) ? ids.filter((id) => id !== trackId) : [trackId, ...ids];
    setIds(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }

  return (
    <FavouritesContext.Provider value={{ ids, isFavourite: (id) => ids.includes(id), toggleFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used inside <FavouritesProvider>');
  return ctx;
}
