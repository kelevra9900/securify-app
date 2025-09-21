/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {act,cleanup,render} from '@testing-library/react-native';
import React from 'react';
import {AppState} from 'react-native';

import {useTrackSocket} from '@/sockets/useTrackSocket';

// Mock factory to return our FakeSocket instance per token
jest.mock('@/sockets/factory',() => {
  class mockFakeSocket {
    public connected = false;
    public id: string | undefined;

    public connect = jest.fn(() => {
      this.connected = true;
      this.id = 'sock-1';
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

// Mock NetInfo with a programmable emitter (default export)
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

describe('useTrackSocket',() => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  function TestComp({token}: {token: null | string}) {
    useTrackSocket(token);
    return null;
  }

  test('crea socket del namespace /tracker y conecta en mount',async () => {
    const {unmount} = render(<TestComp token="token-1" />);
    // Access the fake socket used via our mock
    const {createNamespaceSocket} = require('@/sockets/factory');
    const sock = createNamespaceSocket('/tracker','token-1');

    expect(sock.connect).toHaveBeenCalledTimes(1);
    expect(sock.connected).toBe(true);

    unmount();
    expect(sock.removeAllListeners).toHaveBeenCalled();
    expect(sock.disconnect).toHaveBeenCalled();
  });

  test('reconecta al volver a foreground (AppState active) si estaba desconectado',async () => {
    // Spy AppState to capture callback
    let appCb: ((s: string) => void) | null = null;
    const remove = jest.fn();
    jest
      .spyOn(AppState,'addEventListener')
      .mockImplementation((_type: any,cb: any) => {
        appCb = cb;
        return {remove} as any;
      });

    render(<TestComp token="token-2" />);
    const {createNamespaceSocket} = require('@/sockets/factory');
    const sock = createNamespaceSocket('/tracker','token-2');

    // Simula estado desconectado
    sock.connected = false;
    sock.connect.mockClear();

    // Dispara AppState -> active
    await act(async () => {
      appCb?.('active');
    });
    expect(sock.connect).toHaveBeenCalledTimes(1);
  });

  test('gestiona reconexión según NetInfo.isConnected',async () => {
    render(<TestComp token="token-3" />);
    const {createNamespaceSocket} = require('@/sockets/factory');
    const sock = createNamespaceSocket('/tracker','token-3');

    sock.connect.mockClear();
    sock.disconnect.mockClear();

    // Red desconectada -> si estaba conectado, debe desconectar
    const NetInfo: any = require('@react-native-community/netinfo').default;
    await act(async () => {
      NetInfo.__emit({isConnected: false});
    });
    expect(sock.disconnect).toHaveBeenCalledTimes(1);

    // Red conectada -> si no está conectado, debe conectar
    sock.connect.mockClear();
    sock.connected = false;
    await act(async () => {
      NetInfo.__emit({isConnected: true});
    });
    expect(sock.connect).toHaveBeenCalledTimes(1);
  });

  test('sendLocation emite con throttle y payload correcto',async () => {
    jest.useFakeTimers();
    let api: null | ReturnType<typeof useTrackSocket> = null;
    function Holder() {
      api = useTrackSocket('token-4');
      return null;
    }
    render(<Holder />);
    const {createNamespaceSocket} = require('@/sockets/factory');
    const sock = createNamespaceSocket('/tracker','token-4');

    // Asegura conectado
    expect(sock.connected).toBe(true);
    sock.emit.mockClear();

    api!.sendLocation(1.23,4.56,2000);
    api!.sendLocation(7.89,0.12,2000); // dentro del throttle -> ignorada
    expect(sock.emit).toHaveBeenCalledTimes(1);
    expect(sock.emit).toHaveBeenCalledWith('new_location',{
      latitude: 1.23,
      longitude: 4.56,
    });

    jest.advanceTimersByTime(2100);
    api!.sendLocation(7.89,0.12,2000);
    expect(sock.emit).toHaveBeenCalledTimes(2);
    expect(sock.emit).toHaveBeenLastCalledWith('new_location',{
      latitude: 7.89,
      longitude: 0.12,
    });

    jest.useRealTimers();
  });
});
