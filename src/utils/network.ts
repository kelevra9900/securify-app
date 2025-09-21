import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type OnlineCheck = {
  ok: boolean;
  state: NetInfoState;
};

// Consulta una vez el estado de red
export async function isOnline(): Promise<OnlineCheck> {
  const state = await NetInfo.fetch();
  const ok = Boolean(state.isConnected) && (state.isInternetReachable ?? true);
  return { ok, state };
}

// Suscripción conveniente para listeners puntuales
export function subscribeNetwork(
  cb: (state: NetInfoState) => void,
) {
  return NetInfo.addEventListener(cb);
}

