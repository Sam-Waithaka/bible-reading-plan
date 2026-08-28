import DailyVerseSection from '../components/landing/DailyVerseSection';
import LandingHero from '../components/landing/LandingHero';
import HomeResourcesHighlight from '../components/landing/HomeResourcesHighlight';
import LandingMediaHighlight from '../components/landing/LandingMediaHighlight';
import Project52LandingSection from '../components/landing/Project52LandingSection';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { useTheme } from '../hooks/useTheme';

const LandingPage = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader activePath="/" darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main className="flex-1">
        <LandingHero darkMode={darkMode} />
        <DailyVerseSection darkMode={darkMode} />
        <Project52LandingSection darkMode={darkMode} />
        <HomeResourcesHighlight darkMode={darkMode} />
        <LandingMediaHighlight darkMode={darkMode} />
      </main>

      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default LandingPage;
