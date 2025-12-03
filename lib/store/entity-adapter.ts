import { Entity, EntityId, EntityState, SortConfig } from './entity-state';

/**
 * TR: Varlık Adaptörü - Veri manipülasyonu için saf fonksiyonlar.
 * EntityState üzerinde değişmez (Immutable) operasyonlar gerçekleştirir.
 * Her fonksiyon yeni bir durum (State) nesnesi döndürür, orijinal durumu değiştirmez.
 *
 * EN: Entity Adapter - Pure functions for entity manipulation.
 * Performs immutable operations on EntityState.
 * Each function returns a new State object, does not modify the original state.
 */

/**
 * TR: Duruma tek bir varlık ekler.
 * Eğer varlık zaten varsa (ID çakışması), güncelleme (updateOne) işlemi yapar.
 *
 * EN: Adds a single entity to the state.
 * If the entity already exists (ID collision), performs an update (updateOne) operation.
 *
 * @param state - TR: Mevcut durum. / EN: Current state.
 * @param entity - TR: Eklenecek varlık. / EN: Entity to add.
 * @param selectId - TR: ID seçici fonksiyon. / EN: ID selector function.
 */
export function addOne<T extends Entity>(
  state: EntityState<T>,
  entity: T,
  selectId: (e: T) => EntityId = (e) => e.id
): EntityState<T> {
  const id = selectId(entity);
  
  // TR: Zaten varsa güncelle
  // EN: Update if already exists
  if (state.entities.has(id)) {
    return updateOne(state, id, entity);
  }

  const newEntities = new Map(state.entities);
  newEntities.set(id, entity);

  return {
    ...state,
    entities: newEntities,
    ids: [...state.ids, id],
  };
}

/**
 * TR: Duruma birden fazla varlık ekler.
 * Döngü içinde tek tek ekleme yerine, toplu işlem yaparak performansı artırır.
 *
 * EN: Adds multiple entities to the state.
 * Increases performance by performing batch operation instead of adding one by one in a loop.
 */
export function addMany<T extends Entity>(
  state: EntityState<T>,
  entities: T[],
  selectId: (e: T) => EntityId = (e) => e.id
): EntityState<T> {
  const newEntities = new Map(state.entities);
  const newIds = [...state.ids];

  for (const entity of entities) {
    const id = selectId(entity);
    if (!newEntities.has(id)) {
      newIds.push(id);
    }
    newEntities.set(id, entity);
  }

  return {
    ...state,
    entities: newEntities,
    ids: newIds,
  };
}

/**
 * TR: Tüm varlıkları verilen listeyle değiştirir (Eskileri siler).
 * Genellikle API'den yeni bir liste çekildiğinde kullanılır.
 *
 * EN: Replaces all entities with the given list (Deletes old ones).
 * Usually used when a new list is fetched from the API.
 */
export function setAll<T extends Entity>(
  state: EntityState<T>,
  entities: T[],
  selectId: (e: T) => EntityId = (e) => e.id
): EntityState<T> {
  const newEntities = new Map<EntityId, T>();
  const newIds: EntityId[] = [];

  for (const entity of entities) {
    const id = selectId(entity);
    newEntities.set(id, entity);
    newIds.push(id);
  }

  return {
    ...state,
    entities: newEntities,
    ids: newIds,
  };
}

/**
 * TR: Tek bir varlığı günceller (Kısmi güncelleme / Patch).
 * Varlık yoksa işlemi yoksayar.
 *
 * EN: Updates a single entity (Partial update / Patch).
 * Ignores the operation if the entity does not exist.
 */
export function updateOne<T extends Entity>(
  state: EntityState<T>,
  id: EntityId,
  changes: Partial<T>
): EntityState<T> {
  const existing = state.entities.get(id);
  if (!existing) return state;

  const newEntities = new Map(state.entities);
  newEntities.set(id, { ...existing, ...changes });

  return {
    ...state,
    entities: newEntities,
  };
}

/**
 * TR: Birden fazla varlığı günceller.
 *
 * EN: Updates multiple entities.
 */
export function updateMany<T extends Entity>(
  state: EntityState<T>,
  updates: Array<{ id: EntityId; changes: Partial<T> }>
): EntityState<T> {
  const newEntities = new Map(state.entities);

  for (const { id, changes } of updates) {
    const existing = newEntities.get(id);
    if (existing) {
      newEntities.set(id, { ...existing, ...changes });
    }
  }

  return {
    ...state,
    entities: newEntities,
  };
}

/**
 * TR: Varlık varsa günceller, yoksa ekler (Update or Insert).
 *
 * EN: Updates if entity exists, adds if not (Update or Insert).
 */
export function upsertOne<T extends Entity>(
  state: EntityState<T>,
  entity: T,
  selectId: (e: T) => EntityId = (e) => e.id
): EntityState<T> {
  const id = selectId(entity);
  
  if (state.entities.has(id)) {
    return updateOne(state, id, entity);
  }
  
  return addOne(state, entity, selectId);
}

/**
 * TR: Birden fazla varlık için Upsert işlemi yapar.
 *
 * EN: Performs Upsert operation for multiple entities.
 */
export function upsertMany<T extends Entity>(
  state: EntityState<T>,
  entities: T[],
  selectId: (e: T) => EntityId = (e) => e.id
): EntityState<T> {
  let newState = state;
  for (const entity of entities) {
    newState = upsertOne(newState, entity, selectId);
  }
  return newState;
}

/**
 * TR: Tek bir varlığı siler.
 * Silinen varlık seçiliyse, seçim bilgisini de temizler.
 *
 * EN: Removes a single entity.
 * If the removed entity was selected, also clears the selection info.
 */
export function removeOne<T extends Entity>(
  state: EntityState<T>,
  id: EntityId
): EntityState<T> {
  if (!state.entities.has(id)) return state;

  const newEntities = new Map(state.entities);
  newEntities.delete(id);

  return {
    ...state,
    entities: newEntities,
    ids: state.ids.filter((i) => i !== id),
    selectedId: state.selectedId === id ? null : state.selectedId,
    selectedIds: new Set([...state.selectedIds].filter((i) => i !== id)),
  };
}

/**
 * TR: Birden fazla varlığı siler.
 *
 * EN: Removes multiple entities.
 */
export function removeMany<T extends Entity>(
  state: EntityState<T>,
  ids: EntityId[]
): EntityState<T> {
  const idsSet = new Set(ids);
  const newEntities = new Map(state.entities);

  for (const id of ids) {
    newEntities.delete(id);
  }

  return {
    ...state,
    entities: newEntities,
    ids: state.ids.filter((id) => !idsSet.has(id)),
    selectedId: state.selectedId && idsSet.has(state.selectedId) ? null : state.selectedId,
    selectedIds: new Set([...state.selectedIds].filter((id) => !idsSet.has(id))),
  };
}

/**
 * TR: Tüm varlıkları ve seçimleri temizler (Reset).
 *
 * EN: Clears all entities and selections (Reset).
 */
export function removeAll<T extends Entity>(
  state: EntityState<T>
): EntityState<T> {
  return {
    ...state,
    entities: new Map(),
    ids: [],
    selectedId: null,
    selectedIds: new Set(),
  };
}

/**
 * TR: Tek bir varlığı "Aktif/Seçili" olarak işaretler.
 * `null` verilirse seçimi kaldırır.
 *
 * EN: Marks a single entity as "Active/Selected".
 * If `null` is given, deselects.
 */
export function selectOne<T extends Entity>(
  state: EntityState<T>,
  id: EntityId | null
): EntityState<T> {
  return {
    ...state,
    selectedId: id,
  };
}

/**
 * TR: Bir varlığın seçim durumunu tersine çevirir (Checkbox mantığı).
 *
 * EN: Toggles the selection state of an entity (Checkbox logic).
 */
export function toggleSelection<T extends Entity>(
  state: EntityState<T>,
  id: EntityId
): EntityState<T> {
  const newSelectedIds = new Set(state.selectedIds);
  
  if (newSelectedIds.has(id)) {
    newSelectedIds.delete(id);
  } else {
    newSelectedIds.add(id);
  }

  return {
    ...state,
    selectedIds: newSelectedIds,
  };
}

/**
 * TR: Belirtilen varlıkları çoklu seçime ekler (Diğer seçimleri siler).
 *
 * EN: Adds specified entities to multiple selection (Clears other selections).
 */
export function selectMany<T extends Entity>(
  state: EntityState<T>,
  ids: EntityId[]
): EntityState<T> {
  return {
    ...state,
    selectedIds: new Set(ids),
  };
}

/**
 * TR: Listedeki tüm varlıkları seçer.
 *
 * EN: Selects all entities in the list.
 */
export function selectAll<T extends Entity>(
  state: EntityState<T>
): EntityState<T> {
  return {
    ...state,
    selectedIds: new Set(state.ids),
  };
}

/**
 * TR: Tüm seçimleri kaldırır.
 *
 * EN: Clears all selections.
 */
export function clearSelection<T extends Entity>(
  state: EntityState<T>
): EntityState<T> {
  return {
    ...state,
    selectedId: null,
    selectedIds: new Set(),
  };
}

/**
 * TR: Varlıkları verilen kritere göre sıralar.
 * ID listesinin sırasını değiştirir, Map yapısına dokunmaz (Performans avantajı).
 *
 * EN: Sorts entities based on the given criteria.
 * Changes the order of the ID list, does not touch the Map structure (Performance advantage).
 */
export function sortEntities<T extends Entity>(
  state: EntityState<T>,
  sortConfig: SortConfig | null,
  compareFn?: (a: T, b: T) => number
): EntityState<T> {
  if (!sortConfig || !compareFn) {
    return { ...state, sort: sortConfig };
  }

  const sorted = [...state.ids].sort((aId, bId) => {
    const a = state.entities.get(aId)!;
    const b = state.entities.get(bId)!;
    const result = compareFn(a, b);
    return sortConfig.direction === 'asc' ? result : -result;
  });

  return {
    ...state,
    ids: sorted,
    sort: sortConfig,
  };
}

/**
 * TR: Selector: State içindeki Map yapısını Diziye (Array) çevirir.
 *
 * EN: Selector: Converts Map structure inside State to Array.
 */
export function selectAllEntities<T extends Entity>(state: EntityState<T>): T[] {
  return state.ids.map((id) => state.entities.get(id)!);
}

/**
 * TR: Selector: ID ile varlık getirir.
 *
 * EN: Selector: Gets entity by ID.
 */
export function selectById<T extends Entity>(
  state: EntityState<T>,
  id: EntityId
): T | undefined {
  return state.entities.get(id);
}

/**
 * TR: Selector: ID listesine göre varlıkları getirir.
 *
 * EN: Selector: Gets entities by ID list.
 */
export function selectByIds<T extends Entity>(
  state: EntityState<T>,
  ids: EntityId[]
): T[] {
  return ids
    .map((id) => state.entities.get(id))
    .filter((e): e is T => e !== undefined);
}

/**
 * TR: Selector: Aktif seçili (tekil) varlığı getirir.
 *
 * EN: Selector: Gets the actively selected (single) entity.
 */
export function selectSelected<T extends Entity>(
  state: EntityState<T>
): T | null {
  if (!state.selectedId) return null;
  return state.entities.get(state.selectedId) ?? null;
}

/**
 * TR: Selector: Çoklu seçilmiş varlıkları getirir.
 *
 * EN: Selector: Gets multiple selected entities.
 */
export function selectSelectedEntities<T extends Entity>(
  state: EntityState<T>
): T[] {
  return [...state.selectedIds]
    .map((id) => state.entities.get(id))
    .filter((e): e is T => e !== undefined);
}

/**
 * TR: Selector: Verilen koşula uyan varlıkları filtreler.
 *
 * EN: Selector: Filters entities matching the given condition.
 */
export function filterEntities<T extends Entity>(
  state: EntityState<T>,
  predicate: (entity: T) => boolean
): T[] {
  return selectAllEntities(state).filter(predicate);
}

/**
 * TR: Selector: Verilen koşula uyan ilk varlığı bulur.
 *
 * EN: Selector: Finds the first entity matching the given condition.
 */
export function findEntity<T extends Entity>(
  state: EntityState<T>,
  predicate: (entity: T) => boolean
): T | undefined {
  return selectAllEntities(state).find(predicate);
}