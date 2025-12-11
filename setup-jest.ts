if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

if (typeof global.Response === 'undefined') {
    global.Response = class Response {
        status: number;
        statusText:  string;
        ok: boolean;

        constructor(body?:  any, init?: { status?: number; statusText?: string }) {
            this.status = init?.status || 200;
            this.statusText = init?.statusText || 'OK';
            this.ok = this.status >= 200 && this.status < 300;
        }
    } as any;
}

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import 'fake-indexeddb/auto'; // ✅ EN ÜSTE

setupZoneTestEnv();
