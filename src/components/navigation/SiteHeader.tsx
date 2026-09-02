import SiteNavigation from './SiteNavigation';
type SiteHeaderProps = {
  compact?: boolean;
  darkMode: boolean;
  onToggleTheme: () => void;
  sticky?: boolean;
};

const SiteHeader = ({
  compact,
  darkMode,
  onToggleTheme,
  sticky = true,
}: SiteHeaderProps) => (
  <SiteNavigation
    compact={compact}
    darkMode={darkMode}
    layout="top"
    onToggleTheme={onToggleTheme}
    sticky={sticky}
  />
);

export default SiteHeader;
