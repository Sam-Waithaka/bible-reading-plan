import { LockKeyhole } from 'lucide-react';
import SiteFooter from '../../navigation/SiteFooter';
import SiteHeader from '../../navigation/SiteHeader';
import { useTheme } from '../../../hooks/useTheme';
import { portalSurface } from '../portalSurface';

const WritingAccessDenied = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className={`flex min-h-screen flex-col ${portalSurface.page(darkMode)}`}>
      <SiteHeader darkMode={darkMode} onToggleTheme={toggleTheme} />
      <main className="grid flex-1 place-items-center px-4 py-16">
        <section className={`max-w-xl rounded-3xl border p-8 text-center shadow-xl ${portalSurface.card(darkMode)}`}>
          <span className={`mx-auto grid size-14 place-items-center rounded-2xl ${portalSurface.iconBadge(darkMode)}`}>
            <LockKeyhole size={24} />
          </span>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-red-800">Writing Studio</p>
          <h1 className="mt-3 font-serif text-4xl">Access Needed</h1>
          <p className={`mt-4 leading-7 ${portalSurface.softMutedText(darkMode)}`}>
            This space is reserved for writers, editors, and publishers working on Library resources.
          </p>
        </section>
      </main>
      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default WritingAccessDenied;
