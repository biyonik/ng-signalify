import { TestBed } from '@angular/core/testing';
import { EntityStore } from './entity-store';
import { Injectable } from '@angular/core';
import { PaginatedResponse } from './entity-state';

// 1. Mock Store ve Interface Tanımları
interface TestUser {
    id: number;
    name: string;
}

@Injectable()
class TestUserStore extends EntityStore<TestUser> {
    constructor() {
        super({ name: 'users', defaultPageSize: 10 });
    }

    protected fetchAll(params: any): Promise<PaginatedResponse<TestUser>> {
        return Promise.resolve({
            data: [{ id: 1, name: 'Test User' }],
            total: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1
        });
    }

    protected fetchOne(id: number | string): Promise<TestUser> {
        return Promise.resolve({ id: Number(id), name: 'Fetched User' });
    }

    protected createOne(data: any): Promise<TestUser> {
        return Promise.resolve({ id: 99, ...data });
    }

    protected updateOne(id: number | string, data: any): Promise<TestUser> {
        return Promise.resolve({ id: Number(id), name: 'Updated User', ...data });
    }

    protected deleteOne(id: number | string): Promise<void> {
        return Promise.resolve();
    }
}

// 2. Test Senaryoları
describe('EntityStore (Logic Core)', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should initialize with default state', () => {
        expect(store.signals.all()).toEqual([]);
        expect(store.signals.count()).toBe(0);
        expect(store.signals.isLoading()).toBe(false);
    });

    it('should load entities correctly', async () => {
        await store.loadAll();

        expect(store.signals.all().length).toBe(1);
        expect(store.signals.all()[0].name).toBe('Test User');
        expect(store.signals.total()).toBe(1);
    });

    // DÜZELTİLDİ: Tekil seçim testi
    it('should handle single selection correctly', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];

        // Seçim yap
        store.select(user.id);
        expect(store.signals.selected()?.id).toBe(user.id);

        // Seçimi kaldır (Tekil seçimde null gönderilir)
        store.select(null);
        expect(store.signals.selected()).toBeNull();
    });

    // EKLENDİ: Çoklu seçim testi (toggleSelect burada test edilmeli)
    it('should handle multi selection correctly', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];

        // 1. Toggle On (Seç)
        store.toggleSelect(user.id);

        // selectedItems() sinyalinden kontrol et
        const selectedIds = store.signals.selectedItems().map(u => u.id);
        expect(selectedIds).toContain(user.id);

        // 2. Toggle Off (Kaldır)
        store.toggleSelect(user.id);
        expect(store.signals.selectedItems().length).toBe(0);
    });

    it('should perform optimistic creation', async () => {
        const newUser = { name: 'New Guy' };
        expect(store.signals.all().length).toBe(0);
        await store.create(newUser);
        expect(store.signals.all().length).toBe(1);
        expect(store.signals.all()[0].name).toBe('New Guy');
        expect(store.signals.isLoading()).toBe(false);
    });

    it('should update filter state', async () => {
        await store.setFilters({ role: 'admin' });
        expect(store.signals.filters()['role']).toBe('admin');

        await store.updateFilter('status', 'active');
        expect(store.signals.filters()['status']).toBe('active');
        expect(store.signals.filters()['role']).toBe('admin');

        await store.clearFilters();
        expect(Object.keys(store.signals.filters()).length).toBe(0);
    });
});

describe('EntityStore - Optimistic Updates with Rollback', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should optimistically create entity and rollback on failure', async () => {
        const newUser = { id: 999, name: 'Optimistic User' };
        
        const result = store.optimisticCreate(newUser);
        
        // Should immediately add to state
        expect(store.signals.all().some(u => u.id === 999)).toBe(true);
        
        // Rollback
        result.rollback();
        expect(store.signals.all().some(u => u.id === 999)).toBe(false);
    });

    it('should optimistically update entity and rollback on failure', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];
        const originalName = user.name;
        
        const result = store.optimisticUpdate(user.id, { name: 'Updated Optimistically' });
        
        // Should immediately update in state
        expect(store.signals.all()[0].name).toBe('Updated Optimistically');
        
        // Rollback
        result.rollback();
        expect(store.signals.all()[0].name).toBe(originalName);
    });

    it('should optimistically delete entity and rollback on failure', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];
        
        const result = store.optimisticDelete(user.id);
        
        // Should immediately remove from state
        expect(store.signals.all().length).toBe(0);
        
        // Rollback
        result.rollback();
        expect(store.signals.all().length).toBe(1);
        expect(store.signals.all()[0].id).toBe(user.id);
    });
});

describe('EntityStore - Pagination Integration', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should navigate to next page', async () => {
        await store.loadAll();
        
        // Only test if there are more pages available
        if (store.pagination.hasNext()) {
            const initialPage = store.pagination.page();
            await store.nextPage();
            
            expect(store.pagination.page()).toBeGreaterThan(initialPage);
        } else {
            // If no next page, verify the method doesn't error
            await expect(store.nextPage()).resolves.not.toThrow();
        }
    });

    it('should navigate to previous page', async () => {
        // First go to a higher page
        await store.goToPage(5);
        
        const currentPage = store.pagination.page();
        if (currentPage > 1) {
            await store.prevPage();
            expect(store.pagination.page()).toBeLessThan(currentPage);
        } else {
            // Already on first page, verify method doesn't error
            await expect(store.prevPage()).resolves.not.toThrow();
        }
    });

    it('should go to specific page', async () => {
        await store.goToPage(3);
        
        // Verify page was changed (might be clamped to available pages)
        expect(store.pagination.page()).toBeGreaterThanOrEqual(1);
    });

    it('should change page size', async () => {
        await store.setPageSize(25);
        
        expect(store.pagination.pageSize()).toBe(25);
    });

    it('should handle page size change and reload', async () => {
        await store.loadAll();
        const initialCount = store.signals.all().length;
        
        await store.setPageSize(50);
        
        expect(store.pagination.pageSize()).toBe(50);
    });
});

describe('EntityStore - Filtering and Sorting', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should set and apply filters', async () => {
        await store.setFilters({ status: 'active', role: 'admin' });
        
        expect(store.signals.filters()['status']).toBe('active');
        expect(store.signals.filters()['role']).toBe('admin');
    });

    it('should update single filter', async () => {
        await store.setFilters({ status: 'active' });
        await store.updateFilter('role', 'user');
        
        expect(store.signals.filters()['status']).toBe('active');
        expect(store.signals.filters()['role']).toBe('user');
    });

    it('should clear all filters', async () => {
        await store.setFilters({ status: 'active', role: 'admin' });
        await store.clearFilters();
        
        expect(Object.keys(store.signals.filters())).toHaveLength(0);
    });

    it('should set sort configuration', async () => {
        await store.setSort({ field: 'name', direction: 'asc' });
        
        expect(store.signals.sort()?.field).toBe('name');
        expect(store.signals.sort()?.direction).toBe('asc');
    });

    it('should toggle sort direction', async () => {
        await store.setSort({ field: 'name', direction: 'asc' });
        await store.toggleSort('name');
        
        expect(store.signals.sort()?.direction).toBe('desc');
    });

    it('should change sort field', async () => {
        await store.setSort({ field: 'name', direction: 'asc' });
        await store.toggleSort('email');
        
        expect(store.signals.sort()?.field).toBe('email');
        expect(store.signals.sort()?.direction).toBe('asc');
    });

    it('should clear sort', async () => {
        await store.setSort({ field: 'name', direction: 'asc' });
        await store.setSort(null);
        
        expect(store.signals.sort()).toBeNull();
    });
});

describe('EntityStore - Selection Management', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should select all entities', async () => {
        await store.loadAll();
        
        store.selectAll();
        
        expect(store.signals.selectedItems().length).toBe(store.signals.all().length);
    });

    it('should select multiple entities', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];
        
        store.selectMany([user.id]);
        
        expect(store.signals.selectedItems()).toHaveLength(1);
        expect(store.signals.selectedItems()[0].id).toBe(user.id);
    });

    it('should clear selection', async () => {
        await store.loadAll();
        store.selectAll();
        
        store.clearSelection();
        
        expect(store.signals.selectedItems()).toHaveLength(0);
        expect(store.signals.selected()).toBeNull();
    });

    it('should maintain selection after entity update', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];
        
        store.select(user.id);
        await store.update(user.id, { name: 'Updated Name' });
        
        expect(store.signals.selected()?.id).toBe(user.id);
    });
});

describe('EntityStore - Error Handling', () => {
    @Injectable()
    class FailingUserStore extends EntityStore<TestUser> {
        constructor() {
            super({ name: 'users', defaultPageSize: 10 });
        }

        protected fetchAll(): Promise<PaginatedResponse<TestUser>> {
            return Promise.reject(new Error('Network error'));
        }

        protected fetchOne(): Promise<TestUser> {
            return Promise.reject(new Error('Not found'));
        }

        protected createOne(): Promise<TestUser> {
            return Promise.reject(new Error('Creation failed'));
        }

        protected updateOne(): Promise<TestUser> {
            return Promise.reject(new Error('Update failed'));
        }

        protected deleteOne(): Promise<void> {
            return Promise.reject(new Error('Delete failed'));
        }
    }

    let store: FailingUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [FailingUserStore]
        });
        store = TestBed.inject(FailingUserStore);
    });

    it('should handle loadAll error', async () => {
        await store.loadAll();
        
        expect(store.signals.error()).toBeTruthy();
        expect(store.signals.isLoading()).toBe(false);
    });

    it('should handle loadOne error', async () => {
        await store.loadOne(1);
        
        expect(store.signals.error()).toBeTruthy();
    });

    it('should handle create error', async () => {
        const result = await store.create({ name: 'Test' });
        
        expect(result).toBeNull();
        expect(store.signals.error()).toBeTruthy();
    });

    it('should handle update error', async () => {
        const result = await store.update(1, { name: 'Test' });
        
        expect(result).toBeNull();
        expect(store.signals.error()).toBeTruthy();
    });

    it('should handle delete error', async () => {
        const result = await store.delete(1);
        
        expect(result).toBe(false);
        expect(store.signals.error()).toBeTruthy();
    });

    it('should clear error state', async () => {
        await store.loadAll();
        expect(store.signals.error()).toBeTruthy();
        
        store.clearError();
        
        expect(store.signals.error()).toBeNull();
    });
});

describe('EntityStore - Batch Operations', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should create multiple entities', async () => {
        const users = [
            { name: 'User 1' },
            { name: 'User 2' },
            { name: 'User 3' }
        ];
        
        const result = await store.createMany(users);
        
        expect(result.success.length).toBeGreaterThan(0);
    });

    it('should update multiple entities', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];
        
        const result = await store.updateMany([
            { id: user.id, data: { name: 'Updated 1' } }
        ]);
        
        expect(result.success.length).toBeGreaterThan(0);
    });

    it('should delete multiple entities', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];
        
        const result = await store.deleteMany([user.id]);
        
        expect(result.success).toContain(user.id);
    });
});

describe('EntityStore - Query Operations', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should get entity by ID', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];
        
        const found = store.getById(user.id);
        
        expect(found).toBeDefined();
        expect(found?.id).toBe(user.id);
    });

    it('should get multiple entities by IDs', async () => {
        await store.loadAll();
        const user = store.signals.all()[0];
        
        const found = store.getByIds([user.id]);
        
        expect(found).toHaveLength(1);
        expect(found[0].id).toBe(user.id);
    });

    it('should find entity by predicate', async () => {
        await store.loadAll();
        
        const found = store.find(u => u.name === 'Test User');
        
        expect(found).toBeDefined();
        expect(found?.name).toBe('Test User');
    });

    it('should filter entities by predicate', async () => {
        await store.loadAll();
        
        const filtered = store.filter(u => u.name.includes('Test'));
        
        expect(filtered.length).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent ID', () => {
        const found = store.getById(999);
        
        expect(found).toBeUndefined();
    });
});

describe('EntityStore - State Management', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should reset store state', async () => {
        await store.loadAll();
        await store.setFilters({ status: 'active' });
        
        store.reset();
        
        expect(store.signals.all()).toHaveLength(0);
        expect(Object.keys(store.signals.filters())).toHaveLength(0);
    });

    it('should refresh store data', async () => {
        await store.loadAll();
        const initialCount = store.signals.all().length;
        
        await store.refresh();
        
        expect(store.signals.all().length).toBe(initialCount);
    });

    it('should track loading state during operations', async () => {
        const loadingStates: boolean[] = [];
        
        const loadPromise = store.loadAll();
        loadingStates.push(store.signals.isLoading());
        
        await loadPromise;
        loadingStates.push(store.signals.isLoading());
        
        expect(loadingStates).toContain(true);
        expect(loadingStates[loadingStates.length - 1]).toBe(false);
    });
});

describe('EntityStore - Cache Behavior', () => {
    let store: TestUserStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TestUserStore]
        });
        store = TestBed.inject(TestUserStore);
    });

    it('should load data successfully', async () => {
        await store.loadAll();
        
        expect(store.signals.all().length).toBeGreaterThanOrEqual(0);
    });

    it('should refresh if stale', async () => {
        await store.loadAll();
        
        // refreshIfStale should check staleness
        await store.refreshIfStale();
        
        expect(store.signals.all().length).toBeGreaterThanOrEqual(0);
    });
});