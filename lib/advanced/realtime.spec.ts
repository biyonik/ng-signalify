import {
    RealtimeConnection,
    createRealtimeConnection,
    createChannel,
    createPresence,
    ConnectionState
} from './realtime';

// Mock WebSocket
class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    readyState = MockWebSocket.CONNECTING;
    onopen: (() => void) | null = null;
    onclose: ((event: Partial<CloseEvent>) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    onmessage: ((event: Partial<MessageEvent>) => void) | null = null;

    constructor(public url: string, public protocols?: string | string[]) {
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            this.onopen?.();
        }, 10);
    }

    send = jest.fn();
    close = jest.fn((code?: number) => {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ code: code ?? 1000, reason: '', wasClean: true });
    });

    // Test helpers
    simulateMessage(data: unknown) {
        this.onmessage?.({ data: JSON.stringify(data) });
    }

    simulateError() {
        this.onerror?.(new Event('error'));
    }

    simulateClose(code = 1000) {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.({ code, reason: '', wasClean: true });
    }
}

// Replace global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('RealtimeConnection', () => {
    let connection: RealtimeConnection;

    beforeEach(() => {
        jest.useFakeTimers();
        connection = createRealtimeConnection({
            url: 'wss://test.example.com',
            reconnect: true,
            maxReconnectAttempts: 3,
            reconnectDelay: 1000,
            heartbeatInterval: 0, // Disable for tests
        });
    });

    afterEach(() => {
        connection.destroy();
        jest.useRealTimers();
    });

    describe('connect', () => {
        it('bağlantı durumu connecting olarak başlamalı', () => {
            connection.connect();
            expect(connection.state()).toBe('connecting');
        });

        it('bağlantı başarılı olunca connected olmalı', () => {
            connection.connect();
            jest.advanceTimersByTime(20);
            expect(connection.state()).toBe('connected');
        });

        it('isConnected computed doğru hesaplanmalı', () => {
            expect(connection.isConnected()).toBe(false);
            connection.connect();
            jest.advanceTimersByTime(20);
            expect(connection.isConnected()).toBe(true);
        });
    });

    describe('disconnect', () => {
        it('manuel disconnect sonrası disconnected olmalı', () => {
            connection.connect();
            jest.advanceTimersByTime(20);

            connection.disconnect();
            expect(connection.state()).toBe('disconnected');
        });
    });

    describe('send', () => {
        it('bağlıyken mesaj göndermeli', () => {
            connection.connect();
            jest.advanceTimersByTime(20);

            const result = connection.send({ type: 'test' });
            expect(result).toBe(true);
        });

        it('bağlı değilken mesajı kuyruğa almalı', () => {
            const result = connection.send({ type: 'test' });
            expect(result).toBe(false);
        });

        it('bağlandığında kuyruk boşaltılmalı', () => {
            connection.send({ type: 'queued1' });
            connection.send({ type: 'queued2' });

            connection.connect();
            jest.advanceTimersByTime(20);

            // Kuyruklanmış mesajlar gönderilmeli
            const mockSocket = (connection as any).socket as MockWebSocket;
            expect(mockSocket.send).toHaveBeenCalledTimes(2);
        });
    });

    describe('emit', () => {
        it('event formatında mesaj göndermeli', () => {
            connection.connect();
            jest.advanceTimersByTime(20);

            connection.emit('user:join', { userId: '123' });

            const mockSocket = (connection as any).socket as MockWebSocket;
            expect(mockSocket.send).toHaveBeenCalledWith(
                JSON.stringify({ event: 'user:join', data: { userId: '123' } })
            );
        });
    });

    describe('on/off', () => {
        it('olaya abone olunmalı ve mesaj alınmalı', () => {
            const handler = jest.fn();
            connection.connect();
            jest.advanceTimersByTime(20);

            connection.on('test-event', handler);

            const mockSocket = (connection as any).socket as MockWebSocket;
            mockSocket.simulateMessage({ event: 'test-event', data: { foo: 'bar' } });

            expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
        });

        it('abonelik iptal edilebilmeli', () => {
            const handler = jest.fn();
            connection.connect();
            jest.advanceTimersByTime(20);

            const unsubscribe = connection.on('test-event', handler);
            unsubscribe();

            const mockSocket = (connection as any).socket as MockWebSocket;
            mockSocket.simulateMessage({ event: 'test-event', data: {} });

            expect(handler).not.toHaveBeenCalled();
        });

        it('off ile abonelik kaldırılabilmeli', () => {
            const handler = jest.fn();
            connection.connect();
            jest.advanceTimersByTime(20);

            connection.on('test-event', handler);
            connection.off('test-event', handler);

            const mockSocket = (connection as any).socket as MockWebSocket;
            mockSocket.simulateMessage({ event: 'test-event', data: {} });

            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('once', () => {
        it('sadece bir kez çağrılmalı', () => {
            const handler = jest.fn();
            connection.connect();
            jest.advanceTimersByTime(20);

            connection.once('one-time', handler);

            const mockSocket = (connection as any).socket as MockWebSocket;
            mockSocket.simulateMessage({ event: 'one-time', data: { n: 1 } });
            mockSocket.simulateMessage({ event: 'one-time', data: { n: 2 } });

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith({ n: 1 });
        });
    });

    describe('reconnect', () => {
        it('beklenmeyen kapanmada yeniden bağlanmalı', () => {
            connection.connect();
            jest.advanceTimersByTime(20);

            // Anormal kapanma
            const mockSocket = (connection as any).socket as MockWebSocket;
            mockSocket.simulateClose(1006);

            expect(connection.state()).toBe('reconnecting');

            // Reconnect delay sonrası
            jest.advanceTimersByTime(1000);
            expect(connection.state()).toBe('connecting');
        });

        it('normal kapanmada yeniden bağlanmamalı', () => {
            connection.connect();
            jest.advanceTimersByTime(20);

            connection.disconnect();

            expect(connection.state()).toBe('disconnected');

            jest.advanceTimersByTime(5000);
            expect(connection.state()).toBe('disconnected');
        });
    });
});

describe('createChannel', () => {
    let connection: RealtimeConnection;

    beforeEach(() => {
        jest.useFakeTimers();
        connection = createRealtimeConnection({
            url: 'wss://test.example.com',
            heartbeatInterval: 0,
        });
        connection.connect();
        jest.advanceTimersByTime(20);
    });

    afterEach(() => {
        connection.destroy();
        jest.useRealTimers();
    });

    it('mesajları reaktif olarak saklamalı', () => {
        const channel = createChannel<{ text: string }>(connection, 'chat');

        expect(channel.messages()).toEqual([]);

        const mockSocket = (connection as any).socket as MockWebSocket;
        mockSocket.simulateMessage({ event: 'channel:chat', data: { text: 'Hello' } });

        expect(channel.messages()).toHaveLength(1);
        expect(channel.lastMessage()).toEqual({ text: 'Hello' });
    });

    it('maxHistory aşılınca eski mesajlar silinmeli', () => {
        const channel = createChannel<number>(connection, 'numbers', { maxHistory: 3 });

        const mockSocket = (connection as any).socket as MockWebSocket;
        for (let i = 1; i <= 5; i++) {
            mockSocket.simulateMessage({ event: 'channel:numbers', data: i });
        }

        expect(channel.messages()).toEqual([3, 4, 5]);
    });

    it('publish mesaj göndermeli', () => {
        const channel = createChannel<string>(connection, 'test');
        channel.publish('Hello');

        const mockSocket = (connection as any).socket as MockWebSocket;
        expect(mockSocket.send).toHaveBeenCalledWith(
            JSON.stringify({ event: 'channel:test', data: 'Hello' })
        );
    });

    it('clear mesajları temizlemeli', () => {
        const channel = createChannel<string>(connection, 'test');

        const mockSocket = (connection as any).socket as MockWebSocket;
        mockSocket.simulateMessage({ event: 'channel:test', data: 'msg1' });
        mockSocket.simulateMessage({ event: 'channel:test', data: 'msg2' });

        channel.clear();

        expect(channel.messages()).toEqual([]);
        expect(channel.lastMessage()).toBeNull();
    });
});
