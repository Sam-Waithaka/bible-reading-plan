import type { LucideIcon } from 'lucide-react';
import { siteIcons } from '../constants/siteIcons';
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileText,
  Library,
  Megaphone,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import SiteFooter from "../components/navigation/SiteFooter";
import SiteHeader from "../components/navigation/SiteHeader";
import { portalSurface } from "../components/portal/portalSurface";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import {
  canAccessWritingStudio,
  canCreateWriting,
  canEditMedia,
  canManageTaxonomy,
  canPublishWriting,
  canReviewWriting,
  canUploadMedia,
  canViewAnyDrafts,
} from "../utils/permissions";

type PortalLinkItem = {
  description: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  title: string;
};

type PortalCapabilityMap = {
  canAccessProject52: boolean;
  canAccessWriting: boolean;
  canCreateWriting: boolean;
  canManageMedia: boolean;
  canManageTaxonomy: boolean;
  canPublishWriting: boolean;
  canReviewWriting: boolean;
  canViewAnyDrafts: boolean;
  canViewMedia: boolean;
  canViewProfile: boolean;
  canViewResources: boolean;
  canViewScripture: boolean;
};

const greetingFor = (date = new Date()) => {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Africa/Nairobi",
    }).format(date),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const displayNameFor = (auth: ReturnType<typeof useAuth>) =>
  auth.user?.profile?.displayName ||
  [auth.user?.firstName, auth.user?.lastName].filter(Boolean).join(" ") ||
  auth.user?.username ||
  "Church family";

const getCapabilities = (permissions: string[]): PortalCapabilityMap => ({
  canAccessProject52: true,
  canAccessWriting: canAccessWritingStudio(permissions),
  canCreateWriting: canCreateWriting(permissions),
  canManageMedia: canUploadMedia(permissions) || canEditMedia(permissions),
  canManageTaxonomy: canManageTaxonomy(permissions),
  canPublishWriting: canPublishWriting(permissions),
  canReviewWriting: canReviewWriting(permissions),
  canViewAnyDrafts: canViewAnyDrafts(permissions),
  canViewMedia: true,
  canViewProfile: true,
  canViewResources: true,
  canViewScripture: true,
});

const buildQuickActions = (
  capabilities: PortalCapabilityMap,
): PortalLinkItem[] => [
  ...(capabilities.canCreateWriting
    ? [
        {
          description: "Start a new church resource.",
          href: "/portal/writing/new",
          icon: PenLine,
          title: "New Article",
        },
      ]
    : []),
  ...(capabilities.canReviewWriting ||
  capabilities.canPublishWriting ||
  capabilities.canViewAnyDrafts
    ? [
        {
          description: "Review submitted work.",
          href: "/portal/writing/editorial",
          icon: ClipboardList,
          title: "Editorial Queue",
        },
      ]
    : []),
  ...(capabilities.canAccessWriting
    ? [
        {
          description: "Open the writing workspace.",
          href: "/portal/writing",
          icon: FileText,
          title: "Writing Studio",
        },
      ]
    : []),
  ...(capabilities.canManageTaxonomy
    ? [
        {
          description: "Manage resource discovery.",
          href: "/portal/writing/library",
          icon: Library,
          title: "Library",
        },
      ]
    : []),
  ...(capabilities.canViewScripture
    ? [
        {
          description: "Read and study Scripture.",
          href: "/scripture",
          icon: siteIcons.scripture,
          title: "Open Scripture",
        },
      ]
    : []),
  ...(capabilities.canAccessProject52
    ? [
        {
          description: "Continue the reading rhythm.",
          href: "/project52",
          icon: siteIcons.project52,
          title: "Project 52",
        },
      ]
    : []),
  ...(capabilities.canViewMedia
    ? [
        {
          description: "Watch sermons and church media.",
          href: "/media",
          icon: siteIcons.media,
          title: "Media",
        },
      ]
    : []),
];

const buildAtAGlance = (capabilities: PortalCapabilityMap): PortalLinkItem[] =>
  [
    ...(capabilities.canReviewWriting ||
    capabilities.canPublishWriting ||
    capabilities.canViewAnyDrafts
      ? [
          {
            description:
              "Review submitted writings, approvals, and publishing readiness.",
            href: "/portal/writing/editorial",
            icon: ShieldCheck,
            label: "Editorial",
            title: "Review queue",
          },
        ]
      : []),
    ...(capabilities.canAccessWriting
      ? [
          {
            description:
              "Create, edit, and curate resources for the church library.",
            href: "/portal/writing",
            icon: PenLine,
            label: "Writing Studio",
            title: "Writing workspace",
          },
        ]
      : []),
    ...(capabilities.canAccessProject52
      ? [
          {
            description:
              "Follow the weekly Bible reading journey with the church.",
            href: "/project52",
            icon: siteIcons.scripture,
            label: "Project 52",
            title: "Reading rhythm",
          },
        ]
      : []),
    ...(capabilities.canManageMedia
      ? [
          {
            description:
              "Manage church media assets as media tools become available.",
            href: "/media",
            icon: siteIcons.media,
            label: "Media",
            title: "Media library",
          },
        ]
      : []),
  ].slice(0, 3);

const buildAvailableModules = (
  capabilities: PortalCapabilityMap,
): PortalLinkItem[] => [
  ...(capabilities.canViewProfile
    ? [
        {
          description: "Manage your account details and church profile.",
          href: "/account/profile",
          icon: siteIcons.account,
          title: "Profile",
        },
      ]
    : []),
  ...(capabilities.canViewScripture
    ? [
        {
          description:
            "Read Scripture and return to saved passages as the library grows.",
          href: "/scripture",
          icon: siteIcons.scripture,
          title: "Scripture",
        },
      ]
    : []),
  ...(capabilities.canAccessProject52
    ? [
        {
          description: "Continue the shared church reading plan.",
          href: "/project52",
          icon: siteIcons.project52,
          title: "Project 52",
        },
      ]
    : []),
  ...(capabilities.canViewMedia
    ? [
        {
          description: "Sermons, worship, teaching, and church media.",
          href: "/media",
          icon: siteIcons.media,
          title: "Media",
        },
      ]
    : []),
  ...(capabilities.canViewResources
    ? [
        {
          description: "Articles, guides, and ministry resources.",
          href: "/resources",
          icon: siteIcons.resources,
          title: "Resources",
        },
      ]
    : []),
  ...(capabilities.canAccessWriting
    ? [
        {
          description: "Create, review, publish, and curate resources.",
          href: "/portal/writing",
          icon: PenLine,
          title: "Writing Studio",
        },
      ]
    : []),
  ...(capabilities.canReviewWriting ||
  capabilities.canPublishWriting ||
  capabilities.canViewAnyDrafts
    ? [
        {
          description: "Review submissions and follow editorial workflow.",
          href: "/portal/writing/editorial",
          icon: ClipboardList,
          title: "Editorial",
        },
      ]
    : []),
  ...(capabilities.canManageTaxonomy
    ? [
        {
          description: "Manage resource types, categories, series, and tags.",
          href: "/portal/writing/library",
          icon: Library,
          title: "Library Management",
        },
      ]
    : []),
];

const cardClass = (darkMode: boolean) =>
  `rounded-3xl border p-5 shadow-lg transition hover:-translate-y-0.5 ${darkMode ? "border-white/10 bg-[#171717] text-stone-100 shadow-black/25 hover:bg-zinc-950" : "border-[#eaded0] bg-[#fffaf0] text-zinc-950 shadow-zinc-900/5 hover:bg-white"}`;

const PortalActionLink = ({
  darkMode,
  item,
  primary = false,
}: {
  darkMode: boolean;
  item: PortalLinkItem;
  primary?: boolean;
}) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={
        primary
          ? "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-700 focus:ring-offset-2 focus:ring-offset-[#f8f1e7] dark:focus:ring-offset-[#080808]"
          : `group inline-flex min-h-11 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-700 ${darkMode ? "border-white/10 bg-[#171717] text-stone-100 hover:bg-zinc-950" : "border-[#eaded0] bg-[#fffaf0] text-zinc-800 hover:bg-white"}`
      }
    >
      <Icon
        size={primary ? 16 : 15}
        className={primary ? "" : "text-red-800"}
      />
      {item.title}
      <span
        aria-hidden="true"
        className="transition group-hover:translate-x-0.5"
      >
        &rarr;
      </span>
    </Link>
  );
};

const PortalModuleCard = ({
  darkMode,
  item,
}: {
  darkMode: boolean;
  item: PortalLinkItem;
}) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={`group block focus:outline-none focus:ring-2 focus:ring-red-700 ${cardClass(darkMode)}`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-2xl ${portalSurface.iconBadge(darkMode)}`}
        >
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          {item.label ? (
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-800">
              {item.label}
            </p>
          ) : null}
          <h3 className="font-black leading-tight">{item.title}</h3>
          <p
            className={`mt-2 text-sm leading-6 ${portalSurface.softMutedText(darkMode)}`}
          >
            {item.description}
          </p>
          <span className="mt-4 inline-flex text-sm font-black text-red-800">
            Open &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
};

const PortalPage = () => {
  const { darkMode, toggleTheme } = useTheme();
  const auth = useAuth();
  const capabilities = getCapabilities(auth.permissions);
  const quickActions = buildQuickActions(capabilities);
  const glanceCards = buildAtAGlance(capabilities);
  const modules = buildAvailableModules(capabilities);
  const name = displayNameFor(auth);
  const continuation =
    capabilities.canReviewWriting ||
    capabilities.canPublishWriting ||
    capabilities.canViewAnyDrafts
      ? {
          description:
            "Open the editorial queue to review submitted work and publishing readiness.",
          href: "/portal/writing/editorial",
          icon: ClipboardList,
          label: "Editorial",
          title: "Review submissions",
        }
      : capabilities.canCreateWriting || capabilities.canAccessWriting
        ? {
            description:
              "Open the writing workspace to continue creating and curating resources.",
            href: "/portal/writing",
            icon: PenLine,
            label: "Writing Studio",
            title: "Continue writing work",
          }
        : null;

  return (
    <div
      className={`flex min-h-screen flex-col overflow-x-clip transition-colors duration-500 ${portalSurface.page(darkMode)}`}
    >
      <SiteHeader darkMode={darkMode} onToggleTheme={toggleTheme} />

      <main className="flex-1 px-4 py-10 sm:px-6 lg:px-10 2xl:px-14">
        <section className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid gap-8">
            <section className="grid gap-8 xl:grid-cols-[minmax(24rem,0.85fr)_minmax(28rem,1fr)] xl:items-start">
              <div className="max-w-2xl">
                <p
                  className={`text-xs font-black uppercase tracking-[0.18em] ${darkMode ? "text-red-100" : "text-red-800"}`}
                >
                  Welcome back
                </p>
                <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
                  {greetingFor()}, {name}
                </h1>
                <p
                  className={`mt-5 max-w-xl text-base leading-8 ${portalSurface.mutedText(darkMode)}`}
                >
                  Your church account brings together Scripture, ministry
                  resources, media, and the work entrusted to you in one calm
                  place.
                </p>
                <figure
                  className={`mt-8 border-l-2 pl-5 ${darkMode ? "border-red-300/70" : "border-red-800"}`}
                >
                  <blockquote
                    className={`font-serif text-lg italic leading-8 ${portalSurface.mutedText(darkMode)}`}
                  >
                    &ldquo;Commit to the Lord whatever you do, and he will
                    establish your plans.&rdquo;
                  </blockquote>
                  <figcaption className="mt-3 text-sm font-black text-red-800">
                    Proverbs 16:3
                  </figcaption>
                </figure>
              </div>

              <section
                aria-labelledby="continue-heading"
                className={`rounded-3xl border p-5 shadow-xl transition ${darkMode ? "border-white/10 bg-[#171717] text-stone-100 shadow-black/25" : "border-[#eaded0] bg-[#fffaf0] text-zinc-950 shadow-zinc-900/5"}`}
              >
                <p
                  id="continue-heading"
                  className="text-xs font-black uppercase tracking-[0.16em] text-red-800"
                >
                  Continue where you left off
                </p>
                {continuation ? (
                  <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <span
                        className={`grid size-14 shrink-0 place-items-center rounded-2xl ${portalSurface.iconBadge(darkMode)}`}
                      >
                        <continuation.icon size={23} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-800">
                          {continuation.label}
                        </p>
                        <h2 className="mt-1 font-serif text-2xl leading-tight">
                          {continuation.title}
                        </h2>
                        <p
                          className={`mt-2 text-sm leading-6 ${portalSurface.softMutedText(darkMode)}`}
                        >
                          {continuation.description}
                        </p>
                      </div>
                    </div>
                    <PortalActionLink
                      darkMode={darkMode}
                      item={{
                        ...continuation,
                        title:
                          continuation.label === "Editorial"
                            ? "Review Now"
                            : "Open Studio",
                      }}
                      primary
                    />
                  </div>
                ) : (
                  <div
                    className={`mt-5 rounded-2xl border p-5 ${portalSurface.mutedSurface(darkMode)}`}
                  >
                    <h2 className="font-serif text-2xl">
                      You're all caught up.
                    </h2>
                    <p
                      className={`mt-2 text-sm leading-6 ${portalSurface.softMutedText(darkMode)}`}
                    >
                      Use this space to access the areas available to you below.
                    </p>
                  </div>
                )}
              </section>
            </section>

            {quickActions.length ? (
              <section aria-labelledby="quick-actions-heading">
                <h2
                  id="quick-actions-heading"
                  className="text-xs font-black uppercase tracking-[0.18em] text-red-800"
                >
                  Quick actions
                </h2>
                <div className="mt-4 flex gap-3 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
                  {quickActions.map((item) => (
                    <PortalActionLink
                      darkMode={darkMode}
                      item={item}
                      key={item.title}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {glanceCards.length ? (
              <section aria-labelledby="glance-heading">
                <h2
                  id="glance-heading"
                  className="text-xs font-black uppercase tracking-[0.18em] text-red-800"
                >
                  At a glance
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {glanceCards.map((item) => (
                    <PortalModuleCard
                      darkMode={darkMode}
                      item={item}
                      key={item.title}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section aria-labelledby="available-heading">
              <h2
                id="available-heading"
                className="text-xs font-black uppercase tracking-[0.18em] text-red-800"
              >
                Available to you
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {modules.map((item) => (
                  <PortalModuleCard
                    darkMode={darkMode}
                    item={item}
                    key={item.title}
                  />
                ))}
              </div>
            </section>
          </div>

          <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
            <section
              className={cardClass(darkMode)}
              aria-labelledby="announcements-heading"
            >
              <div className="flex items-center gap-3">
                <Megaphone size={17} className="text-red-800" />
                <h2
                  id="announcements-heading"
                  className="text-xs font-black uppercase tracking-[0.16em] text-red-800"
                >
                  Announcements
                </h2>
              </div>
              <div className="mt-4 grid gap-3">
                <article
                  className={`rounded-2xl border p-4 ${portalSurface.mutedSurface(darkMode)}`}
                >
                  <p className="text-sm font-black">Church Prayer Meeting</p>
                  <p
                    className={`mt-1 text-xs ${portalSurface.softMutedText(darkMode)}`}
                  >
                    Every Wednesday &middot; 6:00 PM
                  </p>
                </article>
                <article
                  className={`rounded-2xl border p-4 ${portalSurface.mutedSurface(darkMode)}`}
                >
                  <p className="text-sm font-black">Sunday Service</p>
                  <p
                    className={`mt-1 text-xs ${portalSurface.softMutedText(darkMode)}`}
                  >
                    This Sunday &middot; 9:00 AM
                  </p>
                </article>
              </div>
            </section>

            <section
              className={cardClass(darkMode)}
              aria-labelledby="activity-heading"
            >
              <div className="flex items-center gap-3">
                <Bell size={17} className="text-red-800" />
                <h2
                  id="activity-heading"
                  className="text-xs font-black uppercase tracking-[0.16em] text-red-800"
                >
                  Recent activity
                </h2>
              </div>
              <div
                className={`mt-4 rounded-2xl border p-4 ${portalSurface.mutedSurface(darkMode)}`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-green-700"
                  />
                  <div>
                    <p className="text-sm font-black">You're all caught up.</p>
                    <p
                      className={`mt-1 text-xs leading-5 ${portalSurface.softMutedText(darkMode)}`}
                    >
                      Recent activity will appear here as dashboard integrations
                      become available.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </section>
      </main>

      <SiteFooter darkMode={darkMode} />
    </div>
  );
};

export default PortalPage;
