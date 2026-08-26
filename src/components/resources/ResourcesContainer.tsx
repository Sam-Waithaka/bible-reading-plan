import type { ReactNode } from 'react';

type ResourcesContainerProps = {
  children: ReactNode;
  className?: string;
};

const ResourcesContainer = ({ children, className = '' }: ResourcesContainerProps) => (
  <div className={`mx-auto box-border w-full max-w-[1440px] min-w-0 px-4 sm:px-6 lg:px-8 xl:px-12 ${className}`}>
    {children}
  </div>
);

export default ResourcesContainer;
