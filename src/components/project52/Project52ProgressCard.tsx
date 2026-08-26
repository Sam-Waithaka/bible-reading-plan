import { Project52Icon } from '../../constants/siteIcons';
import { CheckCircle2 } from 'lucide-react';

import type { ReadingTarget } from '../../types/project52';
import Project52ProgressBar from './Project52ProgressBar';

type Project52ProgressCardProps = {
  currentWeek: number;
  darkMode: boolean;
  readingTarget: ReadingTarget;
  yearProgress: number;
};

const Project52ProgressCard = ({
  currentWeek,
  darkMode,
  readingTarget,
  yearProgress,
}: Project52ProgressCardProps) => (
  <aside
    className={`rounded-[2rem] border p-5 shadow-2xl sm:p-6 ${darkMode ? 'border-white/10 bg-zinc-950/70 shadow-black/40' : 'border-white bg-white/85 shadow-zinc-900/10'
      }`}
    aria-label="Reading plan progress"
  >
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className={`text-sm font-bold uppercase tracking-[0.16em] ${darkMode ? 'text-red-200' : 'text-red-900'}`}>
          Active Bible tool
        </p>
        <h2 className="mt-2 text-2xl font-black">52-Week Reading Plan</h2>
      </div>
      <Project52Icon className={darkMode ? 'text-red-200' : 'text-red-800'} size={34} />
    </div>
    <Project52ProgressBar currentWeek={currentWeek} darkMode={darkMode} yearProgress={yearProgress} className="mt-6" />
    <div className={`mt-6 grid gap-3 text-sm ${darkMode ? 'text-stone-300' : 'text-zinc-600'}`}>
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className={darkMode ? 'text-red-200' : 'text-red-800'} />5 readings each week
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className={darkMode ? 'text-red-200' : 'text-red-800'} />
        Old and New Testament side by side
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className={darkMode ? 'text-red-200' : 'text-red-800'} />
        Current reading opens automatically
      </div>
      <div className="flex items-center gap-2">
        <CheckCircle2 size={18} className={darkMode ? 'text-red-200' : 'text-red-800'} />
        {readingTarget.isWeekendCarryover ? 'Weekend catches up the current week' : `${readingTarget.day} is highlighted`}
      </div>
    </div>
  </aside>
);

export default Project52ProgressCard;
