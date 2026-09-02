import SiteNavigation from './SiteNavigation';
import type { SiteNavPath } from './SiteNavigation';

type SiteSideNavProps = {
  activePath: Extract<SiteNavPath, '/scripture' | '/project52'>;
  darkMode: boolean;
  onToggleTheme: () => void;
};

const SiteSideNav = ({ activePath, darkMode, onToggleTheme }: SiteSideNavProps) => (
  <SiteNavigation
    activePath={activePath}
    darkMode={darkMode}
    layout="side"
    onToggleTheme={onToggleTheme}
  />
);

export default SiteSideNav;
