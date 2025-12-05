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

  // Abstract metodların basit implementasyonu (Promise tabanlı)
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

  it('should handle selection correctly', async () => {
    await store.loadAll();
    const user = store.signals.all()[0];

    store.select(user.id);
    
    // DÜZELTME 1: selectedIds sinyali olmadığı için selectedItems üzerinden kontrol ediyoruz
    const selectedIds = store.signals.selectedItems().map(u => u.id);
    expect(store.signals.selected()?.id).toBe(user.id);
    expect(selectedIds).toContain(user.id);

    store.toggleSelect(user.id);
    expect(store.signals.selected()).toBeNull();
  });

  it('should perform optimistic creation', async () => {
    const newUser = { name: 'New Guy' };
    
    // İşlemden önce
    expect(store.signals.all().length).toBe(0);

    // İşlem
    await store.create(newUser);

    // İşlemden sonra
    expect(store.signals.all().length).toBe(1);
    expect(store.signals.all()[0].name).toBe('New Guy');
    expect(store.signals.isLoading()).toBe(false);
  });

  it('should update filter state', async () => {
    // DÜZELTME 2: store.filters() yerine store.signals.filters() kullanıyoruz
    await store.setFilters({ role: 'admin' });
    expect(store.signals.filters()['role']).toBe('admin');

    await store.updateFilter('status', 'active');
    expect(store.signals.filters()['status']).toBe('active');
    expect(store.signals.filters()['role']).toBe('admin'); // Eskisi korunmalı

    await store.clearFilters();
    expect(Object.keys(store.signals.filters()).length).toBe(0);
  });
});