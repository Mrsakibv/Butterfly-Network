import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface RouterContextValue {
  path: string;
  navigate: (newPath: string) => void;
  gameSlug?: string;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((newPath: string) => {
    if (newPath === window.location.pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history.pushState({}, '', newPath);
    setPath(newPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Derive game slug if path starts with /games/
  const gameSlug = path.startsWith('/games/') ? path.replace('/games/', '').split('/')[0] : undefined;

  return (
    <RouterContext.Provider value={{ path, navigate, gameSlug }}>
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
