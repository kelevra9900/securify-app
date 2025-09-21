/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {act,render,screen,waitFor} from '@testing-library/react-native';
import React,{useEffect,useState} from 'react';
import {Text} from 'react-native';

import {
  TrackSocketProvider,
  useTrackSocketContext,
} from '@/sockets/TrackSocketProvider';

// Mock factory to return a controllable FakeSocket per token
jest.mock('@/sockets/factory',() => {
  class mockFakeSocket {
    public connected = false;
    public id: string | undefined;
    public connect = jest.fn(() => {
      this.connected = true;
      this.id = 'sock-ctx';
      this.emitLocal('connect');
    });
    public disconnect = jest.fn(() => {
      this.connected = false;
      this.emitLocal('disconnect','client_disconnect');
    });
    public emit = jest.fn((_event: string,_payload: unknown) => { });
    private handlers = new Map<string,any[]>();
    public off = jest.fn((event: string,cb: any) => {
      const list = this.handlers.get(event) ?? [];
      this.handlers.set(
        event,
        list.filter((h) => h !== cb),
      );
    });
    public on = jest.fn((event: string,cb: any) => {
      this.handlers.set(event,[...(this.handlers.get(event) ?? []),cb]);
    });

    public removeAllListeners = jest.fn(() => {
      this.handlers.clear();
    });
    public emitLocal(event: string,...args: any[]) {
      const list = this.handlers.get(event) ?? [];
      list.forEach((h) => h(...args));
    }
  }

  const instances: Record<string,any> = {};
  return {
    createNamespaceSocket: (_ns: string,token: string) => {
      if (!instances[token]) {instances[token] = new (mockFakeSocket as any)();}
      return instances[token];
    },
  };
});

// Keep NetInfo quiet and controllable
jest.mock('@react-native-community/netinfo',() => {
  const listeners = new Set<any>();
  const api = {
    __emit: (state: any) => {
      listeners.forEach((cb) => cb(state));
    },
    addEventListener: (cb: any) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
  return {__esModule: true,default: api};
});

function Consumer() {
  const {connected,socket} = useTrackSocketContext();
  const [users,setUsers] = useState<string>('none');
  const [skipReason,setSkipReason] = useState<string>('');

  useEffect(() => {
    socket?.on(
      'realtime_user_list',
      (list: Array<{firstName: string; id: number; lastName: string}>) => {
        setUsers(list.map((u) => `${u.id}:${u.firstName}`).join(','));
      },
    );
    socket?.on('tracker:location:skip',({reason}: {reason: string}) => {
      setSkipReason(reason);
    });
  },[socket]);

  return (
    <>
      <Text testID="connected">{String(connected)}</Text>
      <Text testID="users">{users}</Text>
      <Text testID="skip">{skipReason}</Text>
    </>
  );
}

describe('TrackSocketProvider + context + server events',() => {
  test('provee el socket y refleja eventos del servidor',async () => {
    render(
      <TrackSocketProvider token="ctx-token">
        <Consumer />
      </TrackSocketProvider>,
    );

    // espera conexión
    await waitFor(() =>
      expect(screen.getByTestId('connected').props.children).toBe('true'),
    );

    // Recupera el socket fake y emite eventos server->client
    const {createNamespaceSocket} = require('@/sockets/factory');
    const sock = createNamespaceSocket('/tracker','ctx-token');

    const sampleUsers = [
      {firstName: 'Ana',id: 1,lastName: 'G.'},
      {firstName: 'Luis',id: 2,lastName: 'P.'},
    ];
    await act(async () => {
      sock.emitLocal('realtime_user_list',sampleUsers);
    });
    await waitFor(() =>
      expect(screen.getByTestId('users').props.children).toBe('1:Ana,2:Luis'),
    );

    await act(async () => {
      sock.emitLocal('tracker:location:skip',{reason: 'throttled'});
    });
    await waitFor(() =>
      expect(screen.getByTestId('skip').props.children).toBe('throttled'),
    );
  });
});
