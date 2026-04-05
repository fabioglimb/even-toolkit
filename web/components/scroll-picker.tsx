import * as React from 'react';
import { cn } from '../utils/cn';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface ScrollColumn {
  options: { value: string; label: string }[];
  separator?: string;
}

interface ScrollPickerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: ScrollColumn[];
  value: string[];
  onValueChange: (value: string[]) => void;
}

interface DatePickerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  value: { day: number; month: number; year: number };
  onValueChange: (value: { day: number; month: number; year: number }) => void;
  minYear?: number;
  maxYear?: number;
}

interface TimePickerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  value: { hour: number; minute: number; period?: 'AM' | 'PM' };
  onValueChange: (value: { hour: number; minute: number; period?: 'AM' | 'PM' }) => void;
  format?: '12h' | '24h';
}

interface SelectionPickerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 200px
const PADDING_ITEMS = 2;
const PADDING_HEIGHT = ITEM_HEIGHT * PADDING_ITEMS; // 80px
const SCROLL_DEBOUNCE = 100;

/* -------------------------------------------------------------------------- */
/*  ScrollColumn component                                                    */
/* -------------------------------------------------------------------------- */

interface ColumnProps {
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
}

function Column({ options, selectedValue, onChange }: ColumnProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isUserScrolling = React.useRef(false);
  const scrollTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = React.useRef(true);

  const selectedIndex = React.useMemo(
    () => Math.max(0, options.findIndex((o) => o.value === selectedValue)),
    [options, selectedValue],
  );
  const [activeIndex, setActiveIndex] = React.useState(selectedIndex);

  const setActiveIndexIfNeeded = React.useCallback((nextIndex: number) => {
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  }, []);

  // Scroll to selected value on mount and when selectedValue changes externally
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Only programmatically scroll when not user-initiated
    if (isUserScrolling.current) return;
    setActiveIndexIfNeeded(selectedIndex);
    const targetTop = selectedIndex * ITEM_HEIGHT;
    el.scrollTo({ top: targetTop, behavior: 'instant' });
  }, [selectedIndex, setActiveIndexIfNeeded]);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, []);

  const handleScroll = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    isUserScrolling.current = true;
    const liveIndex = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_HEIGHT), options.length - 1));
    setActiveIndexIfNeeded(liveIndex);
    if (scrollTimer.current) clearTimeout(scrollTimer.current);

    scrollTimer.current = setTimeout(() => {
      if (!isMounted.current) return;
      const currentEl = containerRef.current;
      if (!currentEl) return;

      const scrollTop = currentEl.scrollTop;
      const closestIndex = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(closestIndex, options.length - 1));

      // Snap to the closest item
      currentEl.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: 'smooth' });
      setActiveIndexIfNeeded(clampedIndex);

      const newValue = options[clampedIndex]?.value;
      if (newValue && newValue !== selectedValue) {
        onChange(newValue);
      }

      // Reset flag after snap completes
      setTimeout(() => {
        if (isMounted.current) isUserScrolling.current = false;
      }, 150);
    }, SCROLL_DEBOUNCE);
  }, [options, selectedValue, onChange, setActiveIndexIfNeeded]);

  const handleItemClick = React.useCallback(
    (index: number) => {
      const el = containerRef.current;
      if (!el) return;
      isUserScrolling.current = true;
      el.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
      setActiveIndexIfNeeded(index);
      const newValue = options[index]?.value;
      if (newValue) onChange(newValue);
      setTimeout(() => {
        if (isMounted.current) isUserScrolling.current = false;
      }, 300);
    },
    [options, onChange, setActiveIndexIfNeeded],
  );

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overscroll-contain scrollbar-none"
      style={{
        height: CONTAINER_HEIGHT,
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      {/* Top padding so first item can center */}
      <div style={{ height: PADDING_HEIGHT }} aria-hidden />

      {options.map((option, i) => {
        const distance = Math.abs(i - activeIndex);
        const isSelected = i === activeIndex;

        // Opacity gradient: selected=1, +-1=0.4, +-2=0.2, beyond=0
        let opacity = 0;
        if (isSelected) opacity = 1;
        else if (distance === 1) opacity = 0.4;
        else if (distance === 2) opacity = 0.2;

        return (
          <div
            key={option.value}
            onClick={() => handleItemClick(i)}
            className={cn(
              'flex items-center justify-center cursor-pointer select-none transition-all duration-150',
              isSelected
                ? 'bg-accent text-text-highlight rounded-[6px] font-normal'
                : 'text-text-dim',
            )}
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: 'center',
              opacity: isSelected ? 1 : opacity,
            }}
          >
            <span className="text-[17px] tracking-[-0.17px]">{option.label}</span>
          </div>
        );
      })}

      {/* Bottom padding so last item can center */}
      <div style={{ height: PADDING_HEIGHT }} aria-hidden />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  ScrollPicker                                                              */
/* -------------------------------------------------------------------------- */

function ScrollPicker({ open, onClose, title, columns, value, onValueChange }: ScrollPickerProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleColumnChange = React.useCallback(
    (columnIndex: number, newVal: string) => {
      const next = [...value];
      next[columnIndex] = newVal;
      onValueChange(next);
    },
    [value, onValueChange],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[393px] bg-bg rounded-t-[6px] shadow-[0px_-4px_12px_0px_rgba(0,0,0,0.12)] pt-3">
        {/* Title */}
        <div className="px-4 py-3">
          <h2 className="text-[17px] tracking-[-0.17px] font-normal text-text text-center">
            {title}
          </h2>
        </div>

        {/* Columns */}
        <div className="relative flex items-center px-3" style={{ height: CONTAINER_HEIGHT }}>
          {columns.map((col, colIndex) => {
            // Resolve separator: check current column first, then previous column
            const sep = colIndex > 0
              ? (col.separator ?? columns[colIndex - 1]?.separator)
              : undefined;

            return (
              <React.Fragment key={colIndex}>
                {/* Separator between columns */}
                {sep && (
                  <div
                    className="flex items-center justify-center shrink-0 px-1"
                    style={{ height: CONTAINER_HEIGHT }}
                  >
                    <span className="text-[17px] tracking-[-0.17px] font-normal text-text">
                      {sep}
                    </span>
                  </div>
                )}
                <Column
                options={col.options}
                selectedValue={value[colIndex] ?? col.options[0]?.value ?? ''}
                onChange={(v) => handleColumnChange(colIndex, v)}
              />
              </React.Fragment>
            );
          })}
        </div>

        {/* Done button */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-[6px] bg-surface text-text text-[17px] tracking-[-0.17px] font-normal cursor-pointer transition-colors hover:bg-surface-light"
          >
            Done
          </button>
        </div>

        {/* Home indicator */}
        <div className="flex items-center justify-center h-[42px]">
          <div className="w-[139px] h-[5px] rounded-full bg-text" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DatePicker                                                                */
/* -------------------------------------------------------------------------- */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function DatePicker({
  open,
  onClose,
  title = 'Select Date',
  value,
  onValueChange,
  minYear = 1900,
  maxYear = 2100,
}: DatePickerProps) {
  const dayOptions = React.useMemo(
    () =>
      Array.from({ length: 31 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      })),
    [],
  );

  const monthOptions = React.useMemo(
    () =>
      MONTHS.map((m, i) => ({
        value: String(i + 1),
        label: m,
      })),
    [],
  );

  const yearOptions = React.useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
        value: String(minYear + i),
        label: String(minYear + i),
      })),
    [minYear, maxYear],
  );

  const columns: ScrollColumn[] = React.useMemo(
    () => [
      { options: dayOptions },
      { options: monthOptions },
      { options: yearOptions },
    ],
    [dayOptions, monthOptions, yearOptions],
  );

  const pickerValue = React.useMemo(
    () => [String(value.day), String(value.month), String(value.year)],
    [value.day, value.month, value.year],
  );

  const handleChange = React.useCallback(
    (v: string[]) => {
      onValueChange({
        day: parseInt(v[0], 10) || 1,
        month: parseInt(v[1], 10) || 1,
        year: parseInt(v[2], 10) || 2024,
      });
    },
    [onValueChange],
  );

  return (
    <ScrollPicker
      open={open}
      onClose={onClose}
      title={title}
      columns={columns}
      value={pickerValue}
      onValueChange={handleChange}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  TimePicker                                                                */
/* -------------------------------------------------------------------------- */

function TimePicker({
  open,
  onClose,
  title = 'Select Time',
  value,
  onValueChange,
  format = '24h',
}: TimePickerProps) {
  const is12h = format === '12h';

  const hourOptions = React.useMemo(
    () => {
      const max = is12h ? 12 : 23;
      const min = is12h ? 1 : 0;
      return Array.from({ length: max - min + 1 }, (_, i) => ({
        value: String(min + i),
        label: String(min + i).padStart(2, '0'),
      }));
    },
    [is12h],
  );

  const minuteOptions = React.useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        value: String(i),
        label: String(i).padStart(2, '0'),
      })),
    [],
  );

  const periodOptions = React.useMemo(
    () => [
      { value: 'AM', label: 'AM' },
      { value: 'PM', label: 'PM' },
    ],
    [],
  );

  const columns: ScrollColumn[] = React.useMemo(() => {
    const cols: ScrollColumn[] = [
      { options: hourOptions },
      { options: minuteOptions, separator: ':' },
    ];
    if (is12h) {
      cols.push({ options: periodOptions });
    }
    return cols;
  }, [hourOptions, minuteOptions, periodOptions, is12h]);

  const pickerValue = React.useMemo(() => {
    const vals = [String(value.hour), String(value.minute)];
    if (is12h) vals.push(value.period ?? 'AM');
    return vals;
  }, [value.hour, value.minute, value.period, is12h]);

  const handleChange = React.useCallback(
    (v: string[]) => {
      const result: { hour: number; minute: number; period?: 'AM' | 'PM' } = {
        hour: parseInt(v[0], 10) || 0,
        minute: parseInt(v[1], 10) || 0,
      };
      if (is12h) {
        result.period = (v[2] as 'AM' | 'PM') ?? 'AM';
      }
      onValueChange(result);
    },
    [is12h, onValueChange],
  );

  return (
    <ScrollPicker
      open={open}
      onClose={onClose}
      title={title}
      columns={columns}
      value={pickerValue}
      onValueChange={handleChange}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  SelectionPicker                                                           */
/* -------------------------------------------------------------------------- */

function SelectionPicker({
  open,
  onClose,
  title = 'Select',
  options,
  value,
  onValueChange,
}: SelectionPickerProps) {
  const columns: ScrollColumn[] = React.useMemo(
    () => [{ options }],
    [options],
  );

  const pickerValue = React.useMemo(() => [value], [value]);

  const handleChange = React.useCallback(
    (v: string[]) => {
      onValueChange(v[0] ?? '');
    },
    [onValueChange],
  );

  return (
    <ScrollPicker
      open={open}
      onClose={onClose}
      title={title}
      columns={columns}
      value={pickerValue}
      onValueChange={handleChange}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

export { ScrollPicker, DatePicker, TimePicker, SelectionPicker };
export type { ScrollPickerProps, ScrollColumn, DatePickerProps, TimePickerProps, SelectionPickerProps };
