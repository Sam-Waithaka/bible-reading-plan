import { Facebook, Instagram, Youtube } from 'lucide-react';
import { assetPaths } from '../constants/assets';

type SiteFooterProps = {
  darkMode: boolean;
};

const SiteFooter = ({ darkMode }: SiteFooterProps) => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/aicnjorotownchurch',
      icon: <Instagram size={17} />,
    },
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/@aicnjorotownchurch_',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[17px] fill-current">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.77h-3.4v13.67a2.9 2.9 0 1 1-2-2.76V9.39a6.32 6.32 0 1 0 5.43 6.25V8.7a8.16 8.16 0 0 0 4.77 1.52V6.69h-1.03Z" />
        </svg>
      ),
    },
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/AICNjoro/',
      icon: <Facebook size={17} />,
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/@aicnjorotownchurch',
      icon: <Youtube size={17} />,
    },
    {
      label: 'Spotify',
      href: 'https://open.spotify.com/show/3TsEjZG4GYw6rncs5D96OD',
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[17px] fill-current">
          <path d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12S6.34 22.25 12 22.25 22.25 17.66 22.25 12 17.66 1.75 12 1.75Zm4.7 14.78a.64.64 0 0 1-.88.21c-2.42-1.48-5.47-1.81-9.06-.99a.64.64 0 1 1-.29-1.25c3.93-.9 7.3-.51 10.02 1.15.3.19.4.58.21.88Zm1.25-2.78a.78.78 0 0 1-1.07.26c-2.77-1.7-6.99-2.2-10.27-1.2a.78.78 0 1 1-.45-1.49c3.73-1.13 8.37-.57 11.53 1.37.37.23.49.7.26 1.06Zm.11-2.9c-3.32-1.97-8.8-2.15-11.97-1.19a.94.94 0 0 1-.54-1.8c3.64-1.1 9.68-.89 13.47 1.36a.94.94 0 1 1-.96 1.63Z" />
        </svg>
      ),
    },
  ];

  return (
    <footer
      data-site-footer="true"
      className={`mt-auto border-t px-4 py-8 text-sm sm:px-6 ${
        darkMode
          ? 'border-white/10 bg-[#050505] text-stone-400'
          : 'border-black/10 bg-[#f8f5ef] text-zinc-600'
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 md:grid md:grid-cols-[1fr_auto] md:items-center">
          <div
            className={`order-1 rounded-3xl border p-5 md:order-2 ${
              darkMode ? 'border-white/10 bg-white/[0.04]' : 'border-black/10 bg-white/60'
            }`}
          >
            <p
              className={`text-center text-xs font-black uppercase tracking-[0.18em] md:text-left ${
                darkMode ? 'text-red-200' : 'text-red-900'
              }`}
            >
              Connect with us
            </p>

            <div className="mt-4 flex items-center justify-center gap-2.5 md:justify-start">
              {socialLinks.map(({ href, icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit AIC Njoro Town on ${label}`}
                  title={label}
                  className={`inline-flex size-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 ${
                    darkMode
                      ? 'border-white/10 bg-white/10 text-stone-100 hover:bg-white/15 focus:ring-offset-black'
                      : 'border-black/10 bg-white text-zinc-700 shadow-sm hover:bg-[#fffaf0] focus:ring-offset-[#f8f5ef]'
                  }`}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div className="order-2 md:order-1">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              <a
                href="https://media-crew.aicnjoro.org"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit AIC Njoro Town Media Crew"
                className={`inline-flex h-16 w-24 shrink-0 items-center justify-center rounded-2xl border transition hover:-translate-y-0.5 ${
                  darkMode
                    ? 'border-white/10 bg-white text-zinc-950'
                    : 'border-black/10 bg-white shadow-sm'
                }`}
              >
                <img
                  src={assetPaths.mediaCrewLogoBlack}
                  alt="AIC Njoro Town Media Crew"
                  className="h-10 w-auto object-contain"
                />
              </a>

              <div>
                <p
                  className={`text-xs font-black uppercase tracking-[0.18em] ${
                    darkMode ? 'text-red-200' : 'text-red-900'
                  }`}
                >
                  A.N.T Media Crew
                </p>

                <p className="mt-2 max-w-xl leading-6">
                  Serving A.I.C Njoro Town through media, worship support, livestreams,
                  sermon archives, and digital communication. To God be the Glory. Amen.
                </p>

                <p className="mt-3 text-xs">
                  &copy; 2020 - {currentYear} A.N.T Media Crew. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
