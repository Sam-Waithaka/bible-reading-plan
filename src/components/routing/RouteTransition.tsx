import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

type RouteTransitionProps = {
  children: ReactNode;
};

const RouteTransition = ({ children }: RouteTransitionProps) => {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-transition">
      {children}
    </div>
  );
};

export default RouteTransition;
