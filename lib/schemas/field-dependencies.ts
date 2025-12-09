import { signal, effect, Signal } from '@angular/core';

/**
 * TR: Bir alanın diğer alanlara olan bağımlılığını tanımlayan yapılandırma.
 * Alanın görünürlüğünü, aktifliğini veya değerini diğer alanların durumuna göre dinamik olarak değiştirir.
 *
 * EN: Configuration defining a field's dependency on other fields.
 * Dynamically changes the field's visibility, enablement, or value based on the state of other fields.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface FieldDependency {
  /**
   * TR: Bu alanın bağlı olduğu diğer alanların isimleri (Key).
   * 'effect' mekanizması bu alanlardaki değişiklikleri izler.
   *
   * EN: Names (Keys) of other fields this field depends on.
   * The 'effect' mechanism tracks changes in these fields.
   */
  dependsOn: string[];

  /**
   * TR: Bağımlı olunan alanlar değiştiğinde çalışacak yan etki (Side Effect) fonksiyonu.
   * API çağrısı yapmak veya seçenekleri (Dropdown options) güncellemek için kullanılır.
   *
   * EN: Side Effect function to run when dependent fields change.
   * Used to make API calls or update options (Dropdown options).
   */
  onDependencyChange?: (values: Record<string, unknown>, context: DependencyContext) => void | Promise<void>;

  /**
   * TR: Alanın görünür olup olmayacağını belirleyen koşul fonksiyonu.
   * True dönerse alan gösterilir.
   *
   * EN: Conditional function determining whether the field will be visible.
   * If returns true, the field is shown.
   */
  showWhen?: (values: Record<string, unknown>) => boolean;

  /**
   * TR: Alanın aktif (enabled) olup olmayacağını belirleyen koşul fonksiyonu.
   * True dönerse alan düzenlenebilir.
   *
   * EN: Conditional function determining whether the field will be enabled.
   * If returns true, the field is editable.
   */
  enableWhen?: (values: Record<string, unknown>) => boolean;

  /**
   * TR: Alanın değerini diğer alanlara göre otomatik hesaplayan fonksiyon.
   * Örn: `Fiyat * Adet = Toplam`.
   *
   * EN: Function that automatically computes the field's value based on other fields.
   * E.g., `Price * Quantity = Total`.
   */
  compute?: (values: Record<string, unknown>) => unknown;
}

/**
 * TR: Bağımlılık tetiklendiğinde (Callback) sağlanan araç seti.
 * Alanı sıfırlama, değer atama veya seçeneklerini değiştirme yetkisi verir.
 *
 * EN: Toolset provided when a dependency is triggered (Callback).
 * Grants authority to reset the field, set value, or change its options.
 */
export interface DependencyContext {
  fieldName: string;
  reset: () => void;
  setValue: (value: unknown) => void;
  setOptions?: (options: unknown[]) => void;
}

/**
 * TR: Bir alanın hesaplanmış bağımlılık durumu.
 * UI bileşenleri bu sinyalleri dinleyerek kendilerini günceller.
 *
 * EN: Computed dependency state of a field.
 * UI components update themselves by listening to these signals.
 */
export interface FieldDependencyState {
  visible: Signal<boolean>;
  enabled: Signal<boolean>;
  computedValue: Signal<unknown>;
}

/**
 * TR: Form içindeki karmaşık bağımlılık grafiğini yöneten motor sınıfı.
 * Angular `effect` kullanarak, veri değiştikçe zincirleme reaksiyonları (Visibility, Computation) yönetir.
 * Döngüsel bağımlılıkları (Circular Dependency) tespit edebilir.
 *
 * EN: Engine class managing the complex dependency graph within the form.
 * Manages chain reactions (Visibility, Computation) as data changes using Angular `effect`.
 * Can detect circular dependencies.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class DependencyResolver {
  private dependencies = new Map<string, FieldDependency>();
  private fieldStates = new Map<string, FieldDependencyState>();
  private effectCleanups: (() => void)[] = [];

  constructor() {}

  /**
   * TR: Bir alan için bağımlılık kuralı kaydeder.
   *
   * EN: Registers a dependency rule for a field.
   */
  register(fieldName: string, dependency: FieldDependency): void {
    this.dependencies.set(fieldName, dependency);
  }

  /**
   * TR: Bağımlılık izleme mekanizmasını başlatır.
   * Formun `values` sinyaline abone olur ve herhangi bir değişiklikte ilgili kuralları çalıştırır.
   * Angular'ın `effect` yapısı sayesinde bellek yönetimi (Cleanup) otomatik yapılır.
   *
   * EN: Initializes the dependency tracking mechanism.
   * Subscribes to the form's `values` signal and executes relevant rules on any change.
   * Memory management (Cleanup) is handled automatically thanks to Angular's `effect` structure.
   */
  initialize(
    values: Signal<Record<string, unknown>>,
    setFieldValue: (name: string, value: unknown) => void,
    resetField: (name: string) => void
  ): void {
    // TR: Önceki effect'leri temizle (Memory Leak önlemi)
    // EN: Clean up previous effects (Memory Leak prevention)
    this.cleanup();

      // TR: Döngüsel bağımlılık kontrolü - KRİTİK!
      // EN: Circular dependency check - CRITICAL!
      if (this.hasCircularDependency()) {
          const cycles = this.findCircularDependencies();
          const cycleStr = cycles.map(c => c.join(' → ')).join(', ');
          throw new Error(
              `[ng-signalify] Circular dependency detected: ${cycleStr}. ` +
              `This will cause infinite loops. Please review your field dependencies.`
          );
      }

    for (const [fieldName, dep] of this.dependencies) {
      // TR: Durum sinyallerini oluştur
      // EN: Create state signals
      const visible = signal(true);
      const enabled = signal(true);
      const computedValue = signal<unknown>(undefined);

      this.fieldStates.set(fieldName, { visible, enabled, computedValue });

      // TR: Bağımlılıkları izlemek için effect oluştur
      // EN: Create effect to watch dependencies
      const cleanup = effect(() => {
        const currentValues = values();

        // Check visibility
        if (dep.showWhen) {
          visible.set(dep.showWhen(currentValues));
        }

        // Check enabled
        if (dep.enableWhen) {
          enabled.set(dep.enableWhen(currentValues));
        }

        // Compute value
        if (dep.compute) {
          const computed = dep.compute(currentValues);
          computedValue.set(computed);
          // TR: Hesaplanan değeri forma yaz (Recursion riski olabilir, dikkat)
          // EN: Write computed value to form (Recursion risk, be careful)
          setFieldValue(fieldName, computed);
        }

        // Trigger dependency change callback
        if (dep.onDependencyChange) {
          const context: DependencyContext = {
            fieldName,
            reset: () => resetField(fieldName),
            setValue: (value) => setFieldValue(fieldName, value),
          };
          dep.onDependencyChange(currentValues, context);
        }
      }, {allowSignalWrites: true});

      this.effectCleanups.push(cleanup.destroy.bind(cleanup));
    }
  }

  /**
   * TR: Bir alanın bağımlılık durumunu (Görünürlük vb.) getirir.
   *
   * EN: Gets the dependency state (Visibility etc.) of a field.
   */
  getState(fieldName: string): FieldDependencyState | undefined {
    return this.fieldStates.get(fieldName);
  }

  /**
   * TR: Alanın şu an görünür olup olmadığını kontrol eder.
   *
   * EN: Checks if the field is currently visible.
   */
  isVisible(fieldName: string): boolean {
    const state = this.fieldStates.get(fieldName);
    return state?.visible() ?? true;
  }

  /**
   * TR: Alanın şu an aktif (enabled) olup olmadığını kontrol eder.
   *
   * EN: Checks if the field is currently enabled.
   */
  isEnabled(fieldName: string): boolean {
    const state = this.fieldStates.get(fieldName);
    return state?.enabled() ?? true;
  }

  /**
   * TR: Alanın hesaplanmış (computed) değerini getirir.
   *
   * EN: Gets the computed value of the field.
   */
  getComputedValue(fieldName: string): unknown {
    const state = this.fieldStates.get(fieldName);
    return state?.computedValue();
  }

  /**
   * TR: Bir alanın hangi alanlara ihtiyaç duyduğunu (bağımlı olduğunu) listeler.
   *
   * EN: Lists which fields a field requires (depends on).
   */
  getDependencies(fieldName: string): string[] {
    return this.dependencies.get(fieldName)?.dependsOn ?? [];
  }

  /**
   * TR: Verilen bir alana bağımlı olan (etkilenen) diğer alanları listeler.
   * "Bu alan değişirse kimler etkilenir?" sorusunun cevabıdır.
   *
   * EN: Lists other fields that depend on (are affected by) a given field.
   * It is the answer to "Who gets affected if this field changes?".
   */
  getDependents(fieldName: string): string[] {
    const dependents: string[] = [];
    for (const [name, dep] of this.dependencies) {
      if (dep.dependsOn.includes(fieldName)) {
        dependents.push(name);
      }
    }
    return dependents;
  }


  /**
   * TR: Bağımlılık grafiğini oluşturur. Debug ve görselleştirme için kullanılır.
   *
   * EN: Builds the dependency graph. Used for debugging and visualization.
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const [name, dep] of this.dependencies) {
      graph.set(name, dep.dependsOn);
    }
    return graph;
  }

  /**
   * TR: Konfigürasyonda döngüsel bağımlılık (Circular Dependency) olup olmadığını kontrol eder.
   * Örn: A -> B -> A durumu sonsuz döngüye yol açar.
   * Derinlik Öncelikli Arama (DFS) algoritması kullanır.
   *
   * EN: Checks if there is a circular dependency in the configuration.
   * E.g., A -> B -> A leads to an infinite loop.
   * Uses Depth First Search (DFS) algorithm.
   */
  hasCircularDependency(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const deps = this.dependencies.get(node)?.dependsOn ?? [];
      for (const dep of deps) {
        if (hasCycle(dep)) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    for (const name of this.dependencies.keys()) {
      if (hasCycle(name)) return true;
    }
    return false;
  }

    /**
     * TR: Döngüsel bağımlılık zincirlerini bulur ve döndürür.
     * Debug için kullanışlıdır.
     *
     * EN: Finds and returns circular dependency chains.
     * Useful for debugging.
     *
     * @returns TR: Döngüsel bağımlılık zincirleri. / EN: Circular dependency chains.
     */
    findCircularDependencies(): string[][] {
        const cycles: string[][] = [];
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const path: string[] = [];

        const findCycles = (node: string): void => {
            if (recursionStack.has(node)) {
                // TR: Döngü bulundu, yolu kaydet
                // EN: Cycle found, record the path
                const cycleStart = path.indexOf(node);
                if (cycleStart !== -1) {
                    cycles.push([...path.slice(cycleStart), node]);
                }
                return;
            }

            if (visited.has(node)) return;

            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            const deps = this.dependencies.get(node)?.dependsOn ?? [];
            for (const dep of deps) {
                findCycles(dep);
            }

            path.pop();
            recursionStack.delete(node);
        };

        for (const name of this.dependencies.keys()) {
            visited.clear();
            recursionStack.clear();
            path.length = 0;
            findCycles(name);
        }

        return cycles;
    }

    /**
   * TR: Tüm effect'leri ve durumları temizler.
   * Bileşen (Component) yok edilirken çağrılmalıdır.
   *
   * EN: Cleans up all effects and states.
   * Should be called when the Component is destroyed.
   */
  cleanup(): void {
    for (const cleanup of this.effectCleanups) {
      cleanup();
    }
    this.effectCleanups = [];
    this.fieldStates.clear();
  }
}

/**
 * TR: Sık kullanılan bağımlılık senaryoları için yardımcı şablonlar (Factory functions).
 * Kod tekrarını önlemek ve okunabilirliği artırmak için kullanılır.
 *
 * EN: Helper templates (Factory functions) for common dependency scenarios.
 * Used to prevent code duplication and improve readability.
 */
export const DependencyPatterns = {
  /**
   * TR: Başka bir alanın değeri X'e eşitse göster.
   *
   * EN: Show if another field's value equals X.
   */
  showWhenEquals: (dependsOn: string, value: unknown): FieldDependency => ({
    dependsOn: [dependsOn],
    showWhen: (values) => values[dependsOn] === value,
  }),

  /**
   * TR: Başka bir alanın değeri doluysa (Truthy) göster.
   *
   * EN: Show if another field's value is Truthy.
   */
  showWhenTruthy: (dependsOn: string): FieldDependency => ({
    dependsOn: [dependsOn],
    showWhen: (values) => Boolean(values[dependsOn]),
  }),

  /**
   * TR: Başka bir alanın değeri verilen listedeyse göster.
   *
   * EN: Show if another field's value is in the given list.
   */
  showWhenIn: (dependsOn: string, allowedValues: unknown[]): FieldDependency => ({
    dependsOn: [dependsOn],
    showWhen: (values) => allowedValues.includes(values[dependsOn]),
  }),

  /**
   * TR: Başka bir alan boşsa bu alanı pasif yap.
   *
   * EN: Disable this field if another field is empty.
   */
  disableWhenEmpty: (dependsOn: string): FieldDependency => ({
    dependsOn: [dependsOn],
    enableWhen: (values) => values[dependsOn] != null && values[dependsOn] !== '',
  }),

  /**
   * TR: Birden fazla alanın sayısal toplamını hesapla.
   *
   * EN: Compute the numerical sum of multiple fields.
   */
  sumOf: (fields: string[]): FieldDependency => ({
    dependsOn: fields,
    compute: (values) => fields.reduce((sum, f) => sum + (Number(values[f]) || 0), 0),
  }),

  /**
   * TR: Birden fazla alanı string olarak birleştir (Concat).
   *
   * EN: Concatenate multiple fields as string.
   */
  concat: (fields: string[], separator = ' '): FieldDependency => ({
    dependsOn: fields,
    compute: (values) => fields.map((f) => values[f] ?? '').filter(Boolean).join(separator),
  }),

  /**
   * TR: Bağımlı olunan alan değişirse bu alanı sıfırla.
   * (Örn: Ülke değişince Şehir seçimini sıfırla).
   *
   * EN: Reset this field if the dependent field changes.
   * (E.g., Reset City selection when Country changes).
   */
  resetOnChange: (dependsOn: string): FieldDependency => ({
    dependsOn: [dependsOn],
    onDependencyChange: (_, ctx) => ctx.reset(),
  }),
};