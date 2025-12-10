import {Component, computed, inject, signal, ViewEncapsulation} from '@angular/core';
import {CommonModule, DatePipe, DecimalPipe} from '@angular/common';
import {DevTools, LogLevel} from '../../infrastructure/devtools';

/**
 * TR: DevTools paneli için aktif sekme seçenekleri.
 *
 * EN: Active tab options for DevTools panel.
 */
export type DevToolsTab = 'logs' | 'performance' | 'signals';

/**
 * TR: Sinyal tabanlı Geliştirici Araçları Paneli.
 * Logları, performans ölçümlerini ve sinyal takibini görselleştiren arayüz.
 * Genellikle uygulamanın kök bileşenine (AppComponent) eklenir.
 *
 * EN: Signal-based Developer Tools Panel.
 * Interface visualizing logs, performance metrics, and signal tracking.
 * Usually added to the application's root component (AppComponent).
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 */
@Component({
    selector: 'sig-devtools-panel',
    standalone: true,
    imports: [CommonModule, DatePipe, DecimalPipe],
    encapsulation: ViewEncapsulation.None, // Global stillerden etkilenmemesi için ShadowDOM da düşünülebilir ama şimdilik None.
    template: `
        @if (!isOpen()) {
            <button 
                class="sig-dt-trigger" 
                (click)="toggle()"
                title="Open Signalify DevTools"
            >
                🛠️
                @if (errorCount() > 0) {
                    <span class="sig-dt-badge sig-dt-badge--error">{{ errorCount() }}</span>
                }
            </button>
        } @else {
            <div class="sig-dt-panel">
                <div class="sig-dt-header">
                    <div class="sig-dt-title">
                        <span class="sig-dt-logo">⚡</span> Signalify DevTools
                    </div>
                    <div class="sig-dt-actions">
                        <button class="sig-dt-btn sig-dt-btn--sm" (click)="clearCurrent()" title="Temizle">🚫</button>
                        <button class="sig-dt-close" (click)="toggle()">✕</button>
                    </div>
                </div>

                <div class="sig-dt-tabs">
                    <button 
                        class="sig-dt-tab" 
                        [class.active]="activeTab() === 'logs'"
                        (click)="setTab('logs')"
                    >
                        Logs
                        <span class="sig-dt-count">{{ logCount() }}</span>
                    </button>
                    <button 
                        class="sig-dt-tab" 
                        [class.active]="activeTab() === 'performance'"
                        (click)="setTab('performance')"
                    >
                        Performance
                        <span class="sig-dt-count">{{ perfCount() }}</span>
                    </button>
                </div>

                <div class="sig-dt-content">
                    
                    @if (activeTab() === 'logs') {
                        <div class="sig-dt-toolbar">
                            <label><input type="checkbox" [checked]="showDebug()" (change)="toggleLevel('debug')"> Debug</label>
                            <label><input type="checkbox" [checked]="showInfo()" (change)="toggleLevel('info')"> Info</label>
                            <label><input type="checkbox" [checked]="showWarn()" (change)="toggleLevel('warn')"> Warn</label>
                            <label><input type="checkbox" [checked]="showError()" (change)="toggleLevel('error')"> Error</label>
                        </div>

                        <div class="sig-dt-list">
                            @for (log of visibleLogs(); track log.id) {
                                <div class="sig-dt-item" [ngClass]="'sig-dt-item--' + log.level">
                                    <div class="sig-dt-meta">
                                        <span class="sig-dt-time">{{ log.timestamp | date:'HH:mm:ss.SSS' }}</span>
                                        <span class="sig-dt-tag">{{ log.category }}</span>
                                    </div>
                                    <div class="sig-dt-msg">
                                        {{ log.message }}
                                        @if (log.data) {
                                            <pre class="sig-dt-data">{{ log.data | json }}</pre>
                                        }
                                        @if (log.stack) {
                                            <details class="sig-dt-stack">
                                                <summary>Stack Trace</summary>
                                                {{ log.stack }}
                                            </details>
                                        }
                                    </div>
                                </div>
                            } @empty {
                                <div class="sig-dt-empty">Log kaydı yok</div>
                            }
                        </div>
                    }

                    @if (activeTab() === 'performance') {
                        <div class="sig-dt-list">
                            @for (perf of devTools.getPerformanceEntries()(); track perf.id) {
                                <div class="sig-dt-item" [class.slow]="perf.duration > 100">
                                    <div class="sig-dt-row">
                                        <span class="sig-dt-name">{{ perf.name }}</span>
                                        <span class="sig-dt-duration">{{ perf.duration | number:'1.0-2' }}ms</span>
                                    </div>
                                    <div class="sig-dt-bar-container">
                                        <div 
                                            class="sig-dt-bar" 
                                            [style.width.%]="(perf.duration / 500) * 100"
                                            [class.slow]="perf.duration > 100"
                                        ></div>
                                    </div>
                                </div>
                            } @empty {
                                <div class="sig-dt-empty">Performans verisi yok</div>
                            }
                        </div>
                    }
                </div>
            </div>
        }
    `,
    styles: [`
        .sig-dt-trigger {
            position: fixed; bottom: 20px; right: 20px; z-index: 99999;
            width: 48px; height: 48px; border-radius: 50%;
            background: #2d3436; border: 2px solid #636e72;
            color: white; font-size: 24px; cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s;
        }
        .sig-dt-trigger:hover { transform: scale(1.1); }
        
        .sig-dt-badge {
            position: absolute; top: -5px; right: -5px;
            background: #d63031; color: white;
            font-size: 10px; font-weight: bold;
            padding: 2px 6px; border-radius: 10px;
            border: 1px solid white;
        }

        .sig-dt-panel {
            position: fixed; bottom: 20px; right: 20px; z-index: 99999;
            width: 500px; height: 400px;
            background: #1e272e; color: #d2dae2;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            display: flex; flex-direction: column;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            border: 1px solid #485460;
        }

        .sig-dt-header {
            padding: 10px 15px;
            background: #2d3436;
            border-bottom: 1px solid #485460;
            display: flex; justify-content: space-between; align-items: center;
            border-radius: 8px 8px 0 0;
        }
        .sig-dt-title { font-weight: bold; font-size: 14px; color: #00d2d3; }
        .sig-dt-close { background: none; border: none; color: #808e9b; cursor: pointer; font-size: 16px; }
        .sig-dt-close:hover { color: white; }

        .sig-dt-tabs {
            display: flex; background: #2d3436;
            border-bottom: 1px solid #485460;
        }
        .sig-dt-tab {
            flex: 1; padding: 8px;
            background: none; border: none;
            color: #808e9b; cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        .sig-dt-tab.active { color: white; border-bottom-color: #00d2d3; background: #353b48; }
        .sig-dt-count { background: #485460; padding: 1px 5px; border-radius: 4px; font-size: 10px; margin-left: 5px; }

        .sig-dt-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
        .sig-dt-toolbar { padding: 8px; border-bottom: 1px solid #485460; display: flex; gap: 10px; }
        
        .sig-dt-list { flex: 1; overflow-y: auto; padding: 0; }
        .sig-dt-item { padding: 8px 12px; border-bottom: 1px solid #353b48; }
        .sig-dt-item:hover { background: #2f3640; }

        .sig-dt-meta { display: flex; gap: 8px; margin-bottom: 4px; color: #808e9b; font-size: 10px; }
        .sig-dt-tag { background: #485460; padding: 0 4px; border-radius: 2px; color: white; }
        
        .sig-dt-item--error { border-left: 3px solid #ff6b6b; background: rgba(255, 107, 107, 0.1); }
        .sig-dt-item--warn { border-left: 3px solid #feca57; }
        .sig-dt-item--info { border-left: 3px solid #54a0ff; }
        .sig-dt-item--debug { border-left: 3px solid #c8d6e5; color: #808e9b; }

        .sig-dt-data { background: #1e272e; padding: 5px; border-radius: 4px; overflow-x: auto; color: #ff9f43; margin-top: 4px; }
        .sig-dt-empty { padding: 20px; text-align: center; color: #808e9b; }

        .sig-dt-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .sig-dt-bar-container { height: 4px; background: #485460; border-radius: 2px; overflow: hidden; }
        .sig-dt-bar { height: 100%; background: #00d2d3; }
        .sig-dt-bar.slow { background: #ff9f43; }
        .sig-dt-item.slow .sig-dt-duration { color: #ff9f43; font-weight: bold; }
    `]
})
export class DevToolsPanelComponent {
    protected readonly devTools = inject(DevTools);

    // TR: UI Durumları
    // EN: UI States
    isOpen = signal(false);
    activeTab = signal<DevToolsTab>('logs');

    // TR: Log Filtreleri
    // EN: Log Filters
    showDebug = signal(true);
    showInfo = signal(true);
    showWarn = signal(true);
    showError = signal(true);

    // TR: Hesaplanan değerler (Computed)
    // EN: Computed values
    errorCount = this.devTools.errorCount;

    // TR: Tüm log listesini değil, filtrelenmiş listeyi göster
    // EN: Show filtered list, not all logs
    visibleLogs = computed(() => {
        return this.devTools.getLogs()().filter(log => {
            if (log.level === 'debug' && !this.showDebug()) return false;
            if (log.level === 'info' && !this.showInfo()) return false;
            if (log.level === 'warn' && !this.showWarn()) return false;
            if (log.level === 'error' && !this.showError()) return false;
            return true;
        }).reverse(); // En yeni en üstte
    });

    logCount = computed(() => this.devTools.getLogs()().length);
    perfCount = computed(() => this.devTools.getPerformanceEntries()().length);

    toggle(): void {
        this.isOpen.update(v => !v);
    }

    setTab(tab: DevToolsTab): void {
        this.activeTab.set(tab);
    }

    toggleLevel(level: LogLevel): void {
        switch (level) {
            case 'debug': this.showDebug.update(v => !v); break;
            case 'info': this.showInfo.update(v => !v); break;
            case 'warn': this.showWarn.update(v => !v); break;
            case 'error': this.showError.update(v => !v); break;
        }
    }

    clearCurrent(): void {
        if (this.activeTab() === 'logs') {
            this.devTools.clearLogs();
        } else if (this.activeTab() === 'performance') {
            this.devTools.clearPerformance();
        }
    }
}