import { useEffect, useMemo, useRef, useState } from 'react';
import Project52Hero from '../components/project52/Project52Hero';
import Project52ProgressCard from '../components/project52/Project52ProgressCard';
import ReadingPlanSection from '../components/project52/ReadingPlanSection';
import SiteFooter from '../components/navigation/SiteFooter';
import SiteHeader from '../components/navigation/SiteHeader';
import SiteSideNav from '../components/navigation/SiteSideNav';
import { useTheme } from '../hooks/useTheme';
import type { TestamentFilter } from '../types/project52';
import { createProject52Pdf } from '../utils/project52Pdf';
import { useProject52 } from '../contexts/Project52Context';
import { formatReadingBlock } from '../utils/project52Schedule';

const Project52Page = () => {
  const [status, setStatus] = useState('');
  const { darkMode, toggleTheme } = useTheme();
  const { readingTarget, currentWeek, weeks, activeCatchphrase } = useProject52();

  const [activeWeek, setActiveWeek] = useState(() => currentWeek);
  const [activeFilter, setActiveFilter] = useState<TestamentFilter>('both');
  const [searchTerm, setSearchTerm] = useState('');
  const currentWeekRef = useRef<HTMLElement | null>(null);

  const filteredWeeks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return weeks
      .map((week) => {
        const items = week.items.filter((item) => {
          const matchesSearch = !query || item.searchable.includes(query);
          const matchesFilter =
            activeFilter === 'both' ||
            (activeFilter === 'old' && item.oldTestament.length > 0) ||
            (activeFilter === 'new' && item.newTestament.length > 0);

          return matchesSearch && matchesFilter;
        });

        return { ...week, items };
      })
      .filter((week) => week.items.length > 0);
  }, [activeFilter, searchTerm, weeks]);

  const yearProgress = Math.round((currentWeek / 52) * 100);

  const scrollToCurrentWeek = (delay = 50) => {
    window.setTimeout(() => {
      currentWeekRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      currentWeekRef.current?.focus({ preventScroll: true });
    }, delay);
  };

  useEffect(() => {
    setActiveWeek(currentWeek);
  }, [currentWeek]);

  useEffect(() => {
    scrollToCurrentWeek(450);
  }, [currentWeek]);

  const jumpToCurrentWeek = () => {
    setActiveWeek(currentWeek);
    scrollToCurrentWeek();
  };

  const changeFilter = (filter: TestamentFilter) => {
    setActiveFilter(filter);
    setActiveWeek(currentWeek);
    scrollToCurrentWeek();
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    const query = value.trim().toLowerCase();
    if (!query) {
      setActiveFilter('both');
      return;
    }

    const hasOldTestamentMatch = weeks.some((week) =>
      week.items.some((item) => formatReadingBlock(item.oldTestament).toLowerCase().includes(query)),
    );
    const hasNewTestamentMatch = weeks.some((week) =>
      week.items.some((item) => formatReadingBlock(item.newTestament).toLowerCase().includes(query)),
    );

    if (hasOldTestamentMatch && !hasNewTestamentMatch) {
      setActiveFilter('old');
      return;
    }

    if (hasNewTestamentMatch && !hasOldTestamentMatch) {
      setActiveFilter('new');
      return;
    }

    setActiveFilter('both');
  };

  const generatePdf = async () => {
    setStatus('Creating Project 52 PDF...');

    try {
      const blob = await createProject52Pdf(activeCatchphrase);
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', 'AIC-Njoro-Town-Project-52-Bible-Reading-Plan.pdf');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('Project 52 PDF downloaded successfully.');
      window.setTimeout(() => setStatus(''), 4000);
    } catch (error) {
      setStatus('Error creating PDF. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className={`h-screen overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <div className="flex h-screen overflow-hidden">
        <SiteSideNav darkMode={darkMode} onToggleTheme={toggleTheme} />

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="lg:hidden">
            <SiteHeader darkMode={darkMode} onToggleTheme={toggleTheme} />
          </div>

          <main className="flex-1">
            <section className="relative px-4 pb-10 pt-8 sm:px-6 sm:pb-14 lg:pt-12">
              <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className={`h-full ${darkMode ? 'bg-[radial-gradient(circle_at_top_left,rgba(185,28,28,0.30),transparent_34%),linear-gradient(135deg,#080808,#171717_55%,#260b0b)]' : 'bg-[radial-gradient(circle_at_top_left,rgba(153,27,27,0.16),transparent_35%),linear-gradient(135deg,#fffaf0,#f8f5ef_50%,#ece7de)]'}`} />
              </div>

              <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                <Project52Hero
                  darkMode={darkMode}
                  status={status}
                  onJumpToCurrentWeek={jumpToCurrentWeek}
                  onDownloadPdf={generatePdf}
                />
                <Project52ProgressCard
                  currentWeek={currentWeek}
                  darkMode={darkMode}
                  readingTarget={readingTarget}
                  yearProgress={yearProgress}
                />
              </div>
            </section>

            <ReadingPlanSection
              activeFilter={activeFilter}
              activeWeek={activeWeek}
              currentWeekRef={currentWeekRef}
              darkMode={darkMode}
              filteredWeeks={filteredWeeks}
              readingTarget={readingTarget}
              searchTerm={searchTerm}
              onChangeFilter={changeFilter}
              onSearchChange={handleSearchChange}
              onToggleWeek={setActiveWeek}
            />
          </main>

          <SiteFooter darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
};

export default Project52Page;
