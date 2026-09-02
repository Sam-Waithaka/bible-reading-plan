import { useEffect, useState } from 'react';
import SiteFooter from '../components/navigation/SiteFooter';
import SiteHeader from '../components/navigation/SiteHeader';
import ResourcesLanding from '../components/resources/ResourcesLanding';
import { useTheme } from '../hooks/useTheme';
import { fetchResourcesHome, fetchResourcesNavigation } from '../services/resourcesApi';
import type { ResourcesHome, ResourcesNavigation } from '../types/writing';

const ResourcesPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [home, setHome] = useState<ResourcesHome | null>(null);
  const [navigation, setNavigation] = useState<ResourcesNavigation | null>(null);
  const [homeLoading, setHomeLoading] = useState(true);
  const [navigationLoading, setNavigationLoading] = useState(true);
  const [homeError, setHomeError] = useState('');
  const [navigationError, setNavigationError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchResourcesHome(controller.signal)
      .then((homePayload) => {
        if (!controller.signal.aborted) setHome(homePayload);
      })
      .catch((err) => {
        if (controller.signal.aborted || err instanceof DOMException && err.name === 'AbortError') return;
        setHome(null);
        setHomeError('Unable to load the resources library right now. Please try again shortly.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setHomeLoading(false);
      });

    fetchResourcesNavigation({}, controller.signal)
      .then((navigationPayload) => {
        if (!controller.signal.aborted) setNavigation(navigationPayload);
      })
      .catch((err) => {
        if (controller.signal.aborted || err instanceof DOMException && err.name === 'AbortError') return;
        setNavigation(null);
        setNavigationError('Some library browsing options could not be loaded right now.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setNavigationLoading(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className={`flex min-h-screen box-border w-full max-w-full min-w-0 flex-col transition-colors duration-500 ${darkMode ? 'bg-[#080808] text-stone-100' : 'bg-[#f8f5ef] text-zinc-950'}`}>
      <SiteHeader activePath="/resources" darkMode={darkMode} onToggleTheme={toggleTheme} />

      <ResourcesLanding
        darkMode={darkMode}
        error={[homeError, navigationLoading ? '' : navigationError].filter(Boolean).join(' ')}
        home={home}
        loading={homeLoading}
        navigation={navigation}
      />

      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default ResourcesPage;
