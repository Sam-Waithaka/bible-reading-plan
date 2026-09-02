import type { ReactNode } from 'react';
import PageContainer from '../layout/PageContainer';

type ResourcesContainerProps = {
  children: ReactNode;
  className?: string;
};

const ResourcesContainer = ({ children, className = '' }: ResourcesContainerProps) => (
  <PageContainer className={className}>{children}</PageContainer>
);

export default ResourcesContainer;
