/* eslint-disable no-console */
import type {
  AlertCreateOptions,
  AlertCreatePayload,
  AlertEmitEvents,
  AlertListenEvents,
  AlertSocketErrorPayload,
  AlertSocketResponse,
  AlertsSubscribeError,
  AlertsSubscribePayload,
} from './alert.types';
import type {Socket} from 'socket.io-client';

import NetInfo from '@react-native-community/netinfo';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AppState} from 'react-native';

import {createNamespaceSocket} from './factory';
import {useQueryClient} from '@tanstack/react-query';
import type {HomeData} from '@/types/home';
import type {ApiSummaryResponse} from '@/hooks/alerts/useSummaryReports';
import {ALERTS_SUMMARY_QK} from '@/hooks/alerts/useSummaryReports';

interface PendingCreate {
  cleanup: () => void;
  reject: (error: Error) => void;
}

type AlertSubscribeScope = {
  environmentId?: null | number;
  rooms?: string[];
  sectorId?: null | number;
  userId?: number;
};

export function useAlertSocket(
  token: null | string,
  scope?: AlertSubscribeScope | null,
) {
  const socket = useMemo<null | Socket<
    AlertListenEvents,
    AlertEmitEvents
  >>(() => {
    if (!token) {
      return null;
    }

    return createNamespaceSocket<AlertListenEvents,AlertEmitEvents>(
      '/alerts',
      token,
    );
  },[token]);

  const [connected,setConnected] = useState(false);
  const [lastCreatedAlert,setLastCreatedAlert] =
    useState<AlertSocketResponse | null>(null);
  const [lastBroadcastAlert,setLastBroadcastAlert] =
    useState<AlertSocketResponse | null>(null);
  const [lastUpdatedAlert,setLastUpdatedAlert] =
    useState<AlertSocketResponse | null>(null);
  const [lastPersonalAlertUpdate,setLastPersonalAlertUpdate] =
    useState<AlertSocketResponse | null>(null);
  const [lastError,setLastError] = useState<AlertSocketErrorPayload | null>(
    null,
  );
  const [subscribeError,setSubscribeError] =
    useState<AlertsSubscribeError | null>(null);
  const [subscribedRooms,setSubscribedRooms] = useState<string[]>([]);

  const pendingCreateRef = useRef<null | PendingCreate>(null);
  const scopeRef = useRef<AlertSubscribeScope | null>(scope ?? null);
  const queryClient = useQueryClient();

  useEffect(() => {
    scopeRef.current = scope ?? null;
  },[scope]);

  const applyAlertUpdate = useCallback(
    (incoming: AlertSocketResponse | null) => {
      if (!incoming || typeof incoming.id !== 'number') {
        return;
      }

      queryClient.setQueriesData<HomeData | undefined>(
        {queryKey: ['home']},
        (current) => {
          if (!current?.alerts?.recent) {
            return current;
          }

          const currentRecent = current.alerts.recent;
          const index = currentRecent.findIndex((item) => item.id === incoming.id);
          if (index === -1) {
            return current;
          }

          const updatedRecent = currentRecent.slice();
          const previous = updatedRecent[index];

          updatedRecent[index] = {
            ...previous,
            createdAt: incoming.createdAt ?? previous.createdAt,
            image: incoming.image ?? previous.image ?? null,
            latitude:
              typeof incoming.latitude === 'number'
                ? incoming.latitude
                : previous.latitude,
            longitude:
              typeof incoming.longitude === 'number'
                ? incoming.longitude
                : previous.longitude,
            status:
              (incoming.status as typeof previous.status | undefined) ??
              previous.status,
          };

          return {
            ...current,
            alerts: {
              ...current.alerts,
              recent: updatedRecent,
            },
          };
        },
      );

      queryClient.setQueriesData<ApiSummaryResponse | undefined>(
        {queryKey: ALERTS_SUMMARY_QK},
        (current) => {
          if (!current) {
            return current;
          }

          const index = current.recent.findIndex((item) => item.id === incoming.id);
          if (index === -1) {
            return current;
          }

          const updatedRecent = current.recent.slice();
          const previous = updatedRecent[index];

          updatedRecent[index] = {
            ...previous,
            createdAt: incoming.createdAt ?? previous.createdAt,
            image: incoming.image ?? previous.image,
            location: {
              lat:
                typeof incoming.latitude === 'number'
                  ? incoming.latitude
                  : previous.location.lat,
              lng:
                typeof incoming.longitude === 'number'
                  ? incoming.longitude
                  : previous.location.lng,
            },
            status:
              (incoming.status as typeof previous.status | undefined) ??
              previous.status,
            title: incoming.content ?? previous.title,
            updatedAt: incoming.updatedAt ?? previous.updatedAt,
          };

          return {
            ...current,
            recent: updatedRecent,
          };
        },
      );
    },
    [queryClient],
  );

  const emitSubscribe = useCallback(() => {
    if (!socket || !scopeRef.current || !scopeRef.current.userId) {
      return;
    }

    const payload: AlertsSubscribePayload = {
      userId: scopeRef.current.userId,
    };

    if (scopeRef.current.environmentId !== undefined) {
      payload.environmentId = scopeRef.current.environmentId;
    }

    if (scopeRef.current.sectorId !== undefined) {
      payload.sectorId = scopeRef.current.sectorId;
    }

    if (scopeRef.current.rooms?.length) {
      payload.rooms = scopeRef.current.rooms;
    }

    try {
      setSubscribeError(null);
      socket.emit('alerts:subscribe',payload);
    } catch (error) {
      setSubscribeError({
        code: 'emit_failed',
        message:
          error instanceof Error ? error.message : 'Failed to emit subscribe',
      });
    }
  },[socket]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onConnect = () => {
      setConnected(true);
      console.log('[/alerts] ✅ connected:',socket.id);
      emitSubscribe();
    };
    const onDisconnect = (reason?: string) => {
      setConnected(false);
      console.log('[/alerts] 🔴 disconnected:',reason);
    };
    const onConnectError = (err: unknown) => {
      const anyErr = err as {
        data?: unknown;
        description?: string;
        message?: string;
      };
      console.log(
        '[/alerts] ❌ connect_error:',
        anyErr?.message ?? anyErr?.description ?? anyErr,
      );
      if (anyErr?.data) {
        console.log('[/alerts] error.data:',anyErr.data);
      }
    };
    const onNewAlert: AlertListenEvents['alerts:new'] = (alert) => {
      console.log("Getting new alert",JSON.stringify(alert))
      setLastBroadcastAlert(alert);
    };
    const onAlertsUpdated: AlertListenEvents['alerts:updated'] = (alert) => {
      console.log("Alert updated",JSON.stringify(alert))
      setLastUpdatedAlert(alert);
      applyAlertUpdate(alert);
    };
    const onAlertsUpdateOk: AlertListenEvents['alerts:update:ok'] = (alert) => {
      setLastPersonalAlertUpdate(alert);
      applyAlertUpdate(alert);
    };
    const onSubscribeOk: AlertListenEvents['alerts:subscribe:ok'] = (ack) => {
      setSubscribedRooms(Array.isArray(ack?.rooms) ? ack.rooms : []);
      setSubscribeError(null);
    };
    const onSubscribeError: AlertListenEvents['alerts:subscribe:error'] = (
      errorPayload,
    ) => {
      setSubscribeError(errorPayload);
    };

    socket.on('connect',onConnect);
    socket.on('disconnect',onDisconnect);
    socket.on('connect_error',onConnectError);
    socket.on('alerts:new',onNewAlert);
    socket.on('alerts:updated',onAlertsUpdated);
    socket.on('alerts:update:ok',onAlertsUpdateOk);
    socket.on('alerts:subscribe:ok',onSubscribeOk);
    socket.on('alerts:subscribe:error',onSubscribeError);

    if (!socket.connected) {
      socket.connect();
    }

    const appSub = AppState.addEventListener('change',(state) => {
      if (state === 'active' && !socket.connected) {
        socket.connect();
      }
    });

    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected && !socket.connected) {
        socket.connect();
      }
      if (!state.isConnected && socket.connected) {
        socket.disconnect();
      }
    });

    return () => {
      const pending = pendingCreateRef.current;
      if (pending) {
        pending.reject(new Error('Alert socket disposed'));
      }
      socket.off('connect',onConnect);
      socket.off('disconnect',onDisconnect);
      socket.off('connect_error',onConnectError);
      socket.off('alerts:new',onNewAlert);
      socket.off('alerts:updated',onAlertsUpdated);
      socket.off('alerts:update:ok',onAlertsUpdateOk);
      socket.off('alerts:subscribe:ok',onSubscribeOk);
      socket.off('alerts:subscribe:error',onSubscribeError);
      appSub.remove();
      netSub();
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  },[socket,emitSubscribe,applyAlertUpdate]);

  const createAlert = useCallback(
    (payload: AlertCreatePayload,options?: AlertCreateOptions) => {
      if (!socket) {
        return Promise.reject(new Error('Socket not initialized'));
      }
      if (pendingCreateRef.current) {
        return Promise.reject(
          new Error('An alert creation is already in progress'),
        );
      }

      setLastError(null);

      return new Promise<AlertSocketResponse>((resolve,reject) => {
        let timeoutId: null | ReturnType<typeof setTimeout> = null;
        let cleaned = false;

        const cleanup = () => {
          if (cleaned) {
            return;
          }
          cleaned = true;
          socket.off('alerts:create:ok',handleOk);
          socket.off('alerts:create:error',handleError);
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          pendingCreateRef.current = null;
        };

        const handleOk: AlertListenEvents['alerts:create:ok'] = (alert) => {
          cleanup();
          setLastCreatedAlert(alert);
          resolve(alert);
        };

        const handleError: AlertListenEvents['alerts:create:error'] = (
          errorPayload,
        ) => {
          cleanup();
          setLastError(errorPayload);
          reject(new Error(errorPayload?.message ?? 'Alert creation failed'));
        };

        timeoutId = setTimeout(() => {
          cleanup();
          const timeoutError: AlertSocketErrorPayload = {
            code: 'timeout',
            message: 'timeout',
          };
          setLastError(timeoutError);
          reject(new Error('Alert creation timed out'));
        },options?.timeoutMs ?? 15_000);

        pendingCreateRef.current = {
          cleanup,
          reject: (error: Error) => {
            cleanup();
            reject(error);
          },
        };

        socket.once('alerts:create:ok',handleOk);
        socket.once('alerts:create:error',handleError);

        try {
          socket.emit('alerts:create',payload);
        } catch (error_) {
          const error =
            error_ instanceof Error
              ? error_
              : new Error('Failed to emit alert creation');
          cleanup();
          reject(error);
        }
      });
    },
    [socket],
  );

  const resetError = useCallback(() => {
    setLastError(null);
  },[]);

  useEffect(() => {
    if (!socket?.connected) {
      return;
    }

    const currentScope = scopeRef.current;
    if (!currentScope?.userId) {
      return;
    }

    emitSubscribe();
  },[
    emitSubscribe,
    scope?.environmentId,
    scope?.rooms,
    scope?.sectorId,
    scope?.userId,
    socket?.connected,
  ]);

  return {
    connected,
    createAlert,
    lastBroadcastAlert,
    lastCreatedAlert,
    lastError,
    lastPersonalAlertUpdate,
    lastUpdatedAlert,
    resetError,
    socket,
    subscribedRooms,
    subscribeError,
  };
}
