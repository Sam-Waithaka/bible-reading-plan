import ContactIntro from '../components/contact/ContactIntro';
import SiteFooter from '../components/navigation/SiteFooter';
import SiteHeader from '../components/navigation/SiteHeader';
import { useTheme } from '../hooks/useTheme';

const ContactPage = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader activePath="/contact" darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main className="flex-1">
        <ContactIntro darkMode={darkMode} />
      </main>

      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default ContactPage;
