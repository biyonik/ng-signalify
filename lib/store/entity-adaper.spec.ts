import * as adapter from './entity-adapter';
import { EntityState } from './entity-state';

// Test Entity
interface User {
    id: number;
    name: string;
    role?: string;
}

describe('EntityAdapter (Core Logic)', () => {
    let initialState: EntityState<User>;

    beforeEach(() => {
        initialState = {
            entities: new Map(),
            ids: [],
            selectedId: null,
            selectedIds: new Set(),
            loading: 'idle',
            error: null,
            page: 1,
            pageSize: 10,
            total: 0,
            sort: null,
            filters: {},
            lastFetch: null
        };
    });

    it('should add one entity', () => {
        const user = { id: 1, name: 'Ahmet' };
        const state = adapter.addOne(initialState, user);

        expect(state.ids).toEqual([1]);
        expect(state.entities.get(1)).toEqual(user);
    });

    it('should update existing entity on addOne collision', () => {
        const user1 = { id: 1, name: 'Ahmet' };
        let state = adapter.addOne(initialState, user1);

        const userUpdate = { id: 1, name: 'Mehmet' }; // Aynı ID
        state = adapter.addOne(state, userUpdate);

        expect(state.ids.length).toBe(1);
        expect(state.entities.get(1)?.name).toBe('Mehmet');
    });

    it('should add many entities', () => {
        const users = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];
        const state = adapter.addMany(initialState, users);

        expect(state.ids).toEqual([1, 2]);
        expect(state.entities.size).toBe(2);
    });

    it('should update one entity', () => {
        const user = { id: 1, name: 'Old' };
        let state = adapter.addOne(initialState, user);

        state = adapter.updateOne(state, 1, { name: 'New' });

        expect(state.entities.get(1)?.name).toBe('New');
    });

    it('should remove one entity and clear selection if selected', () => {
        const user = { id: 1, name: 'Delete Me' };
        let state = adapter.addOne(initialState, user);

        // Select it first
        state = adapter.selectOne(state, 1);
        expect(state.selectedId).toBe(1);

        // Remove
        state = adapter.removeOne(state, 1);

        expect(state.ids).toEqual([]);
        expect(state.entities.has(1)).toBe(false);
        expect(state.selectedId).toBeNull(); // Selection cleared
    });

    it('should sort entities correctly', () => {
        let state = adapter.addMany(initialState, [
            { id: 1, name: 'Zebra' },
            { id: 2, name: 'Ayı' }
        ]);

        // Varsayılan sıralama (Insertion order)
        expect(state.ids).toEqual([1, 2]);

        // Sort by Name ASC
        state = adapter.sortEntities(state, { field: 'name', direction: 'asc' }, (a, b) => a.name.localeCompare(b.name));
        expect(state.ids).toEqual([2, 1]); // Ayı, Zebra

        // Sort by Name DESC
        state = adapter.sortEntities(state, { field: 'name', direction: 'desc' }, (a, b) => a.name.localeCompare(b.name));
        expect(state.ids).toEqual([1, 2]); // Zebra, Ayı
    });

    it('should filter entities', () => {
        let state = adapter.addMany(initialState, [
            { id: 1, name: 'Ahmet', role: 'admin' },
            { id: 2, name: 'Mehmet', role: 'user' }
        ]);

        const admins = adapter.filterEntities(state, u => u.role === 'admin');
        expect(admins.length).toBe(1);
        expect(admins[0].name).toBe('Ahmet');
    });
});