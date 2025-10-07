/* eslint-disable no-console */
import type {
  AlertCreateOptions,
  AlertCreatePayload,
  AlertEmitEvents,
  AlertListenEvents,
  AlertSocketErrorPayload,
  AlertSocketResponse,
} from './alert.types';
import type { Socket } from 'socket.io-client';

import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { createNamespaceSocket } from './factory';

interface PendingCreate {
  cleanup: () => void;
  reject: (error: Error) => void;
}

export function useAlertSocket(token: null | string) {
  const socket = useMemo<null | Socket<
    AlertListenEvents,
    AlertEmitEvents
  >>(() => {
    if (!token) {
      return null;
    }
    return createNamespaceSocket<AlertListenEvents, AlertEmitEvents>(
      '/alerts',
      token,
    );
  }, [token]);

  const [connected, setConnected] = useState(false);
  const [lastCreatedAlert, setLastCreatedAlert] =
    useState<AlertSocketResponse | null>(null);
  const [lastBroadcastAlert, setLastBroadcastAlert] =
    useState<AlertSocketResponse | null>(null);
  const [lastError, setLastError] = useState<AlertSocketErrorPayload | null>(
    null,
  );

  const pendingCreateRef = useRef<null | PendingCreate>(null);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onConnect = () => {
      setConnected(true);
      console.log('[/alerts] ✅ connected:', socket.id);
    };
    const onDisconnect = (reason?: string) => {
      setConnected(false);
      console.log('[/alerts] 🔴 disconnected:', reason);
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
        console.log('[/alerts] error.data:', anyErr.data);
      }
    };
    const onNewAlert: AlertListenEvents['alerts:new'] = (alert) => {
      setLastBroadcastAlert(alert);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('alerts:new', onNewAlert);

    if (!socket.connected) {
      socket.connect();
    }

    const appSub = AppState.addEventListener('change', (state) => {
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
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('alerts:new', onNewAlert);
      appSub.remove();
      netSub();
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [socket]);

  const createAlert = useCallback(
    (payload: AlertCreatePayload, options?: AlertCreateOptions) => {
      if (!socket) {
        return Promise.reject(new Error('Socket not initialized'));
      }
      if (pendingCreateRef.current) {
        return Promise.reject(
          new Error('An alert creation is already in progress'),
        );
      }

      setLastError(null);

      return new Promise<AlertSocketResponse>((resolve, reject) => {
        let timeoutId: null | ReturnType<typeof setTimeout> = null;
        let cleaned = false;

        const cleanup = () => {
          if (cleaned) {
            return;
          }
          cleaned = true;
          socket.off('alerts:create:ok', handleOk);
          socket.off('alerts:create:error', handleError);
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
        }, options?.timeoutMs ?? 15_000);

        pendingCreateRef.current = {
          cleanup,
          reject: (error: Error) => {
            cleanup();
            reject(error);
          },
        };

        socket.once('alerts:create:ok', handleOk);
        socket.once('alerts:create:error', handleError);

        try {
          socket.emit('alerts:create', payload);
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
  }, []);

  return {
    connected,
    createAlert,
    lastBroadcastAlert,
    lastCreatedAlert,
    lastError,
    resetError,
    socket,
  };
}
