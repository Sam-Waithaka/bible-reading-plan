import { CalendarClock, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock3, Moon, Rocket, RotateCcw, Send, Sunrise, Sunset, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { WritingStatus, WritingWorkflowNote } from '../../../types/writing';

type WritingWorkflowControlsProps = {
  canReturnToDraft: boolean;
  canSubmitForReview: boolean;
  canUnschedule: boolean;
  darkMode: boolean;
  onReturnToDraft: (note: string) => Promise<boolean>;
  onSubmitForReview: (note: string) => Promise<boolean>;
  onUnschedule: () => Promise<boolean>;
  saving: boolean;
  scheduledFor?: string | null;
  status: WritingStatus;
  workflowNotes?: WritingWorkflowNote[];
};

type PublicationTab = 'publish' | 'schedule';
type SchedulerPanel = 'date' | 'time' | null;
type ClockStep = 'hour' | 'minute';
type ScheduleDate = { day: number; month: number; year: number };
type ScheduleTime = { hour: number; minute: number };
type QuickScheduleOption = { icon: typeof Clock3; key: string; label: string; subtitle: string; resolve: () => { date: ScheduleDate; time: ScheduleTime } };

const NAIROBI_TIME_ZONE = 'Africa/Nairobi';
const NAIROBI_OFFSET_HOURS = 3;
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC', year: 'numeric' });
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
  weekday: 'long',
  year: 'numeric',
});
const SUMMARY_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', weekday: 'long' });
const SUMMARY_DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC', year: 'numeric' });

const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (date: ScheduleDate) => `${date.year}-${pad(date.month)}-${pad(date.day)}`;
const sameDate = (left?: ScheduleDate | null, right?: ScheduleDate | null) => Boolean(left && right && left.year === right.year && left.month === right.month && left.day === right.day);
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const monthLabel = (year: number, month: number) => MONTH_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
const dateForFormatting = (date: ScheduleDate) => new Date(Date.UTC(date.year, date.month - 1, date.day));
const formatFullDate = (date?: ScheduleDate | null) => date ? FULL_DATE_FORMATTER.format(dateForFormatting(date)) : 'Choose publication date';
const formatSummaryDate = (date: ScheduleDate) => SUMMARY_DATE_FORMATTER.format(dateForFormatting(date));
const formatSummaryWeekday = (date: ScheduleDate) => SUMMARY_WEEKDAY_FORMATTER.format(dateForFormatting(date));
const formatTime = (time?: ScheduleTime | null) => {
  if (!time) return 'Choose time';
  const period = time.hour >= 12 ? 'PM' : 'AM';
  const hour12 = time.hour % 12 || 12;
  return `${hour12}:${pad(time.minute)} ${period}`;
};

const getNairobiParts = (value = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    timeZone: NAIROBI_TIME_ZONE,
    year: 'numeric',
  });
  const parts = Object.fromEntries(formatter.formatToParts(value).map((part) => [part.type, part.value]));
  return {
    date: { day: Number(parts.day), month: Number(parts.month), year: Number(parts.year) },
    time: { hour: Number(parts.hour), minute: Number(parts.minute) },
  };
};

const utcIsoFromNairobi = (date: ScheduleDate, time: ScheduleTime) => new Date(Date.UTC(
  date.year,
  date.month - 1,
  date.day,
  time.hour - NAIROBI_OFFSET_HOURS,
  time.minute,
  0,
  0,
)).toISOString();

const addMinutesInNairobi = (minutes: number) => getNairobiParts(new Date(Date.now() + minutes * 60_000));
const dateTimeFromNairobi = (date: ScheduleDate, time: ScheduleTime) => new Date(utcIsoFromNairobi(date, time));
const isFutureNairobiDateTime = (date?: ScheduleDate | null, time?: ScheduleTime | null) => Boolean(date && time && dateTimeFromNairobi(date, time).getTime() > Date.now());
const isDateBeforeTodayInNairobi = (date: ScheduleDate) => dateKey(date) < dateKey(getNairobiParts().date);

const fromIsoToNairobi = (value?: string | null) => {
  if (!value) return { date: null, time: null };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: null, time: null };
  return getNairobiParts(parsed);
};

const parseTypedTime = (value: string): ScheduleTime | null => {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const period = match[3]?.toLowerCase();
  if (minute < 0 || minute > 59) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
  } else if (hour < 0 || hour > 23) {
    return null;
  }
  return { hour, minute };
};

const nextMondayAt = (hour: number, minute: number) => {
  const now = getNairobiParts();
  const todayUtc = Date.UTC(now.date.year, now.date.month - 1, now.date.day);
  const todayDay = new Date(todayUtc).getUTCDay();
  const daysUntilMonday = ((1 - todayDay + 7) % 7) || 7;
  const next = new Date(todayUtc + daysUntilMonday * 24 * 60 * 60_000);
  return {
    date: { day: next.getUTCDate(), month: next.getUTCMonth() + 1, year: next.getUTCFullYear() },
    time: { hour, minute },
  };
};

const tomorrowAt = (hour: number, minute: number) => {
  const now = getNairobiParts();
  const todayUtc = Date.UTC(now.date.year, now.date.month - 1, now.date.day);
  const next = new Date(todayUtc + 24 * 60 * 60_000);
  return {
    date: { day: next.getUTCDate(), month: next.getUTCMonth() + 1, year: next.getUTCFullYear() },
    time: { hour, minute },
  };
};

const nextWeekAt = (hour: number, minute: number) => {
  const now = getNairobiParts();
  const todayUtc = Date.UTC(now.date.year, now.date.month - 1, now.date.day);
  const next = new Date(todayUtc + 7 * 24 * 60 * 60_000);
  return {
    date: { day: next.getUTCDate(), month: next.getUTCMonth() + 1, year: next.getUTCFullYear() },
    time: { hour, minute },
  };
};

const useQuickScheduleOptions = (): QuickScheduleOption[] => useMemo(() => [
  { icon: Clock3, key: '30m', label: 'In 30 minutes', subtitle: formatTime(addMinutesInNairobi(30).time), resolve: () => addMinutesInNairobi(30) },
  { icon: Clock3, key: '1h', label: 'In 1 hour', subtitle: formatTime(addMinutesInNairobi(60).time), resolve: () => addMinutesInNairobi(60) },
  { icon: Sunrise, key: 'tomorrow-morning', label: 'Tomorrow Morning', subtitle: '9:00 AM', resolve: () => tomorrowAt(9, 0) },
  { icon: Sunset, key: 'tomorrow-evening', label: 'Tomorrow Evening', subtitle: '6:00 PM', resolve: () => tomorrowAt(18, 0) },
  { icon: CalendarDays, key: 'next-monday', label: 'Next Monday', subtitle: '9:00 AM', resolve: () => nextMondayAt(9, 0) },
  { icon: Moon, key: 'next-week', label: 'Next Week', subtitle: '8:00 AM', resolve: () => nextWeekAt(8, 0) },
], []);

const PublishingModeToggle = ({ canPublish, canSchedule, darkMode, mode, onModeChange }: { canPublish: boolean; canSchedule: boolean; darkMode: boolean; mode: PublicationTab; onModeChange: (mode: PublicationTab) => void }) => {
  const tabShellClass = darkMode ? 'border-white/10 bg-[#080808]/80' : 'border-black/10 bg-white/70';
  const activeClass = 'bg-red-800 text-white shadow-lg shadow-red-950/20';
  const inactiveClass = darkMode ? 'text-stone-300 hover:bg-white/10' : 'text-zinc-700 hover:bg-red-950/[0.04]';

  return (
    <div className={`grid rounded-full border p-1 ${tabShellClass} ${canPublish && canSchedule ? 'grid-cols-2' : 'grid-cols-1'}`} role="tablist" aria-label="Publication actions">
      {canPublish ? (
        <button aria-selected={mode === 'publish'} className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-black transition motion-safe:duration-200 ${mode === 'publish' ? activeClass : inactiveClass}`} onClick={() => onModeChange('publish')} role="tab" type="button">
          <Rocket size={14} /> Publish Now
        </button>
      ) : null}
      {canSchedule ? (
        <button aria-selected={mode === 'schedule'} className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-black transition motion-safe:duration-200 ${mode === 'schedule' ? activeClass : inactiveClass}`} onClick={() => onModeChange('schedule')} role="tab" type="button">
          <CalendarClock size={14} /> Schedule Publication
        </button>
      ) : null}
    </div>
  );
};

const PublishingCalendar = ({ darkMode, onSelect, selectedDate }: { darkMode: boolean; onSelect: (date: ScheduleDate | null) => void; selectedDate: ScheduleDate | null }) => {
  const fallback = selectedDate || getNairobiParts().date;
  const [displayMonth, setDisplayMonth] = useState({ month: fallback.month, year: fallback.year });
  const today = getNairobiParts().date;
  const firstDay = new Date(Date.UTC(displayMonth.year, displayMonth.month - 1, 1)).getUTCDay();
  const totalDays = daysInMonth(displayMonth.year, displayMonth.month);
  const calendarDays: Array<ScheduleDate | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => ({ day: index + 1, month: displayMonth.month, year: displayMonth.year })),
  ];

  const moveMonth = (direction: number) => {
    const next = new Date(Date.UTC(displayMonth.year, displayMonth.month - 1 + direction, 1));
    setDisplayMonth({ month: next.getUTCMonth() + 1, year: next.getUTCFullYear() });
  };

  const menuSurfaceClass = darkMode
    ? 'border-white/10 bg-zinc-950 text-stone-100 shadow-black/40'
    : 'border-black/10 bg-white text-zinc-950 shadow-zinc-900/15';
  const neutralPillClass = darkMode
    ? 'border-white/15 bg-white/10 text-stone-100 backdrop-blur-xl hover:bg-white/15'
    : 'border-black/10 bg-[#fffaf0]/70 text-zinc-700 backdrop-blur-xl hover:bg-white/80';
  const inactiveOptionClass = darkMode
    ? 'bg-white/10 text-stone-100 hover:bg-white/15'
    : 'bg-[#f8f5ef] text-zinc-950 hover:bg-[#ece7de]';
  const disabledOptionClass = darkMode
    ? 'bg-white/[0.04] text-stone-500 opacity-60'
    : 'bg-[#f8f5ef] text-zinc-400 opacity-75';

  return (
    <div className={`rounded-3xl border p-4 shadow-2xl motion-safe:animate-[fadeIn_180ms_ease-out] ${menuSurfaceClass}`}>
      <div className="mx-auto max-w-[22rem]">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-red-900 dark:text-red-200">Publication Date</p>
        <div className="flex items-center justify-between gap-3">
          <button aria-label="Previous month" className={`grid size-10 place-items-center rounded-full border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-700 ${neutralPillClass}`} onClick={() => moveMonth(-1)} type="button"><ChevronLeft size={16} /></button>
          <p className={darkMode ? 'text-sm font-black text-stone-100' : 'text-sm font-black text-zinc-950'}>{monthLabel(displayMonth.year, displayMonth.month)}</p>
          <button aria-label="Next month" className={`grid size-10 place-items-center rounded-full border shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-700 ${neutralPillClass}`} onClick={() => moveMonth(1)} type="button"><ChevronRight size={16} /></button>
        </div>

        <div className="mt-4 grid grid-cols-7 justify-items-center gap-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-red-900 dark:text-red-200">
          {WEEKDAYS.map((day) => <span key={day} className="grid size-8 place-items-center">{day}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 justify-items-center gap-2">
          {calendarDays.map((item, index) => {
            if (!item) return <span key={`blank-${index}`} className="size-10" />;
            const disabled = isDateBeforeTodayInNairobi(item);
            const selected = sameDate(item, selectedDate);
            const current = sameDate(item, today);
            const stateClass = disabled
              ? `${disabledOptionClass} cursor-not-allowed`
              : selected
                ? 'bg-red-800 text-white shadow-md shadow-red-950/20'
                : current
                  ? 'border border-red-800 bg-[#f8f5ef] text-red-800 dark:bg-white/10 dark:text-red-200'
                  : inactiveOptionClass;
            return (
              <button
                aria-label={formatFullDate(item)}
                className={`grid size-10 place-items-center rounded-full text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-red-700 ${stateClass}`}
                disabled={disabled}
                onClick={() => onSelect(item)}
                type="button"
              >
                {item.day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-black/10 pt-4 dark:border-white/10">
          <button className={`min-h-10 rounded-full border px-4 text-xs font-black shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-700 ${neutralPillClass}`} onClick={() => { onSelect(today); setDisplayMonth({ month: today.month, year: today.year }); }} type="button">Today</button>
          <button className={`min-h-10 rounded-full border px-4 text-xs font-black shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-700 ${neutralPillClass}`} onClick={() => onSelect(null)} type="button">Clear</button>
        </div>
      </div>
    </div>
  );
};
const PublishingClock = ({ darkMode, onChange, selectedDate, time }: { darkMode: boolean; onChange: (time: ScheduleTime) => void; selectedDate: ScheduleDate | null; time: ScheduleTime | null }) => {
  const [step, setStep] = useState<ClockStep>('hour');
  const [typedTime, setTypedTime] = useState(() => formatTime(time));
  const selectedTime = time || { hour: 9, minute: 0 };
  const period = selectedTime.hour >= 12 ? 'PM' : 'AM';
  const hour12 = selectedTime.hour % 12 || 12;
  const minuteOptions = Array.from({ length: 12 }, (_, index) => index * 5);
  const values = step === 'hour' ? Array.from({ length: 12 }, (_, index) => index + 1) : minuteOptions;
  const currentValue = step === 'hour' ? hour12 : selectedTime.minute;
  const clockSurfaceClass = darkMode ? 'border-white/10 bg-[#111111]' : 'border-black/10 bg-white';
  const quietButtonClass = darkMode ? 'border-white/10 bg-white/5 text-stone-200 hover:bg-white/10' : 'border-black/10 bg-[#fffaf0] text-zinc-700 hover:bg-red-950/[0.04]';

  useEffect(() => setTypedTime(formatTime(time)), [time]);

  const commitHour = (nextHour12: number) => {
    const nextHour = period === 'PM' ? (nextHour12 % 12) + 12 : nextHour12 % 12;
    onChange({ ...selectedTime, hour: nextHour });
    setStep('minute');
  };

  const commitMinute = (minute: number) => onChange({ ...selectedTime, minute });
  const commitPeriod = (nextPeriod: 'AM' | 'PM') => {
    const normalizedHour = selectedTime.hour % 12;
    onChange({ ...selectedTime, hour: nextPeriod === 'PM' ? normalizedHour + 12 : normalizedHour });
  };

  const onTypedBlur = () => {
    const parsed = parseTypedTime(typedTime);
    if (parsed) onChange(parsed);
    else setTypedTime(formatTime(time));
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-lg ${clockSurfaceClass}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-red-800">Time</p>
          <p className={darkMode ? 'mt-1 text-sm font-black text-stone-100' : 'mt-1 text-sm font-black text-zinc-950'}>{formatTime(time)}</p>
        </div>
        <div className={`grid grid-cols-2 rounded-full border p-1 ${darkMode ? 'border-white/10 bg-[#080808]' : 'border-black/10 bg-[#fffaf0]'}`}>
          {(['AM', 'PM'] as const).map((item) => (
            <button key={item} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${period === item ? 'bg-red-800 text-white shadow-lg shadow-red-950/20' : darkMode ? 'text-stone-300 hover:bg-white/10' : 'text-zinc-700 hover:bg-white'}`} onClick={() => commitPeriod(item)} type="button">{item}</button>
          ))}
        </div>
      </div>

      <div className={`mx-auto mt-4 grid size-48 place-items-center rounded-full border ${darkMode ? 'border-white/10 bg-[#080808]/80' : 'border-black/10 bg-[#fffaf0]'}`} aria-label={step === 'hour' ? 'Select hour' : 'Select minutes'} role="group">
        <div className="relative size-40 rounded-full">
          <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-800" />
          {values.map((value, index) => {
            const angle = (index / values.length) * 360 - 90;
            const radius = 66;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            const selected = value === currentValue || (step === 'minute' && selectedTime.minute === value);
            return (
              <button
                key={value}
                className={`absolute grid size-8 place-items-center rounded-full text-xs font-black transition ${selected ? 'bg-red-800 text-white shadow-lg shadow-red-950/20' : darkMode ? 'text-stone-200 hover:bg-white/10' : 'text-zinc-800 hover:bg-white'}`}
                onClick={() => step === 'hour' ? commitHour(value) : commitMinute(value)}
                style={{ left: `calc(50% + ${x}px - 1rem)`, top: `calc(50% + ${y}px - 1rem)` }}
                type="button"
              >
                {step === 'minute' ? pad(value) : value}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className={`rounded-full border px-3 py-2 text-xs font-black ${step === 'hour' ? 'border-red-800 bg-red-950/[0.06] text-red-800' : quietButtonClass}`} onClick={() => setStep('hour')} type="button">Hour</button>
        <button className={`rounded-full border px-3 py-2 text-xs font-black ${step === 'minute' ? 'border-red-800 bg-red-950/[0.06] text-red-800' : quietButtonClass}`} onClick={() => setStep('minute')} type="button">Minutes</button>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-bold">
        Type time directly
        <input
          className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-red-800/25 ${darkMode ? 'border-white/10 bg-[#141414] text-stone-100 placeholder:text-stone-600' : 'border-black/10 bg-[#fffaf0] text-zinc-950 placeholder:text-zinc-400'}`}
          inputMode="text"
          onBlur={onTypedBlur}
          onChange={(event) => setTypedTime(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
          placeholder="8:30 AM"
          value={typedTime}
        />
      </label>

      {selectedDate && !isFutureNairobiDateTime(selectedDate, time) ? <p className="mt-2 text-xs font-bold text-red-700">Choose a future time in Nairobi.</p> : null}
    </div>
  );
};

const QuickSchedule = ({ darkMode, onPick, selectedKey }: { darkMode: boolean; onPick: (option: QuickScheduleOption) => void; selectedKey: string }) => {
  const options = useQuickScheduleOptions();
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-red-800">Quick Schedule</p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {options.map((option) => {
          const Icon = option.icon;
          const selected = selectedKey === option.key;
          return (
            <button key={option.key} className={`min-w-[9rem] rounded-2xl border px-3 py-3 text-left transition ${selected ? 'border-red-800 bg-red-950/[0.06] text-red-800 shadow-sm' : darkMode ? 'border-white/10 bg-white/5 text-stone-200 hover:bg-white/10' : 'border-black/10 bg-white text-zinc-800 hover:bg-[#fffaf0]'}`} onClick={() => onPick(option)} type="button">
              <span className="flex items-center gap-2 text-xs font-black"><Icon size={14} /> {option.label}</span>
              <span className={darkMode ? 'mt-1 block text-xs text-stone-400' : 'mt-1 block text-xs text-zinc-600'}>{option.subtitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TimezoneDisplay = ({ darkMode }: { darkMode: boolean }) => (
  <div className={`rounded-2xl border px-4 py-3 text-xs font-bold ${darkMode ? 'border-white/10 bg-white/5 text-stone-300' : 'border-black/10 bg-white text-zinc-700'}`}>
    Timezone: <span className="text-red-800">Africa/Nairobi (EAT)</span>
  </div>
);

const PublicationSummary = ({ darkMode, selectedDate, selectedTime }: { darkMode: boolean; selectedDate: ScheduleDate | null; selectedTime: ScheduleTime | null }) => {
  const complete = Boolean(selectedDate && selectedTime);
  return (
    <div className={`rounded-2xl border px-4 py-4 ${darkMode ? 'border-white/10 bg-[#080808]/80' : 'border-black/10 bg-white/75'}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-red-800">Scheduled Publication</p>
      {complete && selectedDate && selectedTime ? (
        <div className="mt-2">
          <p className={darkMode ? 'text-sm font-black text-stone-100' : 'text-sm font-black text-zinc-950'}>{formatSummaryWeekday(selectedDate)}</p>
          <p className={darkMode ? 'mt-1 text-sm text-stone-300' : 'mt-1 text-sm text-zinc-700'}>{formatSummaryDate(selectedDate)}</p>
          <p className="mt-1 text-lg font-black text-red-800">{formatTime(selectedTime)}</p>
          <p className={darkMode ? 'mt-1 text-xs font-bold text-stone-400' : 'mt-1 text-xs font-bold text-zinc-600'}>Africa/Nairobi (EAT)</p>
        </div>
      ) : <p className={darkMode ? 'mt-2 text-sm text-stone-400' : 'mt-2 text-sm text-zinc-600'}>Choose a publication date and time.</p>}
    </div>
  );
};

const PublishingScheduler = ({ darkMode, onSchedule, saving, scheduledFor }: { darkMode: boolean; onSchedule: (scheduledFor: string) => Promise<boolean>; saving: boolean; scheduledFor?: string | null }) => {
  const initial = fromIsoToNairobi(scheduledFor);
  const [selectedDate, setSelectedDate] = useState<ScheduleDate | null>(initial.date);
  const [selectedTime, setSelectedTime] = useState<ScheduleTime | null>(initial.time);
  const [activePanel, setActivePanel] = useState<SchedulerPanel>(null);
  const [quickKey, setQuickKey] = useState('');
  const canSubmit = isFutureNairobiDateTime(selectedDate, selectedTime);
  const selectorClass = darkMode
    ? 'border-white/10 bg-[#141414] text-stone-100 hover:bg-white/10'
    : 'border-black/10 bg-white text-zinc-950 hover:bg-[#fffaf0]';

  const pickQuick = (option: QuickScheduleOption) => {
    const next = option.resolve();
    setSelectedDate(next.date);
    setSelectedTime(next.time);
    setActivePanel(null);
    setQuickKey(option.key);
  };

  const submitSchedule = async () => {
    if (!selectedDate || !selectedTime || !canSubmit) return;
    await onSchedule(utcIsoFromNairobi(selectedDate, selectedTime));
  };

  return (
    <div className="space-y-4 motion-safe:animate-[fadeIn_180ms_ease-out]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-red-800">Date and Time</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
          <button
            aria-expanded={activePanel === 'date'}
            className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${selectorClass}`}
            onClick={() => setActivePanel((current) => current === 'date' ? null : 'date')}
            type="button"
          >
            <span className="min-w-0">
              <span className="block text-[0.65rem] font-black uppercase tracking-[0.14em] text-red-800">Date</span>
              <span className="mt-1 block truncate text-sm font-black">{formatFullDate(selectedDate)}</span>
            </span>
            <CalendarDays size={16} className="shrink-0 text-red-800" />
          </button>
          <button
            aria-expanded={activePanel === 'time'}
            className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${selectorClass}`}
            onClick={() => setActivePanel((current) => current === 'time' ? null : 'time')}
            type="button"
          >
            <span className="min-w-0">
              <span className="block text-[0.65rem] font-black uppercase tracking-[0.14em] text-red-800">Time</span>
              <span className="mt-1 block truncate text-sm font-black">{formatTime(selectedTime)}</span>
            </span>
            <Clock3 size={16} className="shrink-0 text-red-800" />
          </button>
        </div>
      </div>

      {activePanel === 'date' ? (
        <PublishingCalendar darkMode={darkMode} onSelect={(date) => { setSelectedDate(date); setQuickKey(''); }} selectedDate={selectedDate} />
      ) : null}

      {activePanel === 'time' ? (
        <PublishingClock darkMode={darkMode} onChange={(time) => { setSelectedTime(time); setQuickKey(''); }} selectedDate={selectedDate} time={selectedTime} />
      ) : null}

      <QuickSchedule darkMode={darkMode} onPick={pickQuick} selectedKey={quickKey} />
      <PublicationSummary darkMode={darkMode} selectedDate={selectedDate} selectedTime={selectedTime} />
      <TimezoneDisplay darkMode={darkMode} />
      <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" disabled={saving || !canSubmit} onClick={() => void submitSchedule()} type="button">
        <CalendarClock size={16} /> Schedule Publication
      </button>
      {selectedDate && selectedTime && !canSubmit ? <p className="text-xs font-bold text-red-700">Scheduled publication must be in the future according to Africa/Nairobi (EAT).</p> : null}
    </div>
  );
};


export type WritingPublishingPanelProps = {
  canPublish: boolean;
  canSchedule: boolean;
  darkMode: boolean;
  onClose?: () => void;
  onPublish: () => Promise<boolean>;
  onSchedule: (scheduledFor: string) => Promise<boolean>;
  saving: boolean;
  scheduledFor?: string | null;
};

export const WritingPublishingPanel = ({
  canPublish,
  canSchedule,
  darkMode,
  onClose,
  onPublish,
  onSchedule,
  saving,
  scheduledFor,
}: WritingPublishingPanelProps) => {
  const [publicationTab, setPublicationTab] = useState<PublicationTab>(canPublish ? 'publish' : 'schedule');
  const mutedTextClass = darkMode ? 'text-stone-400' : 'text-zinc-600';
  const cardClass = darkMode
    ? 'border-white/10 bg-white/[0.04] text-stone-100'
    : 'border-red-900/10 bg-[#fffaf0] text-zinc-950';

  useEffect(() => {
    if (publicationTab === 'publish' && !canPublish && canSchedule) setPublicationTab('schedule');
    if (publicationTab === 'schedule' && !canSchedule && canPublish) setPublicationTab('publish');
  }, [canPublish, canSchedule, publicationTab]);

  const hasPublicationActions = canPublish || canSchedule;

  return (
    <aside aria-label="Publishing panel" className={`rounded-[1.6rem] border p-4 shadow-xl ${darkMode ? 'border-white/10 bg-[#111111] shadow-black/30' : 'border-black/10 bg-[#fffaf0] shadow-zinc-900/10'}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-800">Publishing</p>
          <p className={`mt-2 text-sm leading-6 ${mutedTextClass}`}>Choose when this article should become public.</p>
        </div>
        {onClose ? <button className={darkMode ? 'grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-stone-100 hover:bg-white/10' : 'grid size-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-zinc-800 hover:bg-red-950/[0.04]'} onClick={onClose} type="button"><X size={16} /></button> : null}
      </div>

      {hasPublicationActions ? (
        <div className={`rounded-[1.35rem] border p-3 ${cardClass}`}>
          <PublishingModeToggle canPublish={canPublish} canSchedule={canSchedule} darkMode={darkMode} mode={publicationTab} onModeChange={setPublicationTab} />

          {publicationTab === 'publish' && canPublish ? (
            <div className="px-1 pt-4 motion-safe:animate-[fadeIn_180ms_ease-out]" role="tabpanel">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-red-800 text-white shadow-lg shadow-red-950/20"><Rocket size={17} /></span>
                <div>
                  <p className="text-sm font-black">Publish immediately</p>
                  <p className={`mt-1 text-xs leading-5 ${mutedTextClass}`}>This article will become publicly visible as soon as you publish it.</p>
                </div>
              </div>
              <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0" disabled={saving} onClick={() => void onPublish()} type="button">
                <Rocket size={16} /> Publish Article
              </button>
            </div>
          ) : null}

          {publicationTab === 'schedule' && canSchedule ? (
            <div className="px-1 pt-4" role="tabpanel">
              <PublishingScheduler darkMode={darkMode} onSchedule={onSchedule} saving={saving} scheduledFor={scheduledFor} />
            </div>
          ) : null}
        </div>
      ) : <p className={`text-sm leading-6 ${mutedTextClass}`}>Publishing actions are not available for this article.</p>}
    </aside>
  );
};

const WritingWorkflowControls = ({
  canReturnToDraft,
  canSubmitForReview,
  canUnschedule,
  darkMode,
  onReturnToDraft,
  onSubmitForReview,
  onUnschedule,
  saving,
  scheduledFor,
  status,
  workflowNotes = [],
}: WritingWorkflowControlsProps) => {
  const [note, setNote] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const fieldClass = darkMode
    ? 'border-white/10 bg-[#141414] text-stone-100 placeholder:text-stone-600'
    : 'border-black/10 bg-[#fffaf0] text-zinc-950 placeholder:text-zinc-400';
  const cardClass = darkMode
    ? 'border-white/10 bg-white/[0.04] text-stone-100'
    : 'border-red-900/10 bg-[#fffaf0] text-zinc-950';
  const mutedTextClass = darkMode ? 'text-stone-400' : 'text-zinc-600';
  const dangerButtonClass = darkMode
    ? 'border border-red-700/30 bg-red-950/10 text-red-300 hover:bg-red-950/20'
    : 'border border-red-900/20 bg-white text-red-800 hover:bg-red-950/5';
  const hasActions = canSubmitForReview || canReturnToDraft || canUnschedule;

  const submitForReview = async () => {
    if (await onSubmitForReview(note.trim())) setNote('');
  };

  const returnToDraft = async () => {
    if (await onReturnToDraft(note.trim())) setNote('');
  };

  return (
    <div>
      {hasActions ? (
        <div className="grid gap-4">
          {(canSubmitForReview || canReturnToDraft) ? (
            <label className="grid gap-2 text-sm font-bold">
              Editorial note <span className={`font-normal ${mutedTextClass}`}>(optional)</span>
              <textarea className={`min-h-24 w-full resize-y rounded-2xl border px-4 py-3 text-sm leading-6 outline-none transition focus:ring-2 focus:ring-red-800/25 ${fieldClass}`} disabled={saving} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Add a short note for the editorial trail." value={note} />
            </label>
          ) : null}

          {canSubmitForReview ? (
            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-red-800 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} onClick={() => void submitForReview()} type="button">
              <Send size={16} /> Submit for review
            </button>
          ) : null}

          {canReturnToDraft ? (
            <button className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${dangerButtonClass}`} disabled={saving} onClick={() => void returnToDraft()} type="button">
              <RotateCcw size={16} /> Return to draft
            </button>
          ) : null}

          {canUnschedule ? (
            <button className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${dangerButtonClass}`} disabled={saving} onClick={() => void onUnschedule()} type="button">
              <X size={16} /> Cancel scheduling
            </button>
          ) : null}
        </div>
      ) : <p className={`text-sm leading-6 ${mutedTextClass}`}>No editorial actions are available for this article right now.</p>}

      {status === 'SCHEDULED' && scheduledFor ? (
        <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${cardClass}`}>Scheduled for <span className="font-black">{new Date(scheduledFor).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: NAIROBI_TIME_ZONE })}</span> Africa/Nairobi (EAT).</p>
      ) : null}

      {workflowNotes.length ? (
        <div className={`mt-5 border-t pt-5 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <button aria-expanded={notesOpen} className="flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-2 text-left transition hover:bg-red-950/[0.025]" onClick={() => setNotesOpen((current) => !current)} type="button">
            <span><span className="block text-xs font-black uppercase tracking-[0.16em] text-red-800">Workflow Notes</span><span className={`mt-1 block text-xs ${mutedTextClass}`}>{workflowNotes.length} editorial {workflowNotes.length === 1 ? 'entry' : 'entries'}</span></span>
            <ChevronDown className={`size-4 transition ${notesOpen ? 'rotate-180' : ''}`} />
          </button>
          {notesOpen ? (
            <div className="mt-3 grid gap-3">
              {workflowNotes.map((item) => (
                <div key={item.id} className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${cardClass}`}>
                  <p className={darkMode ? 'font-black text-stone-200' : 'font-black text-zinc-900'}>{item.action_display}</p>
                  {item.note ? <p className={mutedTextClass}>{item.note}</p> : null}
                  <p className={`mt-1 text-xs ${mutedTextClass}`}>{item.created_by_name} <span aria-hidden="true">&middot;</span> {new Date(item.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: NAIROBI_TIME_ZONE })}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default WritingWorkflowControls;





