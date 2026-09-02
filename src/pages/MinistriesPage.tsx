import MinistriesIntro from '../components/ministries/MinistriesIntro';
import SiteFooter from '../components/navigation/SiteFooter';
import SiteHeader from '../components/navigation/SiteHeader';
import { useTheme } from '../hooks/useTheme';

const MinistriesPage = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader activePath="/ministries" darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main className="flex-1">
        <MinistriesIntro darkMode={darkMode} />
      </main>

      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default MinistriesPage;
