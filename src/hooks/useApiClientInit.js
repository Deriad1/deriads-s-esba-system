/**
 * Hook to initialize API client with online/offline context
 * This must be called in a component that has access to OnlineOfflineContext
 */

import { useEffect } from 'react';
import { useOnlineOffline } from '../context/OnlineOfflineContext';
import { setOnlineOfflineContext } from '../api-client';

export const useApiClientInit = () => {
  const onlineOfflineContext = useOnlineOffline();

  useEffect(() => {
    // Set the context reference in api-client
    setOnlineOfflineContext(onlineOfflineContext);
  }, [onlineOfflineContext]);
};

export default useApiClientInit;
