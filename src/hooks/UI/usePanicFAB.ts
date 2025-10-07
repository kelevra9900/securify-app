import type { AlertCreatePayload } from '@/sockets/alert.types';
import type { GestureResponderEvent } from 'react-native';

import { useCallback, useState } from 'react';

import { useAlertSocket } from '@/sockets/useAlertSocket';
import { flashError, flashSuccess } from '@/utils/flashMessageHelper';

type TriggerOverrides = Partial<AlertCreatePayload> | undefined;

const isGestureEvent = (
  value: TriggerOverrides | GestureResponderEvent,
): value is GestureResponderEvent =>
  !!value && typeof value === 'object' && 'nativeEvent' in value;

export const usePanicFAB = (token: null | string) => {
  const { connected, createAlert, lastError, resetError, socket } =
    useAlertSocket(token);
  const [sending, setSending] = useState(false);

  const triggerSOS = useCallback(
    async (
      maybeOverrides?: TriggerOverrides | GestureResponderEvent,
    ) => {
      const overrides = isGestureEvent(maybeOverrides)
        ? undefined
        : maybeOverrides;
      if (!token) {
        flashError(
          'Sin sesión activa',
          'Inicia sesión para poder enviar una alerta SOS.',
        );
        return;
      }
      if (sending) {
        return;
      }
      if (!connected) {
        flashError(
          'Sin conexión',
          'Estamos reconectando para enviar tu SOS. Intenta nuevamente en unos segundos.',
        );
        socket?.connect();
        return;
      }

      setSending(true);
      resetError();

      try {
        await createAlert({
          content: 'panic_button',
          image: null,
          latitude: null,
          longitude: null,
          ...overrides,
        });
        flashSuccess('¡SOS enviado!', 'Un supervisor ha sido notificado.');
      } catch (error) {
        const raw = error instanceof Error ? error.message : undefined;
        const serverMessage = lastError?.message ?? raw;
        let description = serverMessage ?? 'Ocurrió un error inesperado.';
        if (serverMessage === 'too_many_requests') {
          description = 'Espera un momento antes de volver a enviar otro SOS.';
        } else if (serverMessage === 'unauthorized') {
          description =
            'Tu sesión no es válida. Vuelve a iniciar sesión e inténtalo otra vez.';
        } else if (
          serverMessage === 'timeout' ||
          raw === 'Alert creation timed out'
        ) {
          description =
            'No pudimos confirmar el SOS. Revisa tu conexión e inténtalo nuevamente.';
        }
        flashError('No se pudo enviar el SOS', description);
      } finally {
        setSending(false);
      }
    },
    [
      connected,
      createAlert,
      lastError?.message,
      resetError,
      sending,
      socket,
      token,
    ],
  );

  return {
    connected,
    lastError,
    sending,
    socket,
    triggerSOS,
  };
};
