import { useEffect, useState } from 'react';

const footerObserverRootMargin = '0px 0px 88px 0px';

export const useNearSiteFooter = () => {
  const [nearFooter, setNearFooter] = useState(false);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>('[data-site-footer="true"], footer');
    if (!footer || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setNearFooter(entry.isIntersecting),
      { rootMargin: footerObserverRootMargin },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return nearFooter;
};
