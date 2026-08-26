import { siteIcons } from '../constants/siteIcons';
import {
  ChevronRight,
  Compass,
  Flower2,
  Mail,
  ScrollText,
  Sprout,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ResourceArticle = {
  accent: string;
  author: string;
  imageTone: string;
  minutes: number;
  title: string;
  type: string;
};

export type ResourceType = {
  count: number;
  icon: LucideIcon;
  name: string;
};

export type ResourceCollection = {
  count: number;
  description: string;
  imageTone: string;
  title: string;
};

export type BrowseItem = {
  count: number;
  icon: LucideIcon;
  label: string;
};

export const mockFeaturedArticle = {
  authors: ['Pastor Francis Odu', 'Njeri'],
  excerpt: "God's sovereignty is never absent, even when His people suffer.",
  imageTone: 'from-zinc-950 via-stone-800 to-amber-200',
  minutes: 12,
  title: 'Walking Through Acts 12',
  type: 'Bible Study',
};

export const mockFeaturedArticles: ResourceArticle[] = [
  {
    accent: 'Devotional',
    author: 'Lulu',
    imageTone: 'from-stone-950 via-amber-900 to-stone-200',
    minutes: 8,
    title: 'A New Mercy Every Morning',
    type: 'Devotional',
  },
  {
    accent: 'Bible Study',
    author: 'Elder Adam Smith',
    imageTone: 'from-zinc-900 via-stone-700 to-amber-100',
    minutes: 15,
    title: 'The Gospel of Grace',
    type: 'Bible Study',
  },
  {
    accent: 'Pastoral Letter',
    author: 'Rev. John Doe',
    imageTone: 'from-stone-950 via-[#3b2518] to-[#c7a66c]',
    minutes: 10,
    title: 'Strength for the Journey',
    type: 'Pastoral Letter',
  },
  {
    accent: 'Devotional',
    author: 'Jane Smith',
    imageTone: 'from-zinc-950 via-green-950 to-amber-100',
    minutes: 7,
    title: 'Rooted in His Word',
    type: 'Devotional',
  },
  {
    accent: 'Guide',
    author: 'Youth Ministry',
    imageTone: 'from-zinc-950 via-red-950 to-stone-200',
    minutes: 9,
    title: 'How to Lead Family Prayer',
    type: 'Guide',
  },
];

export const mockLatestArticles: ResourceArticle[] = [
  {
    accent: 'Reflection',
    author: 'A.I.C Njoro Town',
    imageTone: 'from-zinc-950 via-[#34251d] to-stone-200',
    minutes: 6,
    title: 'Learning to Wait in Prayer',
    type: 'Reflection',
  },
  {
    accent: 'Bible Study',
    author: 'Discipleship Team',
    imageTone: 'from-zinc-950 via-[#2e3228] to-amber-100',
    minutes: 14,
    title: 'Reading the Psalms With the Church',
    type: 'Bible Study',
  },
  {
    accent: 'Guide',
    author: 'Pastoral Team',
    imageTone: 'from-zinc-950 via-red-950 to-stone-200',
    minutes: 9,
    title: 'A Simple Pattern for Family Devotion',
    type: 'Guide',
  },
];

export const mockResourceTypes: ResourceType[] = [
  { count: 128, icon: Flower2, name: 'Devotionals' },
  { count: 96, icon: siteIcons.scripture, name: 'Bible Studies' },
  { count: 34, icon: Mail, name: 'Pastoral Letters' },
  { count: 24, icon: Compass, name: 'Guides' },
  { count: 12, icon: UsersRound, name: 'Ministry Charters' },
];

export const mockCollections: ResourceCollection[] = [
  {
    count: 52,
    description: 'A year-long journey through the Bible.',
    imageTone: 'from-zinc-950 via-stone-800 to-amber-200',
    title: 'Project 52',
  },
  {
    count: 28,
    description: 'A comprehensive study of the Book of Acts.',
    imageTone: 'from-zinc-950 via-[#4d3425] to-stone-300',
    title: 'Walking Through Acts',
  },
  {
    count: 31,
    description: 'Growing deeper in conversations with God.',
    imageTone: 'from-zinc-950 via-stone-700 to-[#d1b37b]',
    title: 'Prayer',
  },
  {
    count: 45,
    description: 'Articles for everyday faith and living.',
    imageTone: 'from-zinc-950 via-[#5b351e] to-amber-200',
    title: 'Christian Life',
  },
];

export const mockScriptureBooks: BrowseItem[] = [
  { count: 18, icon: ScrollText, label: 'Genesis' },
  { count: 32, icon: ScrollText, label: 'Psalms' },
  { count: 42, icon: ScrollText, label: 'Acts' },
  { count: 25, icon: ScrollText, label: 'Romans' },
  { count: 16, icon: ScrollText, label: 'James' },
  { count: 20, icon: ScrollText, label: 'Hebrews' },
];

export const mockMinistries: BrowseItem[] = [
  { count: 28, icon: UsersRound, label: 'Youth Ministry' },
  { count: 36, icon: UsersRound, label: "Women's Ministry" },
  { count: 24, icon: UsersRound, label: "Men's Fellowship" },
  { count: 18, icon: UsersRound, label: 'Children Ministry' },
  { count: 22, icon: UsersRound, label: 'Worship Ministry' },
  { count: 26, icon: UsersRound, label: 'Missions' },
];

export const resourceArrowIcon = ChevronRight;
export const resourceSproutIcon = Sprout;
