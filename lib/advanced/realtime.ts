import { signal, computed, Signal, effect } from '@angular/core';

/**
 * TR: WebSocket bağlantı durumları.
 *
 * EN: WebSocket connection states.
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

/**
 * TR: Mesaj işleyici (Callback) fonksiyon tipi.
 *
 * EN: Message handler (Callback) function type.
 */
export type MessageHandler<T = unknown> = (data: T) => void;

/**
 * TR: WebSocket yapılandırma ayarları.
 * Otomatik yeniden bağlanma, Heartbeat (ping/pong) ve zaman aşımı ayarlarını içerir.
 *
 * EN: WebSocket configuration settings.
 * Includes auto-reconnect, Heartbeat (ping/pong), and timeout settings.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface WebSocketConfig {
  /**
   * TR: WebSocket sunucu adresi (ws:// veya wss://).
   *
   * EN: WebSocket server URL (ws:// or wss://).
   */
  url: string;

  /**
   * TR: Otomatik yeniden bağlanma aktif mi?
   *
   * EN: Is auto-reconnect enabled?
   */
  reconnect?: boolean;

  /**
   * TR: Maksimum yeniden bağlanma denemesi.
   *
   * EN: Maximum reconnect attempts.
   */
  maxReconnectAttempts?: number;

  /**
   * TR: İlk yeniden bağlanma gecikmesi (ms).
   *
   * EN: Initial reconnect delay (ms).
   */
  reconnectDelay?: number;

  /**
   * TR: Gecikme artış çarpanı (Backoff Multiplier).
   *
   * EN: Reconnect delay multiplier (Backoff Multiplier).
   */
  reconnectDelayMultiplier?: number;

  /**
   * TR: Maksimum bekleme süresi (ms).
   *
   * EN: Maximum reconnect delay (ms).
   */
  maxReconnectDelay?: number;

  /**
   * TR: Heartbeat (Canlılık kontrolü) aralığı (ms).
   *
   * EN: Heartbeat interval (ms).
   */
  heartbeatInterval?: number;

  /**
   * TR: Sunucuya gönderilecek Heartbeat mesajı.
   *
   * EN: Heartbeat message to send to server.
   */
  heartbeatMessage?: string | object;

  /**
   * TR: Bağlantı zaman aşımı süresi (ms).
   *
   * EN: Connection timeout duration (ms).
   */
  connectionTimeout?: number;

  /**
   * TR: WebSocket alt protokolleri.
   *
   * EN: WebSocket sub-protocols.
   */
  protocols?: string | string[];

  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
}

interface Subscription {
  event: string;
  handler: MessageHandler;
}

/**
 * TR: Gerçek Zamanlı WebSocket Bağlantı Yöneticisi.
 * Bağlantı kopmalarını otomatik yönetir, mesajları kuyruklar ve tip güvenli olay (Event) sistemi sunar.
 * Angular Signals ile entegre çalışarak bağlantı durumunu reaktif hale getirir.
 *
 * EN: Real-time WebSocket Connection Manager.
 * Automatically manages disconnections, queues messages, and offers a type-safe event system.
 * Integrates with Angular Signals to make connection status reactive.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class RealtimeConnection {
  private socket: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private subscriptions = new Map<string, Set<MessageHandler>>();
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimer: ReturnType<typeof setTimeout> | null = null;
  private messageQueue: Array<string | object> = [];

  private _state = signal<ConnectionState>('disconnected');
  private _lastMessage = signal<unknown>(null);
  private _error = signal<string | null>(null);

  /**
   * TR: Bağlantı durumu sinyali (Readonly).
   *
   * EN: Connection state signal (Readonly).
   */
  readonly state = this._state.asReadonly();

  /**
   * TR: Bağlı olup olmadığını belirten computed sinyal.
   *
   * EN: Computed signal indicating if connected.
   */
  readonly isConnected = computed(() => this._state() === 'connected');

  readonly lastMessage = this._lastMessage.asReadonly();
  readonly error = this._error.asReadonly();

  constructor(config: WebSocketConfig) {
    this.config = {
      url: config.url,
      reconnect: config.reconnect ?? true,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      reconnectDelay: config.reconnectDelay ?? 1000,
      reconnectDelayMultiplier: config.reconnectDelayMultiplier ?? 1.5,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000,
      heartbeatInterval: config.heartbeatInterval ?? 30000,
      heartbeatMessage: config.heartbeatMessage ?? 'ping',
      connectionTimeout: config.connectionTimeout ?? 10000,
      protocols: config.protocols ?? [],
      onOpen: config.onOpen ?? (() => {}),
      onClose: config.onClose ?? (() => {}),
      onError: config.onError ?? (() => {}),
    };
  }

  /**
   * TR: WebSocket sunucusuna bağlanır.
   * Zaman aşımı kontrolü başlatır ve olay dinleyicilerini (Event Listeners) kurar.
   *
   * EN: Connects to the WebSocket server.
   * Starts timeout check and sets up Event Listeners.
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this._state.set('connecting');
    this._error.set(null);

    try {
      this.socket = new WebSocket(
        this.config.url,
        this.config.protocols
      );

      // TR: Bağlantı zaman aşımı kontrolü
      // EN: Connection timeout check
      this.connectionTimer = setTimeout(() => {
        if (this._state() === 'connecting') {
          this.socket?.close();
          this._error.set('Bağlantı zaman aşımı');
          this._state.set('error');
        }
      }, this.config.connectionTimeout);

      this.socket.onopen = () => this.handleOpen();
      this.socket.onclose = (event) => this.handleClose(event);
      this.socket.onerror = (event) => this.handleError(event);
      this.socket.onmessage = (event) => this.handleMessage(event);
    } catch (e) {
      this._error.set((e as Error).message);
      this._state.set('error');
    }
  }

  /**
   * TR: Bağlantıyı manuel olarak kapatır ve temizlik yapar.
   *
   * EN: Manually closes the connection and performs cleanup.
   */
  disconnect(): void {
    this.cleanup();
    this.socket?.close(1000, 'Client disconnect');
    this._state.set('disconnected');
  }

  /**
   * TR: Sunucuya mesaj gönderir.
   * Bağlantı yoksa mesajı kuyruğa (Queue) ekler, bağlantı sağlandığında otomatik gönderir.
   *
   * EN: Sends message to server.
   * If not connected, adds message to Queue, sends automatically when connected.
   *
   * @param data - TR: Gönderilecek veri (String veya Object). / EN: Data to send (String or Object).
   * @returns TR: Gönderildi mi? (Queue'ya eklendiyse false). / EN: Sent? (False if queued).
   */
  send(data: string | object): boolean {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return true;
    }

    // TR: Mesajı daha sonra göndermek için kuyruğa al
    // EN: Queue message to send later
    this.messageQueue.push(data);
    return false;
  }

  /**
   * TR: Tip güvenli olay (Event) gönderir.
   * `{ event: 'message', data: ... }` formatında veri paketler.
   *
   * EN: Sends a type-safe Event.
   * Packages data in `{ event: 'message', data: ... }` format.
   */
  emit<T>(event: string, data?: T): boolean {
    return this.send({ event, data });
  }

  /**
   * TR: Belirli bir olaya (Event) abone olur.
   * Aboneliği iptal etmek için bir fonksiyon döndürür (Unsubscribe function).
   *
   * EN: Subscribes to a specific Event.
   * Returns a function to cancel subscription (Unsubscribe function).
   */
  on<T>(event: string, handler: MessageHandler<T>): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }

    this.subscriptions.get(event)!.add(handler as MessageHandler);

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(event)?.delete(handler as MessageHandler);
    };
  }

  /**
   * TR: Bir olaya sadece bir kez abone olur.
   * Olay tetiklendiğinde otomatik olarak aboneliği kaldırır.
   *
   * EN: Subscribes to an event only once.
   * Automatically unsubscribes when the event is triggered.
   */
  once<T>(event: string, handler: MessageHandler<T>): () => void {
    const wrappedHandler: MessageHandler<T> = (data) => {
      handler(data);
      unsubscribe();
    };

    const unsubscribe = this.on(event, wrappedHandler);
    return unsubscribe;
  }

  /**
   * TR: Olay aboneliğini kaldırır.
   * Handler verilmezse o olaya ait tüm dinleyicileri siler.
   *
   * EN: Removes event subscription.
   * If no handler provided, deletes all listeners for that event.
   */
  off(event: string, handler?: MessageHandler): void {
    if (handler) {
      this.subscriptions.get(event)?.delete(handler);
    } else {
      this.subscriptions.delete(event);
    }
  }

  /**
   * TR: Tüm olay aboneliklerini temizler.
   *
   * EN: Clears all event subscriptions.
   */
  offAll(): void {
    this.subscriptions.clear();
  }

  // Private methods

  private handleOpen(): void {
    this.clearConnectionTimer();
    this._state.set('connected');
    this.reconnectAttempts = 0;
    this.config.onOpen();

    // Start heartbeat
    this.startHeartbeat();

    // Send queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.send(message);
    }
  }

  private handleClose(event: CloseEvent): void {
    this.cleanup();
    this.config.onClose(event);

    // Normal close
    if (event.code === 1000) {
      this._state.set('disconnected');
      return;
    }

    // Attempt reconnect
    if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this._state.set('disconnected');
    }
  }

  private handleError(event: Event): void {
    this._error.set('WebSocket hatası');
    this.config.onError(event);
  }

  private handleMessage(event: MessageEvent): void {
    let data: unknown;

    try {
      data = JSON.parse(event.data);
    } catch {
      data = event.data;
    }

    this._lastMessage.set(data);

    // Handle typed events
    if (typeof data === 'object' && data !== null && 'event' in data) {
      const { event: eventName, data: eventData } = data as { event: string; data: unknown };
      this.dispatch(eventName, eventData);
    }

    // Always dispatch to wildcard handlers
    this.dispatch('*', data);
  }

  private dispatch(event: string, data: unknown): void {
    const handlers = this.subscriptions.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (e) {
          console.error(`Error in handler for event "${event}":`, e);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    this._state.set('reconnecting');
    this.reconnectAttempts++;

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(this.config.reconnectDelayMultiplier, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.config.heartbeatInterval <= 0) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send(this.config.heartbeatMessage);
      }
    }, this.config.heartbeatInterval);
  }

  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
  }

  private cleanup(): void {
    this.clearConnectionTimer();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

/**
 * TR: Yeni bir RealtimeConnection örneği oluşturur.
 *
 * EN: Creates a new RealtimeConnection instance.
 */
export function createRealtimeConnection(config: WebSocketConfig): RealtimeConnection {
  return new RealtimeConnection(config);
}

/**
 * TR: Gerçek zamanlı kullanıcı varlığı (Presence) bilgisi.
 * Kullanıcı durumu (Online/Away) ve son görülme zamanını içerir.
 *
 * EN: Real-time user presence info.
 * Includes user status (Online/Away) and last seen time.
 */
export interface PresenceUser {
  id: string;
  name?: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  lastSeen: number;
  meta?: Record<string, unknown>;
}

export interface PresenceState {
  users: Signal<PresenceUser[]>;
  count: Signal<number>;
  currentUser: Signal<PresenceUser | null>;
  join: (user: Omit<PresenceUser, 'lastSeen'>) => void;
  leave: () => void;
  updateStatus: (status: PresenceUser['status']) => void;
  updateMeta: (meta: Record<string, unknown>) => void;
}

/**
 * TR: Bir kanal üzerindeki kullanıcı varlığını (Presence) yöneten durum.
 * "Kimler online?" listesini yönetir.
 *
 * EN: State managing user presence on a channel.
 * Manages the "Who is online?" list.
 */
export function createPresence(
  connection: RealtimeConnection,
  channel: string,
  userId: string
): PresenceState {
  const users = signal<PresenceUser[]>([]);
  const currentUser = signal<PresenceUser | null>(null);

  const count = computed(() => users().length);

  // Subscribe to presence events
  connection.on<PresenceUser[]>(`${channel}:presence:sync`, (allUsers) => {
    users.set(allUsers);
  });

  connection.on<PresenceUser>(`${channel}:presence:join`, (user) => {
    users.update((list) => {
      const exists = list.some((u) => u.id === user.id);
      if (exists) {
        return list.map((u) => (u.id === user.id ? user : u));
      }
      return [...list, user];
    });
  });

  connection.on<string>(`${channel}:presence:leave`, (leftUserId) => {
    users.update((list) => list.filter((u) => u.id !== leftUserId));
  });

  const join = (user: Omit<PresenceUser, 'lastSeen'>) => {
    const fullUser: PresenceUser = {
      ...user,
      lastSeen: Date.now(),
    };
    currentUser.set(fullUser);
    connection.emit(`${channel}:presence:join`, fullUser);
  };

  const leave = () => {
    connection.emit(`${channel}:presence:leave`, userId);
    currentUser.set(null);
  };

  const updateStatus = (status: PresenceUser['status']) => {
    if (!currentUser()) return;
    currentUser.update((u) => u ? { ...u, status } : null);
    connection.emit(`${channel}:presence:update`, { userId, status });
  };

  const updateMeta = (meta: Record<string, unknown>) => {
    if (!currentUser()) return;
    currentUser.update((u) => u ? { ...u, meta: { ...u.meta, ...meta } } : null);
    connection.emit(`${channel}:presence:update`, { userId, meta });
  };

  return {
    users: users.asReadonly(),
    count,
    currentUser: currentUser.asReadonly(),
    join,
    leave,
    updateStatus,
    updateMeta,
  };
}

/**
 * TR: Publish/Subscribe (Yayınla/Abone Ol) kanalı.
 * Belirli bir konudaki (Topic) mesajları dinlemek ve göndermek için kullanılır.
 *
 * EN: Publish/Subscribe channel.
 * Used to listen to and send messages on a specific Topic.
 */
export interface Channel<T = unknown> {
  name: string;
  messages: Signal<T[]>;
  lastMessage: Signal<T | null>;
  subscribe: (handler: MessageHandler<T>) => () => void;
  publish: (data: T) => void;
  history: (limit?: number) => T[];
  clear: () => void;
}

/**
 * TR: Yeni bir kanal oluşturur.
 * Kanal mesajlarını saklar (History) ve reaktif olarak sunar.
 *
 * EN: Creates a new channel.
 * Stores channel messages (History) and presents them reactively.
 */
export function createChannel<T>(
  connection: RealtimeConnection,
  name: string,
  options: { maxHistory?: number } = {}
): Channel<T> {
  const { maxHistory = 100 } = options;

  const messages = signal<T[]>([]);
  const lastMessage = signal<T | null>(null);

  // Subscribe to channel messages
  connection.on<T>(`channel:${name}`, (data) => {
    lastMessage.set(data);
    messages.update((list) => {
      const newList = [...list, data];
      if (newList.length > maxHistory) {
        return newList.slice(-maxHistory);
      }
      return newList;
    });
  });

  const subscribe = (handler: MessageHandler<T>): (() => void) => {
    return connection.on<T>(`channel:${name}`, handler);
  };

  const publish = (data: T) => {
    connection.emit(`channel:${name}`, data);
  };

  const history = (limit?: number): T[] => {
    const list = messages();
    return limit ? list.slice(-limit) : list;
  };

  const clear = () => {
    messages.set([]);
    lastMessage.set(null);
  };

  return {
    name,
    messages: messages.asReadonly(),
    lastMessage: lastMessage.asReadonly(),
    subscribe,
    publish,
    history,
    clear,
  };
}