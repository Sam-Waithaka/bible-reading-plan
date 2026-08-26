import {
  BookOpen,
  CalendarDays,
  FileText,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  Phone,
  PlayCircle,
  ScrollText,
  UserCircle,
  Users,
} from 'lucide-react';

export const AboutIcon = Info;
export const AccountIcon = UserCircle;
export const ContactIcon = Phone;
export const DashboardIcon = LayoutDashboard;
export const EventsIcon = CalendarDays;
export const GivingIcon = Heart;
export const HomeIcon = Home;
export const MediaIcon = PlayCircle;
export const MinistriesIcon = Users;
export const Project52Icon = BookOpen;
export const ResourcesIcon = FileText;
export const ScriptureIcon = ScrollText;

export const siteIcons = {
  about: AboutIcon,
  account: AccountIcon,
  contact: ContactIcon,
  dashboard: DashboardIcon,
  events: EventsIcon,
  giving: GivingIcon,
  home: HomeIcon,
  media: MediaIcon,
  ministries: MinistriesIcon,
  project52: Project52Icon,
  resources: ResourcesIcon,
  scripture: ScriptureIcon,
} as const;

export type SiteIconName = keyof typeof siteIcons;