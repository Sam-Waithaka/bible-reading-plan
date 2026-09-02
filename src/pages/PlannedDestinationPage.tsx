import type { LucideIcon } from 'lucide-react';

import SiteFooter from '../components/navigation/SiteFooter';
import SiteHeader from '../components/navigation/SiteHeader';
import { useTheme } from '../hooks/useTheme';

type PlannedDestinationPageProps = {
  description: string;
  eyebrow: string;
  icon: LucideIcon;
  title: string;
};

const PlannedDestinationPage = ({ description, eyebrow, icon: Icon, title }: PlannedDestinationPageProps) => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader darkMode={darkMode} onToggleTheme={toggleTheme} />
      <main className="flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className={`border-b pb-8 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
            <span className={`grid size-12 place-items-center rounded-2xl border ${darkMode ? 'border-white/10 bg-white/[0.05] text-red-200' : 'border-red-900/10 bg-white text-red-800'}`}>
              <Icon size={21} aria-hidden="true" />
            </span>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-red-800 dark:text-red-200">{eyebrow}</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal sm:text-5xl">{title}</h1>
            <p className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg ${darkMode ? 'text-stone-300' : 'text-zinc-700'}`}>{description}</p>
          </div>
        </div>
      </main>
      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default PlannedDestinationPage;
