import { ScriptureIcon } from '../../constants/siteIcons';
import { ArrowRight, Check } from 'lucide-react';

import { Link } from 'react-router-dom';
import Project52ProgressBar from '../project52/Project52ProgressBar';
import { useProject52 } from '../../contexts/Project52Context';
import { formatReadingBlock, readingDays } from '../../utils/project52Schedule';
import type { ReadingItem } from '../../types/project52';
import LandingSection from './LandingSection';
import { project52Preview } from './landingContent';

type Project52LandingSectionProps = {
  darkMode: boolean;
};

type DayState = 'complete' | 'active' | 'upcoming';

type DayIndicatorProps = {
  darkMode: boolean;
  label: string;
  state: DayState;
};

const cardClass = (darkMode: boolean) =>
  `rounded-3xl border p-6 shadow-2xl sm:p-8 ${
    darkMode
      ? 'border-white/10 bg-zinc-950 shadow-black/40'
      : 'border-black/10 bg-white shadow-zinc-900/10'
  }`;

const textClass = (darkMode: boolean, darkValue: string, lightValue: string) => (darkMode ? darkValue : lightValue);

const DayIndicator = ({ darkMode, label, state }: DayIndicatorProps) => {
  const isComplete = state === 'complete';
  const isActive = state === 'active';

  return (
    <li className="flex flex-col items-center gap-2">
      <span
        className={`inline-flex size-10 items-center justify-center rounded-full border text-xs font-black ${
          isActive
            ? 'border-red-700 bg-red-800 text-white shadow-lg shadow-red-950/20'
            : isComplete
              ? textClass(darkMode, 'border-red-700/60 text-red-200', 'border-red-800/60 text-red-800')
              : textClass(darkMode, 'border-white/15 text-stone-400', 'border-black/15 text-zinc-500')
        }`}
        aria-label={`${label}: ${state}`}
      >
        {isComplete ? <Check size={16} aria-hidden="true" /> : label.slice(0, 1)}
      </span>
      <span className={`text-[0.68rem] font-bold uppercase ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>{label}</span>
    </li>
  );
};

const getDayState = (dayIndex: number, activeDayIndex: number): DayState => {
  if (dayIndex < activeDayIndex) return 'complete';
  if (dayIndex === activeDayIndex) return 'active';
  return 'upcoming';
};

const ReadingEndpoint = ({
  darkMode,
  item,
}: {
  darkMode: boolean;
  item?: ReadingItem;
}) => {
  const oldTestamentReading = item ? formatReadingBlock(item.oldTestament) : '';
  const newTestamentReading = item ? formatReadingBlock(item.newTestament) : '';

  return (
    <div className="w-full max-w-44 justify-self-start">
      <p className={`text-sm ${darkMode ? 'text-stone-300' : 'text-zinc-700'}`}>
        OT: {oldTestamentReading || 'No Old Testament reading'}
      </p>
      <p className={`mt-1 text-sm font-bold ${darkMode ? 'text-stone-100' : 'text-zinc-950'}`}>
        NT: {newTestamentReading || 'No New Testament reading'}
      </p>
    </div>
  );
};

const WeeklyReadingRange = ({
  darkMode,
  fridayReading,
  mondayReading,
}: {
  darkMode: boolean;
  fridayReading?: ReadingItem;
  mondayReading?: ReadingItem;
}) => {
  return (
    <div
      className={`rounded-3xl border p-5 ${
        darkMode
          ? 'border-white/10 bg-white/[0.03]'
          : 'border-black/10 bg-white/70'
      }`}
    >
      <div className="grid gap-5 sm:grid-cols-[minmax(10rem,1fr)_4rem_minmax(10rem,1fr)] sm:items-center">
        <ReadingEndpoint darkMode={darkMode} item={mondayReading} />
        <div
          className={`hidden h-px w-12 justify-self-center self-center sm:block ${darkMode ? 'bg-white/20' : 'bg-black/20'}`}
          aria-hidden="true"
        />
        <div className={`flex items-center gap-3 sm:hidden ${darkMode ? 'text-stone-500' : 'text-zinc-500'}`} aria-hidden="true">
          <span className={`h-px flex-1 ${darkMode ? 'bg-white/20' : 'bg-black/20'}`} />
          <span className="text-xs font-black uppercase tracking-[0.16em]">to</span>
          <span className={`h-px flex-1 ${darkMode ? 'bg-white/20' : 'bg-black/20'}`} />
        </div>
        <ReadingEndpoint darkMode={darkMode} item={fridayReading} />
      </div>
    </div>
  );
};

const Project52LandingSection = ({ darkMode }: Project52LandingSectionProps) => {
  const { currentWeek, readingTarget, weeks } = useProject52();
  const activeWeek = weeks.find((week) => week.week === currentWeek) || weeks[0];
  const weeklyReadings = activeWeek?.items || [];
  const mondayReading = weeklyReadings[0];
  const fridayReading = weeklyReadings[4];

  return (
    <LandingSection
      id="project-52"
      className={darkMode ? 'bg-[#050505]' : 'bg-[#ece7de]'}
    >
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.24em] ${darkMode ? 'text-red-200' : 'text-red-900'}`}>
            {project52Preview.eyebrow}
          </p>
          <h2 className={`mt-4 max-w-xl text-4xl font-extrabold leading-tight sm:text-5xl ${darkMode ? 'text-stone-100' : 'text-zinc-950'}`}>
            {project52Preview.heading}
          </h2>
          <p className={`mt-6 max-w-xl text-base leading-7 ${darkMode ? 'text-stone-300' : 'text-zinc-700'}`}>
            {project52Preview.description}
          </p>
          <Link
            to="/project52"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-red-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 dark:focus:ring-offset-black"
          >
            {project52Preview.ctaLabel}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <article className={cardClass(darkMode)} aria-labelledby="project52-preview-title">
          <Project52ProgressBar currentWeek={currentWeek} darkMode={darkMode} />

          <div className="mt-8 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <h3 id="project52-preview-title" className={`text-xs font-black uppercase tracking-[0.16em] ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>
                {project52Preview.readingLabel}
              </h3>
            </div>
            <div className={`hidden size-16 items-center justify-center rounded-full border sm:inline-flex ${darkMode ? 'border-red-400/30 bg-red-950/60 text-red-100' : 'border-red-900/15 bg-red-50 text-red-800'}`}>
              <ScriptureIcon size={28} aria-hidden="true" />
            </div>
          </div>

          <div className="mt-5" aria-label="This week's Project 52 reading range">
            <WeeklyReadingRange darkMode={darkMode} fridayReading={fridayReading} mondayReading={mondayReading} />
          </div>

          <div className={`mt-8 border-t pt-6 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
            <ul className="grid grid-cols-5 gap-2" aria-label="Weekly reading day progress">
              {readingDays.map((day, dayIndex) => (
                <DayIndicator
                  key={day}
                  darkMode={darkMode}
                  label={day.slice(0, 3)}
                  state={getDayState(dayIndex, readingTarget.dayIndex)}
                />
              ))}
            </ul>
            <p className={`mt-4 text-xs ${darkMode ? 'text-stone-400' : 'text-zinc-600'}`}>
              {readingTarget.isWeekendCarryover ? 'Weekend catch-up keeps Friday active.' : `${readingTarget.day} is the active reading.`}
            </p>
          </div>
        </article>
      </div>
    </LandingSection>
  );
};

export default Project52LandingSection;
