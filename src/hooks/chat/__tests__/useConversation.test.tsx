import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { useConversation } from '@/hooks/chat/useConversation';

// Mock data service to avoid network
jest.mock('@/data/services/chat', () => ({
  getConversationMessages: jest.fn(async () => ({
    hasMore: false,
    nextCursor: null,
    items: [
      {
        id: 1,
        conversationId: 10,
        content: 'hist-1',
        createdAt: new Date().toISOString(),
        fromUserId: 99,
        toUserId: null,
        clientId: 'c1',
      },
      {
        id: 2,
        conversationId: 10,
        content: 'hist-2',
        createdAt: new Date().toISOString(),
        fromUserId: 99,
        toUserId: null,
        clientId: 'c2',
      },
    ],
  })),
}));

// Fake socket and hook
class MockSock {
  public on = jest.fn((event: string, cb: any) => {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), cb]);
  });
  public off = jest.fn((event: string, cb: any) => {
    const list = this.handlers.get(event) ?? [];
    this.handlers.set(
      event,
      list.filter((h) => h !== cb),
    );
  });
  public emit = jest.fn((_e: string, _p: any) => {});
  private handlers = new Map<string, any[]>();
  public emitLocal(event: string, payload: any) {
    (this.handlers.get(event) ?? []).forEach((cb) => cb(payload));
  }
}
jest.mock('@/hooks/chat/useChatSocket', () => {
  class mockSock {
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
    public emit = jest.fn((_e: string, _p: any) => {});
    private handlers = new Map<string, any[]>();
    public emitLocal(event: string, payload: any) {
      (this.handlers.get(event) ?? []).forEach((cb) => cb(payload));
    }
  }
  const state = { sock: new (mockSock as any)() };
  return {
    __esModule: true,
    useChatSocket: () => ({ connected: true, socket: state.sock }),
    __mock: state,
  };
});

function Holder({ id }: { id: number }) {
  const { messages } = useConversation(id);
  return <Text testID="msgs">{JSON.stringify(messages.map((m) => m.id))}</Text>;
}

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('useConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('emite join_conversation y escucha mensajes live', async () => {
    renderWithClient(<Holder id={10} />);

    // join room
    const { __mock } = require('@/hooks/chat/useChatSocket');
    const sock = __mock.sock as InstanceType<typeof MockSock>;
    await waitFor(() =>
      expect(sock.emit).toHaveBeenCalledWith('join_conversation', {
        conversationId: 10,
      }),
    );

    // history present
    await waitFor(() =>
      expect(screen.getByTestId('msgs').props.children).toBe(
        JSON.stringify([1, 2]),
      ),
    );

    // incoming live message (same conversation)
    sock.emitLocal('message', {
      id: 3,
      conversationId: 10,
      content: 'hi',
      createdAt: new Date().toISOString(),
      fromUserId: 1,
      toUserId: null,
      clientId: 'cx',
    });
    await waitFor(() =>
      expect(screen.getByTestId('msgs').props.children).toBe(
        JSON.stringify([3, 1, 2]),
      ),
    );

    // duplicate should be ignored
    sock.emitLocal('message', {
      id: 3,
      conversationId: 10,
      content: 'dup',
      createdAt: new Date().toISOString(),
      fromUserId: 1,
      toUserId: null,
      clientId: 'cx',
    });
    await waitFor(() =>
      expect(screen.getByTestId('msgs').props.children).toBe(
        JSON.stringify([3, 1, 2]),
      ),
    );

    // message from other conversation ignored
    sock.emitLocal('message', {
      id: 4,
      conversationId: 999,
      content: 'skip',
      createdAt: new Date().toISOString(),
      fromUserId: 1,
      toUserId: null,
      clientId: 'cy',
    });
    await waitFor(() =>
      expect(screen.getByTestId('msgs').props.children).toBe(
        JSON.stringify([3, 1, 2]),
      ),
    );
  });
});
