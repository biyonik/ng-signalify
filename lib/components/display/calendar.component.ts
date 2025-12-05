import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  endDate?: Date;
  color?: string;
  allDay?: boolean;
  data?: any;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

/**
 * SigCalendar - Signal-based calendar component
 * 
 * Usage:
 * <sig-calendar
 *   [(selectedDate)]="date"
 *   [events]="events"
 *   [view]="'month'"
 *   (dateClick)="onDateClick($event)"
 *   (eventClick)="onEventClick($event)"
 * />
 */
@Component({
  selector: 'sig-calendar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-calendar">
      <!-- Header -->
      <div class="sig-calendar__header">
        <div class="sig-calendar__nav">
          <button type="button" (click)="prevPeriod()">◀</button>
          <button type="button" (click)="today()">Bugün</button>
          <button type="button" (click)="nextPeriod()">▶</button>
        </div>

        <h2 class="sig-calendar__title">{{ headerTitle() }}</h2>

        <div class="sig-calendar__views">
          <button
            type="button"
            [class.sig-calendar__view-btn--active]="view() === 'month'"
            (click)="view.set('month')"
          >
            Ay
          </button>
          <button
            type="button"
            [class.sig-calendar__view-btn--active]="view() === 'week'"
            (click)="view.set('week')"
          >
            Hafta
          </button>
          <button
            type="button"
            [class.sig-calendar__view-btn--active]="view() === 'day'"
            (click)="view.set('day')"
          >
            Gün
          </button>
        </div>
      </div>

      <!-- Month View -->
      @if (view() === 'month') {
        <div class="sig-calendar__month">
          <!-- Weekday Headers -->
          <div class="sig-calendar__weekdays">
            @for (day of weekDayNames; track day) {
              <div class="sig-calendar__weekday">{{ day }}</div>
            }
          </div>

          <!-- Days Grid -->
          <div class="sig-calendar__days">
            @for (day of calendarDays(); track day.date.getTime()) {
              <div
                class="sig-calendar__day"
                [class.sig-calendar__day--other]="!day.isCurrentMonth"
                [class.sig-calendar__day--today]="day.isToday"
                [class.sig-calendar__day--selected]="day.isSelected"
                [class.sig-calendar__day--weekend]="day.isWeekend"
                [class.sig-calendar__day--has-events]="day.events.length > 0"
                (click)="onDayClick(day)"
              >
                <span class="sig-calendar__day-number">{{ day.date.getDate() }}</span>
                
                @if (day.events.length > 0) {
                  <div class="sig-calendar__day-events">
                    @for (event of day.events.slice(0, maxEventsPerDay()); track event.id) {
                      <div
                        class="sig-calendar__event"
                        [style.background-color]="event.color || '#3b82f6'"
                        [title]="event.title"
                        (click)="onEventItemClick(event, $event)"
                      >
                        {{ event.title }}
                      </div>
                    }
                    @if (day.events.length > maxEventsPerDay()) {
                      <div class="sig-calendar__more">
                        +{{ day.events.length - maxEventsPerDay() }} daha
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Week View -->
      @if (view() === 'week') {
        <div class="sig-calendar__week">
          <div class="sig-calendar__week-header">
            <div class="sig-calendar__time-gutter"></div>
            @for (day of weekDays(); track day.date.getTime()) {
              <div 
                class="sig-calendar__week-day-header"
                [class.sig-calendar__week-day-header--today]="day.isToday"
              >
                <span class="sig-calendar__week-day-name">{{ getWeekDayName(day.date) }}</span>
                <span class="sig-calendar__week-day-number">{{ day.date.getDate() }}</span>
              </div>
            }
          </div>

          <div class="sig-calendar__week-body">
            <div class="sig-calendar__time-slots">
              @for (hour of hours; track hour) {
                <div class="sig-calendar__time-slot">
                  <div class="sig-calendar__time-label">{{ formatHour(hour) }}</div>
                  @for (day of weekDays(); track day.date.getTime()) {
                    <div 
                      class="sig-calendar__time-cell"
                      (click)="onTimeCellClick(day.date, hour)"
                    >
                      @for (event of getEventsForHour(day.date, hour); track event.id) {
                        <div
                          class="sig-calendar__time-event"
                          [style.background-color]="event.color || '#3b82f6'"
                          (click)="onEventItemClick(event, $event)"
                        >
                          {{ event.title }}
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Day View -->
      @if (view() === 'day') {
        <div class="sig-calendar__day-view">
          <div class="sig-calendar__day-header">
            {{ getDayViewHeader() }}
          </div>

          <div class="sig-calendar__day-body">
            @for (hour of hours; track hour) {
              <div class="sig-calendar__hour-row">
                <div class="sig-calendar__hour-label">{{ formatHour(hour) }}</div>
                <div 
                  class="sig-calendar__hour-content"
                  (click)="onTimeCellClick(currentDate(), hour)"
                >
                  @for (event of getEventsForHour(currentDate(), hour); track event.id) {
                    <div
                      class="sig-calendar__hour-event"
                      [style.background-color]="event.color || '#3b82f6'"
                      (click)="onEventItemClick(event, $event)"
                    >
                      {{ event.title }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-calendar {
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .sig-calendar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .sig-calendar__nav {
      display: flex;
      gap: 0.25rem;
    }

    .sig-calendar__nav button {
      padding: 0.375rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .sig-calendar__nav button:hover {
      background-color: #f3f4f6;
    }

    .sig-calendar__title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .sig-calendar__views {
      display: flex;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      overflow: hidden;
    }

    .sig-calendar__views button {
      padding: 0.375rem 0.75rem;
      border: none;
      background: white;
      font-size: 0.75rem;
      cursor: pointer;
      border-right: 1px solid #d1d5db;
    }

    .sig-calendar__views button:last-child {
      border-right: none;
    }

    .sig-calendar__view-btn--active {
      background-color: #3b82f6 !important;
      color: white;
    }

    /* Month View */
    .sig-calendar__weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-calendar__weekday {
      padding: 0.75rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }

    .sig-calendar__days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    .sig-calendar__day {
      min-height: 100px;
      padding: 0.5rem;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      cursor: pointer;
      transition: background-color 0.1s;
    }

    .sig-calendar__day:nth-child(7n) {
      border-right: none;
    }

    .sig-calendar__day:hover {
      background-color: #f9fafb;
    }

    .sig-calendar__day--other {
      background-color: #f9fafb;
    }

    .sig-calendar__day--other .sig-calendar__day-number {
      color: #9ca3af;
    }

    .sig-calendar__day--today .sig-calendar__day-number {
      background-color: #3b82f6;
      color: white;
      border-radius: 50%;
      width: 1.75rem;
      height: 1.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .sig-calendar__day--selected {
      background-color: #eff6ff;
    }

    .sig-calendar__day--weekend {
      background-color: #fefce8;
    }

    .sig-calendar__day-number {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .sig-calendar__day-events {
      margin-top: 0.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .sig-calendar__event {
      padding: 0.125rem 0.375rem;
      font-size: 0.625rem;
      color: white;
      border-radius: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sig-calendar__more {
      font-size: 0.625rem;
      color: #6b7280;
      padding: 0.125rem 0.375rem;
    }

    /* Week View */
    .sig-calendar__week {
      display: flex;
      flex-direction: column;
    }

    .sig-calendar__week-header {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-calendar__time-gutter {
      width: 60px;
      flex-shrink: 0;
    }

    .sig-calendar__week-day-header {
      flex: 1;
      padding: 0.5rem;
      text-align: center;
      border-left: 1px solid #e5e7eb;
    }

    .sig-calendar__week-day-header--today {
      background-color: #eff6ff;
    }

    .sig-calendar__week-day-name {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .sig-calendar__week-day-number {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .sig-calendar__week-body {
      max-height: 600px;
      overflow-y: auto;
    }

    .sig-calendar__time-slots {
      display: flex;
      flex-direction: column;
    }

    .sig-calendar__time-slot {
      display: flex;
      min-height: 48px;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-calendar__time-label {
      width: 60px;
      padding: 0.25rem;
      font-size: 0.75rem;
      color: #6b7280;
      text-align: right;
      padding-right: 0.5rem;
    }

    .sig-calendar__time-cell {
      flex: 1;
      border-left: 1px solid #e5e7eb;
      padding: 0.125rem;
      cursor: pointer;
    }

    .sig-calendar__time-cell:hover {
      background-color: #f9fafb;
    }

    .sig-calendar__time-event {
      padding: 0.25rem;
      font-size: 0.75rem;
      color: white;
      border-radius: 0.25rem;
      margin-bottom: 0.125rem;
    }

    /* Day View */
    .sig-calendar__day-view {
      display: flex;
      flex-direction: column;
    }

    .sig-calendar__day-header {
      padding: 1rem;
      text-align: center;
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-calendar__day-body {
      max-height: 600px;
      overflow-y: auto;
    }

    .sig-calendar__hour-row {
      display: flex;
      min-height: 60px;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-calendar__hour-label {
      width: 60px;
      padding: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
      text-align: right;
      border-right: 1px solid #e5e7eb;
    }

    .sig-calendar__hour-content {
      flex: 1;
      padding: 0.25rem;
      cursor: pointer;
    }

    .sig-calendar__hour-content:hover {
      background-color: #f9fafb;
    }

    .sig-calendar__hour-event {
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
      color: white;
      border-radius: 0.25rem;
      margin-bottom: 0.25rem;
    }
  `],
})
export class SigCalendarComponent {
  readonly weekDayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  readonly monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  readonly hours = Array.from({ length: 24 }, (_, i) => i);

  readonly selectedDate = model<Date | null>(null);
  readonly events = input<CalendarEvent[]>([]);
  readonly view = model<'month' | 'week' | 'day'>('month');
  readonly maxEventsPerDay = input<number>(3);
  readonly weekStartsOn = input<0 | 1>(1); // 0 = Sunday, 1 = Monday

  readonly dateClick = output<Date>();
  readonly eventClick = output<CalendarEvent>();
  readonly dateChange = output<Date>();

  readonly currentDate = signal(new Date());

  readonly headerTitle = computed(() => {
    const date = this.currentDate();
    const v = this.view();
    
    if (v === 'month') {
      return `${this.monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } else if (v === 'week') {
      const start = this.getWeekStart(date);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${this.monthNames[start.getMonth()]} ${start.getFullYear()}`;
      } else {
        return `${start.getDate()} ${this.monthNames[start.getMonth()]} - ${end.getDate()} ${this.monthNames[end.getMonth()]} ${start.getFullYear()}`;
      }
    } else {
      return `${date.getDate()} ${this.monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
  });

  readonly calendarDays = computed((): CalendarDay[] => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    // Calculate start offset
    let startOffset = firstDay.getDay() - this.weekStartsOn();
    if (startOffset < 0) startOffset = 7 + startOffset;

    // Previous month days
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push(this.createCalendarDay(d, false, today));
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push(this.createCalendarDay(d, true, today));
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push(this.createCalendarDay(d, false, today));
    }

    return days;
  });

  readonly weekDays = computed((): CalendarDay[] => {
    const start = this.getWeekStart(this.currentDate());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return this.createCalendarDay(d, true, today);
    });
  });

  private createCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const selected = this.selectedDate();
    const dayOfWeek = date.getDay();

    return {
      date,
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isSelected: selected ? this.isSameDay(date, selected) : false,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      events: this.getEventsForDate(date),
    };
  }

  private getEventsForDate(date: Date): CalendarEvent[] {
    return this.events().filter((event) => this.isSameDay(event.date, date));
  }

  getEventsForHour(date: Date, hour: number): CalendarEvent[] {
    return this.events().filter((event) => {
      return this.isSameDay(event.date, date) && event.date.getHours() === hour;
    });
  }

  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day - this.weekStartsOn();
    d.setDate(d.getDate() - (diff < 0 ? 7 + diff : diff));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getWeekDayName(date: Date): string {
    const dayIndex = date.getDay();
    const adjusted = dayIndex === 0 ? 6 : dayIndex - 1;
    return this.weekDayNames[adjusted];
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  getDayViewHeader(): string {
    const date = this.currentDate();
    const dayName = this.getWeekDayName(date);
    return `${dayName}, ${date.getDate()} ${this.monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  prevPeriod(): void {
    const date = new Date(this.currentDate());
    
    switch (this.view()) {
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
    }
    
    this.currentDate.set(date);
    this.dateChange.emit(date);
  }

  nextPeriod(): void {
    const date = new Date(this.currentDate());
    
    switch (this.view()) {
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'week':
        date.setDate(date.getDate() + 7);
        break;
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
    }
    
    this.currentDate.set(date);
    this.dateChange.emit(date);
  }

  today(): void {
    const date = new Date();
    this.currentDate.set(date);
    this.dateChange.emit(date);
  }

  onDayClick(day: CalendarDay): void {
    this.selectedDate.set(day.date);
    this.dateClick.emit(day.date);
  }

  onTimeCellClick(date: Date, hour: number): void {
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    this.selectedDate.set(newDate);
    this.dateClick.emit(newDate);
  }

  onEventItemClick(event: CalendarEvent, e: Event): void {
    e.stopPropagation();
    this.eventClick.emit(event);
  }
}