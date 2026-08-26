import type { ReactNode } from 'react';

type ResourcesContainerProps = {
  children: ReactNode;
  className?: string;
};

const ResourcesContainer = ({ children, className = '' }: ResourcesContainerProps) => (
  <div className={`mx-auto w-full max-w-[95rem] px-4 sm:px-6 lg:px-8 2xl:px-12 ${className}`}>
    {children}
  </div>
);

export default ResourcesContainer;
