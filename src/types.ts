export interface MainMenuItem {
  id: string;
  name: string;
  code: string;
  icon?: string;
  order: number;
}

export interface CategoryItem {
  id: string;
  mainMenuId: string; // Parent Menu Utama (e.g. PK LIVE CHAT)
  name: string;       // Sub-menu name (Menu Kedua)
  code: string;
  color?: string;
  order: number;
}

export interface TemplateItem {
  id: string;
  mainMenuId: string;
  categoryId: string; // Menu Kedua ID
  categoryName: string;
  title: string;
  info: string;
  perihal: string;
  ket: string;
  imageUrl?: string; // Image URL or Base64 Data URI for image storage
  linkUrl?: string; // Target URL for Link Bookmarks
  links?: string[]; // Array of stored URL links for Multi-Link Bookmark box
  tag?: string; // e.g. "VAR TEMPLATE"
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportItem {
  id: string;
  templateId: string;
  templateTitle: string;
  user: string;
  note: string;
  createdAt: string;
}

export type SortOption = 'terbaru' | 'terlama' | 'title-asc' | 'title-desc' | 'pinned';

export interface PasaranItem {
  id: string;
  session: 'PAGI' | 'SORE' | 'MALAM' | 'DINI HARI';
  name: string;
  jamTutup: string;
  jamResult: string;
  linkUrl?: string;
  isResultNow: boolean; // true = RESULT NOW!, false = SUDAH RESULT
  p1Prize: string;      // e.g. "4647" or "-"
  p2Prize?: string;     // e.g. "0978" or "-"
  p3Prize?: string;     // e.g. "2015" or "-"
  status: 'BELUM' | 'DONE' | 'LIBUR';
}

