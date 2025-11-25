import type { SocketEventsMap, SocketHandler } from './events.base';

export interface AlertCreatePayload {
  content: string;
  image?: null | string;
  latitude?: null | number | string;
  longitude?: null | number | string;
}

export interface AlertSocketResponse extends Record<string, unknown> {
  content?: null | string;
  createdAt?: string;
  id: number;
  image?: null | string;
  latitude?: null | number;
  longitude?: null | number;
  updatedAt?: string;
}

export interface AlertSocketErrorPayload extends Record<string, unknown> {
  code?: string;
  message: string;
}

export interface AlertsSubscribePayload {
  environmentId?: null | number;
  rooms?: string[];
  sectorId?: null | number;
  userId: number;
}

export interface AlertsSubscribeAck {
  rooms: string[];
}

export interface AlertsSubscribeError extends Record<string, unknown> {
  code?: string;
  message: string;
}

export interface AlertListenEvents extends SocketEventsMap {
  'alerts:create:error': SocketHandler<[AlertSocketErrorPayload]>;
  'alerts:create:ok': SocketHandler<[AlertSocketResponse]>;
  'alerts:new': SocketHandler<[AlertSocketResponse]>;
  'alerts:subscribe:error': SocketHandler<[AlertsSubscribeError]>;
  'alerts:subscribe:ok': SocketHandler<[AlertsSubscribeAck]>;
  'alerts:update:ok': SocketHandler<[AlertSocketResponse]>;
  'alerts:updated': SocketHandler<[AlertSocketResponse]>;
}

export interface AlertEmitEvents extends SocketEventsMap {
  'alerts:create': SocketHandler<[AlertCreatePayload]>;
  'alerts:subscribe': SocketHandler<[AlertsSubscribePayload]>;
}

export interface AlertCreateOptions {
  timeoutMs?: number;
}
