import { createHttpClient, HttpClient } from './http-client';

describe('HttpClient & Interceptors', () => {
    let api: HttpClient;

    beforeEach(() => {
        // Global fetch mock
        (global as any).fetch = jest.fn();

        // Headers Mock (Node ortamında Headers olmayabilir, polyfill gerekebilir veya basitçe kontrol ederiz)
        // Eğer test ortamında Headers tanımlı değilse bu testler yine patlar.
        // Jest environment jsdom ise Headers vardır.

        api = createHttpClient({
            baseUrl: 'https://api.test.com',
            defaultHeaders: { 'X-App': 'Test' }
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should make GET request with correct URL and headers', async () => {
        // Mock Response
        const mockHeaders = new Headers();
        mockHeaders.set('content-type', 'application/json');

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            headers: mockHeaders,
            json: async () => ({ data: 'ok' }),
            text: async () => JSON.stringify({ data: 'ok' })
        });

        await api.get('/users');

        // Çağrılan argümanları yakala
        const calls = (global.fetch as jest.Mock).mock.calls;
        const [url, config] = calls[0];

        // URL Kontrolü
        expect(url).toBe('https://api.test.com/users');

        // Method Kontrolü
        expect(config.method).toBe('GET');

        // Headers Kontrolü (Headers nesnesi üzerinden get ile)
        // Not: Headers nesnesi olup olmadığını kontrol ediyoruz
        const headers = config.headers as Headers;
        expect(headers.get('Content-Type')).toBe('application/json');
        expect(headers.get('X-App')).toBe('Test');
    });

    it('should make POST request with body', async () => {
        const mockHeaders = new Headers();
        mockHeaders.set('content-type', 'application/json');

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            headers: mockHeaders,
            json: async () => ({ id: 1 })
        });

        const body = { name: 'Ahmet' };
        await api.post('/users', body);

        const calls = (global.fetch as jest.Mock).mock.calls;
        const [url, config] = calls[0];

        expect(url).toBe('https://api.test.com/users');
        expect(config.method).toBe('POST');
        expect(config.body).toBe(JSON.stringify(body));
    });

    it('should execute request interceptors', async () => {
        api = createHttpClient({
            baseUrl: 'https://api.test.com',
            onRequest: async (config) => {
                // Await config in case it's a promise
                const cfg = await Promise.resolve(config);
                // Mevcut headerları koruyarak yenisini ekle
                cfg.headers = { ...cfg.headers, 'Authorization': 'Bearer 123' };
                return cfg;
            }
        });

        const mockHeaders = new Headers();
        mockHeaders.set('content-type', 'application/json');

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            headers: mockHeaders,
            json: async () => ({})
        });

        await api.get('/protected');

        const calls = (global.fetch as jest.Mock).mock.calls;
        const headers = calls[0][1].headers as Headers;

        expect(headers.get('Authorization')).toBe('Bearer 123');
    });

    it('should handle global errors (onError)', async () => {
        const errorSpy = jest.fn();

        api = createHttpClient({
            baseUrl: 'https://api.test.com',
            onError: errorSpy
        });

        // Error Response Mock
        // DÜZELTME: Content-Type ekledik ki json() metoduna girsin, blob() aramasın.
        const errorHeaders = new Headers();
        errorHeaders.set('content-type', 'application/json');

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            headers: errorHeaders, // Content-Type burada önemli
            json: async () => ({ message: 'Not found' })
        });

        // Hata beklentisi
        await expect(api.get('/bad-url')).rejects.toMatchObject({
            status: 404,
            message: 'Not found'
        });

        expect(errorSpy).toHaveBeenCalled();
    });
});