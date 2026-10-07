import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface RouterContextValue {
  path: string;
  search: string;
  navigate: (newPath: string) => void;
  gameSlug?: string;
}

const RouterContext = createContext<RouterContextValue | null>(null);

const readLocation = () => ({
  pathname: window.location.pathname || '/',
  search: window.location.search || '',
});

export const RouterProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const initial = readLocation();

  const [path, setPath] = useState(initial.pathname);
  const [search, setSearch] = useState(initial.search);

  useEffect(() => {
    const handlePopState = () => {
      const next = readLocation();
      setPath(next.pathname);
      setSearch(next.search);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener(
        'popstate',
        handlePopState
      );
    };
  }, []);

  const navigate = useCallback((newPath: string) => {
    const current =
      window.location.pathname +
      window.location.search;

    if (newPath === current) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      return;
    }

    window.history.pushState({}, '', newPath);

    const next = readLocation();
    setPath(next.pathname);
    setSearch(next.search);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, []);

  const gameSlug =
    path.startsWith('/games/')
      ? path
          .replace('/games/', '')
          .split('/')[0]
      : undefined;

  return (
    <RouterContext.Provider
      value={{
        path,
        search,
        navigate,
        gameSlug,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error(
      'useRouter must be used within a RouterProvider'
    );
  }

  return context;
}
