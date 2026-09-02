import type { ElementType, ReactNode } from 'react';
import { siteContainerClass } from '../../constants/responsive';

type PageContainerProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

const PageContainer = ({ as: Component = 'div', children, className = '' }: PageContainerProps) => (
  <Component className={`${siteContainerClass} ${className}`}>{children}</Component>
);

export default PageContainer;
