import SiteNavigation from './SiteNavigation';
type SiteSideNavProps = {
  darkMode: boolean;
  onToggleTheme: () => void;
};

const SiteSideNav = ({ darkMode, onToggleTheme }: SiteSideNavProps) => (
  <SiteNavigation
    darkMode={darkMode}
    layout="side"
    onToggleTheme={onToggleTheme}
  />
);

export default SiteSideNav;
