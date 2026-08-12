import { MainMenuItem, CategoryItem, TemplateItem, PasaranItem } from '../types';

/**
 * Menu Utama tetap ada sebagai struktur dasar dashboard.
 */
export const INITIAL_MAIN_MENUS: MainMenuItem[] = [
  {
    id: 'menu-pk-live-chat',
    name: 'PK CHAT',
    code: 'PK_LIVE_CHAT',
    icon: 'MessageSquare',
    order: 1,
  },
  {
    id: 'menu-dashboard-result',
    name: 'DASHBOARD RESULT',
    code: 'DASHBOARD_RESULT',
    icon: 'Trophy',
    order: 2,
  },
  {
    id: 'menu-gambar',
    name: 'GAMBAR',
    code: 'GAMBAR',
    icon: 'Image',
    order: 3,
  },
  {
    id: 'menu-link-bookmark',
    name: 'LINK',
    code: 'LINK_BOOKMARKS',
    icon: 'Bookmark',
    order: 4,
  },
];

/**
 * Data di bawah ini dikosongkan agar user mengisi sendiri lewat dashboard.
 */
export const INITIAL_CATEGORIES: CategoryItem[] = [];
export const INITIAL_TEMPLATES: TemplateItem[] = [];
export const INITIAL_PASARAN_LIST: PasaranItem[] = []; // User tambahkan pasaran sendiri
