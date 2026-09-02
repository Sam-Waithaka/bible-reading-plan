import SiteNavigation from './SiteNavigation';
import type { SiteNavPath } from './SiteNavigation';

type SiteHeaderProps = {
  activePath?: SiteNavPath;
  compact?: boolean;
  darkMode: boolean;
  onToggleTheme: () => void;
  sticky?: boolean;
};

const SiteHeader = ({
  activePath,
  compact,
  darkMode,
  onToggleTheme,
  sticky = true,
}: SiteHeaderProps) => (
  <SiteNavigation
    activePath={activePath}
    compact={compact}
    darkMode={darkMode}
    layout="top"
    onToggleTheme={onToggleTheme}
    sticky={sticky}
  />
);

export default SiteHeader;
