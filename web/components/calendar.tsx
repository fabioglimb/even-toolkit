import * as React from 'react';
import { cn } from '../utils/cn';

// ─── Types ──────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  location?: string;
  description?: string;
}

export interface CalendarEventMove {
  event: CalendarEvent;
  start: Date;
  end: Date;
  dayDelta: number;
  minuteDelta: number;
}

type CalendarView = 'month' | 'week' | 'day';

// ─── Date helpers ───────────────────────────────────────────────

function startOfDay(d: Date): Date { const r = new Date(d); r.setHours(0, 0, 0, 0); return r; }
function isSameDay(a: Date, b: Date): boolean { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isToday(d: Date): boolean { return isSameDay(d, new Date()); }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const start = addDays(first, -startDay);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) days.push(addDays(start, i));
  return days;
}

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const start = addDays(date, -day);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function formatMonth(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const EVENT_DRAG_HOLD_MS = 260;
const EVENT_DRAG_THRESHOLD_PX = 72;
const DAY_ROW_HEIGHT_PX = 48;
const EVENT_DRAG_MINUTE_STEP = 15;
const EVENT_DRAG_MINUTE_THRESHOLD_PX = DAY_ROW_HEIGHT_PX * (EVENT_DRAG_MINUTE_STEP / 60);

// ─── CalendarHeader ─────────────────────────────────────────────

interface CalendarHeaderProps {
  date: Date;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function CalendarHeader({ date, view, onViewChange, onPrev, onNext, onToday }: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-2 mb-4">
      {/* Row 1: nav arrows + month title */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPrev} className="w-8 h-8 rounded-[6px] bg-surface-light flex items-center justify-center cursor-pointer text-text-dim hover:text-text transition-colors shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4"><rect x={14} y={4} width={2} height={2} fill="currentColor" /><rect x={12} y={6} width={2} height={2} fill="currentColor" /><rect x={10} y={8} width={2} height={2} fill="currentColor" /><rect x={8} y={10} width={2} height={2} fill="currentColor" /><rect x={10} y={12} width={2} height={2} fill="currentColor" /><rect x={12} y={14} width={2} height={2} fill="currentColor" /><rect x={14} y={16} width={2} height={2} fill="currentColor" /></svg>
        </button>
        <button type="button" onClick={onNext} className="w-8 h-8 rounded-[6px] bg-surface-light flex items-center justify-center cursor-pointer text-text-dim hover:text-text transition-colors shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4"><rect x={8} y={4} width={2} height={2} fill="currentColor" /><rect x={10} y={6} width={2} height={2} fill="currentColor" /><rect x={12} y={8} width={2} height={2} fill="currentColor" /><rect x={14} y={10} width={2} height={2} fill="currentColor" /><rect x={12} y={12} width={2} height={2} fill="currentColor" /><rect x={10} y={14} width={2} height={2} fill="currentColor" /><rect x={8} y={16} width={2} height={2} fill="currentColor" /></svg>
        </button>
        <span className="text-[15px] tracking-[-0.15px] font-normal ml-1 truncate">{formatMonth(date)}</span>
      </div>
      {/* Row 2: Today button + view switcher */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onToday} className="h-8 px-3 rounded-[6px] bg-surface-light text-[13px] tracking-[-0.13px] text-text-dim hover:text-text cursor-pointer transition-colors shrink-0">
          Today
        </button>
        <div className="inline-flex rounded-[6px] bg-surface-lighter overflow-visible h-8">
          {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={cn(
                'px-3 text-[13px] tracking-[-0.13px] cursor-pointer rounded-[6px] transition-colors capitalize',
                view === v ? 'bg-surface text-text shadow-sm' : 'text-text-dim hover:text-text',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MonthView ──────────────────────────────────────────────────

function MonthView({ date, events, onDateClick, onEventClick }: {
  date: Date;
  events: CalendarEvent[];
  onDateClick?: (d: Date) => void;
  onEventClick?: (e: CalendarEvent) => void;
}) {
  const grid = getMonthGrid(date.getFullYear(), date.getMonth());
  const currentMonth = date.getMonth();

  const eventsOnDay = (d: Date) => events.filter((e) => isSameDay(new Date(e.start), d));

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((l) => (
          <div key={l} className="text-center text-[11px] tracking-[-0.11px] text-text-muted py-1">{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((d, i) => {
          const dayEvents = eventsOnDay(d);
          const inMonth = d.getMonth() === currentMonth;
          const today = isToday(d);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDateClick?.(d)}
              className={cn(
                'flex flex-col items-center py-1.5 cursor-pointer rounded-[6px] transition-colors hover:bg-surface-light min-h-[48px]',
                !inMonth && 'opacity-40',
              )}
            >
              <span className={cn(
                'w-7 h-7 flex items-center justify-center rounded-full text-[13px] tracking-[-0.13px]',
                today && 'bg-accent text-text-highlight',
              )}>
                {d.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: e.color ?? 'var(--color-accent)' }}
                      onClick={(ev) => { ev.stopPropagation(); onEventClick?.(e); }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-text-muted">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── WeekView ───────────────────────────────────────────────────

function WeekView({ date, events, onEventClick }: {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (e: CalendarEvent) => void;
}) {
  const weekDays = getWeekDays(date);

  return (
    <div className="overflow-y-auto max-h-[500px]">
      {/* Header row */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] sticky top-0 bg-bg z-10">
        <div />
        {weekDays.map((d, i) => (
          <div key={i} className="text-center py-2">
            <div className="text-[11px] tracking-[-0.11px] text-text-muted">{DAY_LABELS[i]}</div>
            <div className={cn(
              'w-7 h-7 mx-auto flex items-center justify-center rounded-full text-[13px] tracking-[-0.13px]',
              isToday(d) && 'bg-accent text-text-highlight',
            )}>
              {d.getDate()}
            </div>
          </div>
        ))}
      </div>
      {/* Time grid */}
      {HOURS.map((h) => (
        <div key={h} className="grid grid-cols-[48px_repeat(7,1fr)] border-t border-border/30 min-h-[40px]">
          <div className="text-[11px] tracking-[-0.11px] text-text-muted pr-2 text-right py-1">
            {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
          </div>
          {weekDays.map((d, di) => {
            const cellEvents = events.filter((e) => {
              const s = new Date(e.start);
              return isSameDay(s, d) && s.getHours() === h;
            });
            return (
              <div key={di} className="border-l border-border/20 px-0.5 py-0.5">
                {cellEvents.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => onEventClick?.(e)}
                    className="w-full text-left rounded-[4px] px-1 py-0.5 text-[11px] tracking-[-0.11px] truncate cursor-pointer"
                    style={{ backgroundColor: (e.color ?? 'var(--color-accent)') + '20', color: e.color ?? 'var(--color-accent)' }}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── DayView ────────────────────────────────────────────────────

function DayView({ date, events, onEventClick, onEventMove, onDateChange }: {
  date: Date;
  events: CalendarEvent[];
  onEventClick?: (e: CalendarEvent) => void;
  onEventMove?: (move: CalendarEventMove) => void;
  onDateChange?: (d: Date) => void;
}) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.start), date));
  const now = new Date();
  const isCurrentDay = isToday(date);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOffsetX, setDragOffsetX] = React.useState(0);
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressEventRef = React.useRef<CalendarEvent | null>(null);
  const startXRef = React.useRef(0);
  const startYRef = React.useRef(0);
  const pointerMovedRef = React.useRef(false);

  const clearDragState = React.useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pressEventRef.current = null;
    pointerMovedRef.current = false;
    setDraggingId(null);
    setDragOffsetX(0);
    setDragOffsetY(0);
  }, []);

  React.useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const handlePointerDown = React.useCallback((event: CalendarEvent, clientX: number, clientY: number) => {
    startXRef.current = clientX;
    startYRef.current = clientY;
    pressEventRef.current = event;
    pointerMovedRef.current = false;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      setDraggingId(event.id);
      setDragOffsetX(0);
      holdTimerRef.current = null;
    }, EVENT_DRAG_HOLD_MS);
  }, []);

  const handlePointerMove = React.useCallback((clientX: number, clientY: number) => {
    const dx = clientX - startXRef.current;
    const dy = clientY - startYRef.current;
    if (!draggingId) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        pointerMovedRef.current = true;
      }
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      }
      return;
    }
    setDragOffsetX(dx);
    setDragOffsetY(dy);
  }, [draggingId]);

  const handlePointerEnd = React.useCallback(() => {
    const dragged = pressEventRef.current;
    if (!dragged) {
      clearDragState();
      return;
    }

    if (draggingId) {
      const dayDelta = Math.trunc(dragOffsetX / EVENT_DRAG_THRESHOLD_PX);
      const minuteDelta = Math.round(dragOffsetY / EVENT_DRAG_MINUTE_THRESHOLD_PX) * EVENT_DRAG_MINUTE_STEP;
      if (dayDelta !== 0 || minuteDelta !== 0) {
        const durationMs = new Date(dragged.end).getTime() - new Date(dragged.start).getTime();
        const nextStart = addDays(new Date(dragged.start), dayDelta);
        nextStart.setMinutes(nextStart.getMinutes() + minuteDelta);
        const nextEnd = new Date(nextStart.getTime() + durationMs);
        const actualDayDelta = Math.round(
          (startOfDay(nextStart).getTime() - startOfDay(new Date(dragged.start)).getTime()) / 86400000,
        );
        onEventMove?.({
          event: dragged,
          start: nextStart,
          end: nextEnd,
          dayDelta: actualDayDelta,
          minuteDelta,
        });
        onDateChange?.(startOfDay(nextStart));
      } else {
        onEventClick?.(dragged);
      }
    } else if (!pointerMovedRef.current) {
      onEventClick?.(dragged);
    }

    clearDragState();
  }, [clearDragState, dragOffsetX, dragOffsetY, draggingId, onDateChange, onEventClick, onEventMove]);

  return (
    <div className="overflow-y-auto max-h-[500px]">
      <div className="text-[15px] tracking-[-0.15px] font-normal mb-3">
        {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
      {HOURS.map((h) => {
        const hourEvents = dayEvents.filter((e) => new Date(e.start).getHours() === h);
        const isNow = isCurrentDay && now.getHours() === h;
        return (
          <div key={h} className="flex border-t border-border/30 min-h-[48px] relative">
            {isNow && <div className="absolute inset-x-0 top-0 border-t-2 border-negative z-10" />}
            <div className="w-12 shrink-0 text-[11px] tracking-[-0.11px] text-text-muted text-right pr-2 py-1">
              {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
            </div>
            <div className="flex-1 px-1 py-0.5">
              {hourEvents.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="w-full text-left rounded-[6px] px-3 py-2 mb-1 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: (e.color ?? 'var(--color-accent)') + '20',
                    transform: draggingId === e.id ? `translate(${dragOffsetX}px, ${dragOffsetY}px)` : undefined,
                    transition: draggingId === e.id ? 'none' : 'transform 180ms ease, background-color 180ms ease',
                    opacity: draggingId === e.id ? 0.9 : 1,
                    boxShadow: draggingId === e.id ? '0 6px 18px rgba(0,0,0,0.12)' : undefined,
                    touchAction: 'none',
                    position: draggingId === e.id ? 'relative' : undefined,
                    zIndex: draggingId === e.id ? 20 : undefined,
                  }}
                  onPointerDown={(ev) => handlePointerDown(e, ev.clientX, ev.clientY)}
                  onPointerMove={(ev) => handlePointerMove(ev.clientX, ev.clientY)}
                  onPointerUp={handlePointerEnd}
                  onPointerCancel={clearDragState}
                  onPointerLeave={() => {
                    if (!draggingId && holdTimerRef.current) {
                      clearTimeout(holdTimerRef.current);
                      holdTimerRef.current = null;
                    }
                  }}
                >
                  <div className="text-[15px] tracking-[-0.15px]" style={{ color: e.color ?? 'var(--color-accent)' }}>{e.title}</div>
                  <div className="text-[11px] tracking-[-0.11px] text-text-dim">
                    {formatTime(new Date(e.start))} – {formatTime(new Date(e.end))}
                    {e.location && ` · ${e.location}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendar (Main) ────────────────────────────────────────────

interface CalendarProps {
  events?: CalendarEvent[];
  view?: CalendarView;
  onViewChange?: (v: CalendarView) => void;
  selectedDate?: Date;
  onDateChange?: (d: Date) => void;
  onEventClick?: (e: CalendarEvent) => void;
  onEventMove?: (move: CalendarEventMove) => void;
  className?: string;
}

function Calendar({
  events = [],
  view: controlledView,
  onViewChange,
  selectedDate: controlledDate,
  onDateChange,
  onEventClick,
  onEventMove,
  className,
}: CalendarProps) {
  const [internalView, setInternalView] = React.useState<CalendarView>('month');
  const [internalDate, setInternalDate] = React.useState(new Date());

  const view = controlledView ?? internalView;
  const date = controlledDate ?? internalDate;

  const setView = (v: CalendarView) => { onViewChange ? onViewChange(v) : setInternalView(v); };
  const setDate = (d: Date) => { onDateChange ? onDateChange(d) : setInternalDate(d); };

  const navigate = (dir: -1 | 1) => {
    if (view === 'month') setDate(new Date(date.getFullYear(), date.getMonth() + dir, 1));
    else if (view === 'week') setDate(addDays(date, dir * 7));
    else setDate(addDays(date, dir));
  };

  return (
    <div className={cn('', className)}>
      <CalendarHeader
        date={date}
        view={view}
        onViewChange={setView}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={() => setDate(new Date())}
      />
      {view === 'month' && (
        <MonthView
          date={date}
          events={events}
          onDateClick={(d) => { setDate(d); setView('day'); }}
          onEventClick={onEventClick}
        />
      )}
      {view === 'week' && <WeekView date={date} events={events} onEventClick={onEventClick} />}
      {view === 'day' && (
        <DayView
          date={date}
          events={events}
          onEventClick={onEventClick}
          onEventMove={onEventMove}
          onDateChange={setDate}
        />
      )}
    </div>
  );
}

export { Calendar, CalendarHeader, MonthView, WeekView, DayView };
export type { CalendarProps, CalendarView };
