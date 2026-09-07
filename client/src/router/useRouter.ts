import { useState, useEffect, useCallback } from 'react';
import { NavTab, RouteMatch, parseRoute, navigateTo, NavigateOptions, AuthMode } from './routes';

export function useRouter() {
  const [route, setRoute] = useState<RouteMatch>(() => parseRoute());

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseRoute());
    };

    const handleRouteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{
        tab: NavTab;
        prId?: string;
        filter?: string;
        authMode?: AuthMode;
      }>;
      if (customEvent.detail) {
        setRoute({
          tab: customEvent.detail.tab,
          prId: customEvent.detail.prId,
          filter: customEvent.detail.filter,
          authMode: customEvent.detail.authMode,
        });
      } else {
        setRoute(parseRoute());
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('app-route-change', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('app-route-change', handleRouteChange);
    };
  }, []);

  const navigate = useCallback((tab: NavTab, options?: NavigateOptions) => {
    navigateTo(tab, options);
  }, []);

  return {
    route,
    navigate,
  };
}
