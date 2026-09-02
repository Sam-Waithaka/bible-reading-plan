import { UserCircle } from 'lucide-react';

import SiteFooter from '../components/navigation/SiteFooter';
import SiteHeader from '../components/navigation/SiteHeader';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

const AccountPage = ({ profile = false }: { profile?: boolean }) => {
  const auth = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const name = auth.user?.profile?.displayName
    || [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(' ')
    || auth.user?.username
    || 'Your account';

  return (
    <div className={`flex min-h-screen flex-col overflow-x-clip ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader darkMode={darkMode} onToggleTheme={toggleTheme} />
      <main className="flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className={`border-b pb-8 ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
            <span className={`grid size-12 place-items-center rounded-2xl border ${darkMode ? 'border-white/10 bg-white/[0.05] text-red-200' : 'border-red-900/10 bg-white text-red-800'}`}><UserCircle size={22} /></span>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-red-800 dark:text-red-200">{profile ? 'Church profile' : 'Account'}</p>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">{profile ? name : 'My Account'}</h1>
            <p className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg ${darkMode ? 'text-stone-300' : 'text-zinc-700'}`}>
              {profile
                ? 'Your church profile will bring together your ministry relationship, contact details, and participation across A.I.C Njoro Town.'
                : 'Account preferences, contact details, security, and connected church services will be managed here.'}
            </p>
          </div>
        </div>
      </main>
      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default AccountPage;
