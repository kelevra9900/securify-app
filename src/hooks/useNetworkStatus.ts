import {useEffect,useState} from 'react';
import NetInfo,{type NetInfoState} from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [state,setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setState(s));
    // hydrate initial state if not set
    if (!state) {
      NetInfo.fetch().then(setState).catch(() => { });
    }
    return () => unsub();
  },[]);

  const isOnline = Boolean(state?.isConnected) && (state?.isInternetReachable ?? true);

  return {isOnline,state};
}

