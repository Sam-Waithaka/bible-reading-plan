import { useEffect, useState } from 'react';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import ResourcesLanding from '../components/resources/ResourcesLanding';
import { useTheme } from '../hooks/useTheme';
import { fetchResourcesHome, fetchResourcesNavigation } from '../services/resourcesApi';
import type { ResourcesHome, ResourcesNavigation } from '../types/writing';

const ResourcesPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [home, setHome] = useState<ResourcesHome | null>(null);
  const [navigation, setNavigation] = useState<ResourcesNavigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      fetchResourcesHome(controller.signal),
      fetchResourcesNavigation({}, controller.signal),
    ])
      .then(([homePayload, navigationPayload]) => {
        setHome(homePayload);
        setNavigation(navigationPayload);
      })
      .catch((err) => {
        if (controller.signal.aborted || err instanceof DOMException && err.name === 'AbortError') return;
        setHome(null);
        setNavigation(null);
        setError('Unable to load the resources library right now. Please try again shortly.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className={`flex min-h-screen box-border w-full max-w-full min-w-0 flex-col transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader activePath="/resources" darkMode={darkMode} onToggleTheme={toggleTheme} />

      <ResourcesLanding darkMode={darkMode} error={error} home={home} loading={loading} navigation={navigation} />

      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default ResourcesPage;
