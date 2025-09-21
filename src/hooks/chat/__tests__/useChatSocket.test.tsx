import { act, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { useChatSocket } from '@/hooks/chat/useChatSocket';

// Mock redux token selector
jest.mock('react-redux', () => ({
  useSelector: (fn: any) => fn({ auth: { token: 'test-token' } }),
}));

// Minimal fake socket with eventing
class MockSocket {
  public connected = false;
  public on = jest.fn((event: string, cb: any) => {
    const list = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...list, cb]);
  });
  public off = jest.fn((event: string, cb: any) => {
    const list = this.handlers.get(event) ?? [];
    this.handlers.set(
      event,
      list.filter((h) => h !== cb),
    );
  });
  public removeAllListeners = jest.fn(() => this.handlers.clear());
  public disconnect = jest.fn(() => {
    this.connected = false;
    this.emitLocal('disconnect');
  });
  public emit = jest.fn((_e: string, _p?: any) => {});
  private handlers = new Map<string, any[]>();
  public emitLocal(event: string, ...args: any[]) {
    const list = this.handlers.get(event) ?? [];
    list.forEach((h) => h(...args));
  }
}

// Mock socket.io-client to return our mock socket and expose instances
const instances: MockSocket[] = [];
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => {
    const s = new (MockSocket as any)() as MockSocket;
    instances.push(s);
    return s;
  }),
}));

let api: ReturnType<typeof useChatSocket> | null = null;
function Holder() {
  api = useChatSocket();
  return <Text testID="status">{String(api.connected)}</Text>;
}

describe('useChatSocket', () => {
  beforeEach(() => {
    instances.length = 0;
    api = null;
    jest.clearAllMocks();
  });

  test('conecta y actualiza estado connected según eventos', async () => {
    render(<Holder />);
    const sock = instances[0];
    expect(sock).toBeDefined();

    // simulate connect
    await act(async () => {
      sock.emitLocal('connect');
    });
    await waitFor(() =>
      expect(screen.getByTestId('status').props.children).toBe('true'),
    );

    // simulate disconnect
    await act(async () => {
      sock.emitLocal('disconnect');
    });
    await waitFor(() =>
      expect(screen.getByTestId('status').props.children).toBe('false'),
    );
  });

  test('emit helper delega en socket.emit', () => {
    render(<Holder />);
    const sock = instances[0];
    api!.emit('send_message', { conversationId: 1, message: 'hola' } as any);
    expect(sock.emit).toHaveBeenCalledWith('send_message', {
      conversationId: 1,
      message: 'hola',
    });
  });

  test('on helper registra y desregistra', () => {
    render(<Holder />);
    const sock = instances[0];
    const cb = jest.fn();
    const off = api!.on('message', cb as any);
    expect(sock.on).toHaveBeenCalled();
    off();
    expect(sock.off).toHaveBeenCalled();
  });

  test('cleanup al unmount: removeAllListeners + disconnect', () => {
    const { unmount } = render(<Holder />);
    const sock = instances[0];
    unmount();
    expect(sock.removeAllListeners).toHaveBeenCalled();
    expect(sock.disconnect).toHaveBeenCalled();
  });
});
