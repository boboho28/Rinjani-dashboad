import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MainMenuItem, CategoryItem, ReportItem, SortOption, TemplateItem, PasaranItem } from './types';
import { INITIAL_MAIN_MENUS, INITIAL_CATEGORIES, INITIAL_TEMPLATES, INITIAL_PASARAN_LIST } from './data/initialData';
import { Header } from './components/Header';
import { TickerBar } from './components/TickerBar';
import { Sidebar } from './components/Sidebar';
import { SubMenuBar } from './components/SubMenuBar';
import { TemplateCard } from './components/TemplateCard';
import { ImageCard } from './components/ImageCard';
import { BookmarkCard } from './components/BookmarkCard';
import { DashboardResultView } from './components/DashboardResultView';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { AddEditModal } from './components/AddEditModal';
import { CategoryModal } from './components/CategoryModal';
import { ReportModal } from './components/ReportModal';
import { VariableReplacerModal } from './components/VariableReplacerModal';
import { PhpSqlModal } from './components/PhpSqlModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { copyImageToClipboard } from './utils/copyImage';
import { subscribeToAppData, saveAppDataToFirestore, subscribeAuthState, UserProfile } from './lib/firebase';
import {
  RotateCw,
  SlidersHorizontal,
  FolderOpen,
  Plus,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export default function App() {
  // --- Helper Data Sanitization & Auto Migration ---
  const sanitizeData = useCallback((rawMainMenus: any, rawCategories: any, rawTemplates: any) => {
    const menus: MainMenuItem[] = Array.isArray(rawMainMenus) && rawMainMenus.length > 0
      ? rawMainMenus
      : INITIAL_MAIN_MENUS;
    const validMenuIds = new Set(menus.map((m) => m.id));

    const cats: CategoryItem[] = Array.isArray(rawCategories) ? rawCategories : [];
    const normalizedCats = cats.map((c) => ({
      ...c,
      mainMenuId: (c.mainMenuId && validMenuIds.has(c.mainMenuId)) ? c.mainMenuId : (menus[0]?.id || 'menu-pk-live-chat'),
    }));

    const tpls: TemplateItem[] = Array.isArray(rawTemplates) ? rawTemplates : [];
    const normalizedTpls = tpls.map((t) => ({
      ...t,
      mainMenuId: (t.mainMenuId && validMenuIds.has(t.mainMenuId)) ? t.mainMenuId : (menus[0]?.id || 'menu-pk-live-chat'),
    }));

    return { mainMenus: menus, categories: normalizedCats, templates: normalizedTpls };
  }, []);

  // --- Persistent States ---
  const [mainMenus, setMainMenus] = useState<MainMenuItem[]>(INITIAL_MAIN_MENUS);

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const local = localStorage.getItem('rinjani_categories');
    return local ? JSON.parse(local) : [];
  });

  const [templates, setTemplates] = useState<TemplateItem[]>(() => {
    const local = localStorage.getItem('rinjani_templates');
    return local ? JSON.parse(local) : [];
  });

  const [reports, setReports] = useState<ReportItem[]>(() => {
    const local = localStorage.getItem('rinjani_reports');
    return local ? JSON.parse(local) : [];
  });

  const [pasaranList, setPasaranList] = useState<PasaranItem[]>(() => {
    const local = localStorage.getItem('rinjani_pasaran');
    return local ? JSON.parse(local) : INITIAL_PASARAN_LIST;
  });

  useEffect(() => {
    localStorage.setItem('rinjani_pasaran', JSON.stringify(pasaranList));
  }, [pasaranList]);

  // --- UI Filter & Layout States ---
  // Default selected Main Menu is 'menu-pk-live-chat' (PK LIVE CHAT) as requested by user
  const [selectedMainMenuId, setSelectedMainMenuId] = useState<string | null>('menu-pk-live-chat');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('terbaru');
  const [isWideMode, setIsWideMode] = useState<boolean>(true); // Default wide layout for menu & content
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true); // Fixed left sidebar state (default collapsed like screenshot 2)

  // --- Modal & Auth States ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TemplateItem | null>(null);
  const [viewingImageItem, setViewingImageItem] = useState<TemplateItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPhpSqlModalOpen, setIsPhpSqlModalOpen] = useState(false);
  const [reportItem, setReportItem] = useState<TemplateItem | null>(null);
  const [varReplacerItem, setVarReplacerItem] = useState<TemplateItem | null>(null);

  // Subscribe to Firebase Auth State
  useEffect(() => {
    const unsub = subscribeAuthState((profile) => {
      setCurrentUser(profile);
    });
    return () => unsub();
  }, []);

  // --- Feedback States ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      type,
      text,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- Refs to prevent infinite loop & control Firestore writes ---
  const isRemoteUpdateRef = useRef(false);
  const lastSavedJsonRef = useRef<string>('');

  // --- Real-time Firebase Cloud Database Sync Effect (Per-User Data Isolation) ---
  useEffect(() => {
    let hasSeeded = false;
    lastSavedJsonRef.current = ''; // Reset cached signature when switching user

    const currentUserId = currentUser?.uid;

    const unsubscribe = subscribeToAppData(currentUserId, (cloudData) => {
      if (cloudData) {
        const payloadStr = JSON.stringify({
          mainMenus: cloudData.mainMenus || INITIAL_MAIN_MENUS,
          categories: cloudData.categories || [],
          templates: cloudData.templates || [],
          reports: cloudData.reports || [],
          pasaranList: cloudData.pasaranList || INITIAL_PASARAN_LIST,
        });

        // Skip updating state if the payload from cloud is identical to local memory
        if (payloadStr === lastSavedJsonRef.current) {
          return;
        }

        lastSavedJsonRef.current = payloadStr;
        isRemoteUpdateRef.current = true;

        const { mainMenus: normMenus, categories: normCats, templates: normTpls } = sanitizeData(
          cloudData.mainMenus,
          cloudData.categories,
          cloudData.templates
        );
        setMainMenus(normMenus);
        setCategories(normCats);
        setTemplates(normTpls);
        if (Array.isArray(cloudData.reports)) setReports(cloudData.reports);
        if (Array.isArray(cloudData.pasaranList)) setPasaranList(cloudData.pasaranList);
      } else if (!hasSeeded) {
        hasSeeded = true;
        // First load & Firestore document for this user is empty: load local data if present, seed Firestore
        const userPrefix = currentUserId ? `rinjani_${currentUserId}_` : 'rinjani_';
        const rawLocalCats = localStorage.getItem(`${userPrefix}categories`) || localStorage.getItem('rinjani_categories');
        const rawLocalTpls = localStorage.getItem(`${userPrefix}templates`) || localStorage.getItem('rinjani_templates');
        
        let initialCategories = categories;
        let initialTemplates = templates;
        try { if (rawLocalCats) initialCategories = JSON.parse(rawLocalCats); } catch (e) {}
        try { if (rawLocalTpls) initialTemplates = JSON.parse(rawLocalTpls); } catch (e) {}

        const initialPayload = { mainMenus, categories: initialCategories, templates: initialTemplates, reports, pasaranList };
        setCategories(initialCategories);
        setTemplates(initialTemplates);
        lastSavedJsonRef.current = JSON.stringify(initialPayload);
        saveAppDataToFirestore(initialPayload, currentUserId);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid, sanitizeData]);

  // Save to LocalStorage and Firebase Cloud Firestore on changes
  useEffect(() => {
    const userStoragePrefix = currentUser?.uid ? `rinjani_${currentUser.uid}_` : 'rinjani_';
    localStorage.setItem(`${userStoragePrefix}main_menus`, JSON.stringify(mainMenus));
    localStorage.setItem(`${userStoragePrefix}categories`, JSON.stringify(categories));
    localStorage.setItem(`${userStoragePrefix}templates`, JSON.stringify(templates));
    localStorage.setItem(`${userStoragePrefix}reports`, JSON.stringify(reports));

    // If change came from incoming Firebase snapshot, skip echoing write back to Firestore
    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const currentPayload = { mainMenus, categories, templates, reports, pasaranList };
    const currentJson = JSON.stringify(currentPayload);

    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    // Immediately record locally saved snapshot signature
    lastSavedJsonRef.current = currentJson;

    // Immediately send update to Cloud Firestore for this user
    saveAppDataToFirestore(currentPayload, currentUser?.uid);

    const saveBackendData = async () => {
      const payload = JSON.stringify({ mainMenus, categories, templates, reports });
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        });
      } catch (err) {
        // Silently handled
      }
    };
    saveBackendData();
  }, [mainMenus, categories, templates, reports, pasaranList, currentUser?.uid]);

  // When switching Main Menu, reset sub-menu filter
  const handleSelectMainMenu = (id: string | null) => {
    setSelectedMainMenuId(id);
    setSelectedCategoryId(null);
  };

  // --- Counts & Summaries ---
  const mainMenuCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      if (t.mainMenuId) {
        counts[t.mainMenuId] = (counts[t.mainMenuId] || 0) + 1;
      }
    });
    return counts;
  }, [templates]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    templates.forEach((t) => {
      counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
    });
    return counts;
  }, [templates]);

  const pinnedCount = useMemo(() => {
    return templates.filter((t) => t.isPinned).length;
  }, [templates]);

  // Active Main Menu details
  const activeMainMenu = useMemo(() => {
    if (!selectedMainMenuId) return null;
    return mainMenus.find((m) => m.id === selectedMainMenuId) || null;
  }, [mainMenus, selectedMainMenuId]);

  // Categories under active Main Menu
  const availableSubCategories = useMemo(() => {
    if (!selectedMainMenuId) return categories;
    return categories.filter((c) => c.mainMenuId === selectedMainMenuId);
  }, [categories, selectedMainMenuId]);

  // Active Sub-Category details
  const activeCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // --- Filtering & Sorting ---
  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      // Main Menu filter
      if (selectedMainMenuId && item.mainMenuId !== selectedMainMenuId) {
        return false;
      }
      // Sub-Menu category filter
      if (selectedCategoryId && item.categoryId !== selectedCategoryId) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchInfo = item.info.toLowerCase().includes(q);
        const matchPerihal = item.perihal.toLowerCase().includes(q);
        const matchKet = item.ket.toLowerCase().includes(q);
        const matchCat = item.categoryName.toLowerCase().includes(q);
        const matchTag = item.tag ? item.tag.toLowerCase().includes(q) : false;
        return matchTitle || matchInfo || matchPerihal || matchKet || matchCat || matchTag;
      }
      return true;
    });
  }, [templates, selectedMainMenuId, selectedCategoryId, searchQuery]);

  const sortedTemplates = useMemo(() => {
    const list = [...filteredTemplates];
    list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      if (sortBy === 'terbaru') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'terlama') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });
    return list;
  }, [filteredTemplates, sortBy]);

  // --- Handlers ---
  const handleCopyText = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) setCopiedId(id);
    addToast('Teks berhasil disalin ke clipboard!', 'success');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCopyImage = async (imageUrl: string, id?: string) => {
    if (id) setCopiedId(id);
    const isBlobCopied = await copyImageToClipboard(imageUrl);
    if (isBlobCopied) {
      addToast('Gambar berhasil disalin! Tinggal Paste (Ctrl+V) ke Chat.', 'success');
    } else {
      addToast('Link gambar disalin ke clipboard.', 'info');
    }
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleAddSubMenu = (name: string, color?: string) => {
    const targetMainId = selectedMainMenuId || mainMenus[0]?.id || 'menu-pk-live-chat';
    const newCat: CategoryItem = {
      id: 'cat-' + Date.now().toString(36),
      mainMenuId: targetMainId,
      name,
      code: name.toUpperCase().replace(/\s+/g, '_'),
      color: color || '#8b5cf6',
      order: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCat]);
    setSelectedCategoryId(newCat.id);
    addToast(`Menu Kedua (Sub-menu) "${newCat.name}" berhasil ditambahkan!`, 'success');
  };

  const handleSaveTemplate = (
    data: Omit<TemplateItem, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    const now = new Date().toISOString();
    let nextTpls: TemplateItem[] = [];

    if (id) {
      nextTpls = templates.map((item) =>
        item.id === id
          ? {
              ...item,
              ...data,
              updatedAt: now,
            }
          : item
      );
      setTemplates(nextTpls);
      addToast('Template berhasil diperbarui!', 'success');
    } else {
      const newItem: TemplateItem = {
        ...data,
        id: 'tpl-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        createdAt: now,
        updatedAt: now,
      };
      nextTpls = [newItem, ...templates];
      setTemplates(nextTpls);
      addToast('Template PK baru berhasil ditambahkan!', 'success');
    }

    // Force instant save to LocalStorage & Firestore
    const userStoragePrefix = currentUser?.uid ? `rinjani_${currentUser.uid}_` : 'rinjani_';
    localStorage.setItem(`${userStoragePrefix}templates`, JSON.stringify(nextTpls));

    const updatedPayload = { mainMenus, categories, templates: nextTpls, reports, pasaranList };
    lastSavedJsonRef.current = JSON.stringify(updatedPayload);
    saveAppDataToFirestore(updatedPayload, currentUser?.uid);
  };

  const handleDeleteTemplate = (id: string) => {
    const item = templates.find((t) => t.id === id);
    if (window.confirm(`Hapus template "${item?.title || 'ini'}"?`)) {
      const nextTpls = templates.filter((t) => t.id !== id);
      setTemplates(nextTpls);

      const userStoragePrefix = currentUser?.uid ? `rinjani_${currentUser.uid}_` : 'rinjani_';
      localStorage.setItem(`${userStoragePrefix}templates`, JSON.stringify(nextTpls));

      const updatedPayload = { mainMenus, categories, templates: nextTpls, reports, pasaranList };
      lastSavedJsonRef.current = JSON.stringify(updatedPayload);
      saveAppDataToFirestore(updatedPayload, currentUser?.uid);

      addToast('Template telah dihapus.', 'info');
    }
  };

  const handleTogglePin = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updatedPin = !t.isPinned;
          addToast(updatedPin ? 'Disematkan ke bagian atas!' : 'Sematkan dilepas.', 'info');
          return { ...t, isPinned: updatedPin };
        }
        return t;
      })
    );
  };

  const handleUpdateLinks = (id: string, updatedLinks: string[]) => {
    const now = new Date().toISOString();
    setTemplates((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              links: updatedLinks,
              linkUrl: updatedLinks[0] || item.linkUrl,
              info: updatedLinks[0] || item.info,
              updatedAt: now,
            }
          : item
      )
    );
    addToast('Daftar link bookmark berhasil diperbarui!', 'success');
  };

  const handleAddCategory = (catData: Omit<CategoryItem, 'id' | 'order'>) => {
    const newCat: CategoryItem = {
      ...catData,
      id: 'cat-' + Date.now().toString(36),
      order: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCat]);
    addToast(`Sub-Menu "${newCat.name}" berhasil dibuat!`, 'success');
  };

  const handleUpdateCategory = (id: string, name: string, code: string, color?: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name, code, color: color || c.color } : c))
    );
    setTemplates((prev) =>
      prev.map((t) => (t.categoryId === id ? { ...t, categoryName: name.toUpperCase() } : t))
    );
    addToast('Sub-Menu berhasil diperbarui.', 'success');
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    const count = categoryCounts[id] || 0;
    const msg = count > 0
      ? `Hapus Sub-menu "${cat?.name || 'ini'}" beserta ${count} data template di dalamnya?`
      : `Hapus Sub-menu "${cat?.name || 'ini'}"?`;

    if (window.confirm(msg)) {
      const nextCats = categories.filter((c) => c.id !== id);
      const nextTpls = templates.filter((t) => t.categoryId !== id);
      setCategories(nextCats);
      setTemplates(nextTpls);
      if (selectedCategoryId === id) setSelectedCategoryId(null);

      // Force instant save to Firestore & LocalStorage
      const userStoragePrefix = currentUser?.uid ? `rinjani_${currentUser.uid}_` : 'rinjani_';
      localStorage.setItem(`${userStoragePrefix}categories`, JSON.stringify(nextCats));
      localStorage.setItem(`${userStoragePrefix}templates`, JSON.stringify(nextTpls));

      const updatedPayload = { mainMenus, categories: nextCats, templates: nextTpls, reports, pasaranList };
      lastSavedJsonRef.current = JSON.stringify(updatedPayload);
      saveAppDataToFirestore(updatedPayload, currentUser?.uid);

      addToast('Sub-menu telah dihapus.', 'info');
    }
  };

  const handleAddMainMenu = (name: string) => {
    const newMenu: MainMenuItem = {
      id: 'menu-' + Date.now().toString(36),
      name: name.toUpperCase(),
      code: name.toUpperCase().replace(/\s+/g, '_'),
      order: mainMenus.length + 1,
    };
    setMainMenus((prev) => [...prev, newMenu]);
    addToast(`Menu Utama "${newMenu.name}" berhasil dibuat!`, 'success');
  };

  const handleUpdateMainMenu = (id: string, name: string) => {
    setMainMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: name.toUpperCase(), code: name.toUpperCase().replace(/\s+/g, '_') } : m))
    );
    addToast('Menu Utama berhasil diperbarui.', 'success');
  };

  const handleDeleteMainMenu = (id: string) => {
    if (mainMenus.length <= 1) {
      alert('Minimal harus ada 1 Menu Utama.');
      return;
    }
    const menu = mainMenus.find((m) => m.id === id);
    if (window.confirm(`Hapus Menu Utama "${menu?.name}" beserta semua sub-menu dan templatenya?`)) {
      const nextMenus = mainMenus.filter((m) => m.id !== id);
      const nextCats = categories.filter((c) => c.mainMenuId !== id);
      const nextTpls = templates.filter((t) => t.mainMenuId !== id);
      setMainMenus(nextMenus);
      setCategories(nextCats);
      setTemplates(nextTpls);
      if (selectedMainMenuId === id) setSelectedMainMenuId(nextMenus[0]?.id || null);

      const userStoragePrefix = currentUser?.uid ? `rinjani_${currentUser.uid}_` : 'rinjani_';
      localStorage.setItem(`${userStoragePrefix}main_menus`, JSON.stringify(nextMenus));
      localStorage.setItem(`${userStoragePrefix}categories`, JSON.stringify(nextCats));
      localStorage.setItem(`${userStoragePrefix}templates`, JSON.stringify(nextTpls));

      const updatedPayload = { mainMenus: nextMenus, categories: nextCats, templates: nextTpls, reports, pasaranList };
      lastSavedJsonRef.current = JSON.stringify(updatedPayload);
      saveAppDataToFirestore(updatedPayload, currentUser?.uid);

      addToast('Menu Utama telah dihapus.', 'info');
    }
  };

  const handleClearAllCustomData = () => {
    if (window.confirm('Kosongkan semua Sub-Menu & data template? Anda dapat membuat menu dan data baru dari awal.')) {
      setCategories([]);
      setTemplates([]);
      setSelectedCategoryId(null);

      // Save empty arrays to LocalStorage & Firestore immediately
      const userStoragePrefix = currentUser?.uid ? `rinjani_${currentUser.uid}_` : 'rinjani_';
      localStorage.setItem(`${userStoragePrefix}categories`, JSON.stringify([]));
      localStorage.setItem(`${userStoragePrefix}templates`, JSON.stringify([]));

      const clearedPayload = { mainMenus, categories: [], templates: [], reports, pasaranList };
      lastSavedJsonRef.current = JSON.stringify(clearedPayload);
      saveAppDataToFirestore(clearedPayload, currentUser?.uid);

      addToast('Semua Sub-Menu & data template berhasil dikosongkan!', 'info');
    }
  };

  const handleAddReport = (templateId: string, templateTitle: string, note: string) => {
    const newReport: ReportItem = {
      id: 'rep-' + Date.now().toString(36),
      templateId,
      templateTitle,
      user: 'Customer Support PK',
      note,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    addToast('Laporan kendala berhasil dikirim!', 'success');
  };

  const handleExportBackup = () => {
    const backupData = {
      mainMenus,
      categories,
      templates,
      reports,
      version: '2.5',
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RINJANI_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Backup data JSON berhasil di-download!', 'success');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.categories && data.templates) {
          if (data.mainMenus) setMainMenus(data.mainMenus);
          setCategories(data.categories);
          setTemplates(data.templates);
          if (data.reports) setReports(data.reports);
          addToast('Data berhasil di-restore dari file JSON backup!', 'success');
        } else {
          addToast('Format file backup tidak valid.', 'error');
        }
      } catch (err) {
        addToast('Gagal me-load file JSON backup.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#0b0c14] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 pb-16 relative">
      
      {/* 1. FIXED LEFT SIDEBAR (STICKY ON LEFT AT ALL TIMES) */}
      <Sidebar
        mainMenus={mainMenus}
        selectedMainMenuId={selectedMainMenuId}
        onSelectMainMenu={handleSelectMainMenu}
        mainMenuCounts={mainMenuCounts}
        totalCount={templates.length}
        pinnedCount={pinnedCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* 2. MAIN APP CONTENT CONTAINER OFFSET BY FIXED SIDEBAR WIDTH */}
      <div
        className={`transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-16 sm:ml-20' : 'ml-72 sm:ml-80'
        }`}
      >
        {/* TOP HEADER */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddModal={() => {
            setEditItem(null);
            setIsAddModalOpen(true);
          }}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          onOpenPhpSqlModal={() => setIsPhpSqlModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          isWideMode={isWideMode}
          setIsWideMode={setIsWideMode}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />

        {/* TICKER ANNOUNCEMENT BAR */}
        <TickerBar isWideMode={isWideMode} />

        {/* MAIN CONTENT AREA */}
        <main className="w-full pt-5 px-3 sm:px-5 lg:px-6 transition-all duration-300">
          <div className="flex flex-col md:flex-row gap-5 lg:gap-6 items-start w-full">
            
            {/* COL 1: MIDDLE PANEL - MENU KEDUA (SUB-MENU) - Only shown for sub-menu modules */}
            {selectedMainMenuId !== 'menu-dashboard-result' && (
              <SubMenuBar
                categories={availableSubCategories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                categoryCounts={categoryCounts}
                totalCount={filteredTemplates.length}
                mainMenuName={activeMainMenu ? activeMainMenu.name : 'Semua Modul'}
                onAddSubMenu={handleAddSubMenu}
                onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
                onAddPkForCategory={(catId) => {
                  const targetCat = categories.find((c) => c.id === catId);
                  if (targetCat) {
                    setSelectedMainMenuId(targetCat.mainMenuId);
                    setSelectedCategoryId(catId);
                  }
                  setEditItem(null);
                  setIsAddModalOpen(true);
                }}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {/* COL 2: MAIN DATA & CONTENT SECTION (ISI KONTEN MENU 2) */}
            <section id="main-content" className="flex-1 w-full min-w-0 space-y-5">

            {selectedMainMenuId === 'menu-dashboard-result' ? (
              <DashboardResultView
                pasaranList={pasaranList}
                setPasaranList={setPasaranList}
                addToast={addToast}
              />
            ) : (
              <>
                {/* Top Filter & Category Title Banner */}
                <div className="bg-[#121322] border border-[#23253b] rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

              
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-lime-400 tracking-wide uppercase">
                  {activeCategory
                    ? activeCategory.name
                    : activeMainMenu
                    ? `DAFTAR PK - ${activeMainMenu.name}`
                    : 'SEMUA TEMPLATE & KATA-KATA PK'}
                </h2>


              </div>

              {/* Right Filter & Sort Controls */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
                
                {/* Sort Dropdown */}
                <div className="flex items-center gap-1.5 bg-[#181a2c] border border-[#262842] rounded-xl px-3 py-2 text-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-lime-400" />
                  <span className="text-slate-400 hidden sm:inline">Urutkan:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-slate-100 font-bold outline-none cursor-pointer"
                  >
                    <option value="terbaru" className="bg-[#121322] text-slate-100">Terbaru</option>
                    <option value="terlama" className="bg-[#121322] text-slate-100">Terlama</option>
                    <option value="title-asc" className="bg-[#121322] text-slate-100">A - Z (Judul)</option>
                    <option value="title-desc" className="bg-[#121322] text-slate-100">Z - A (Judul)</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    addToast('Data disinkronkan dari server database.', 'info');
                  }}
                  className="p-2 bg-[#181a2c] border border-[#262842] rounded-xl text-slate-300 hover:text-lime-400 transition-colors"
                  title="Refresh Data"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Add Button for currently selected menu */}
                <button
                  onClick={() => {
                    setEditItem(null);
                    setIsAddModalOpen(true);
                  }}
                  className={`flex items-center gap-1.5 font-black px-3.5 py-2 rounded-xl text-xs shadow-lg border transition-all active:scale-95 cursor-pointer ${
                    selectedMainMenuId === 'menu-link-bookmark'
                      ? 'bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 hover:from-cyan-300 hover:to-blue-300 text-slate-950 shadow-cyan-950/40 border-cyan-300/40'
                      : 'bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 shadow-lime-950/40 border-lime-300/40'
                  }`}
                  title={activeCategory ? `Tambah Data ke ${activeCategory.name}` : 'Tambah Data Baru'}
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>
                    {selectedMainMenuId === 'menu-gambar'
                      ? '+ TAMBAH GAMBAR'
                      : selectedMainMenuId === 'menu-link-bookmark'
                      ? '+ BUAT BOX BOOKMARK'
                      : '+ ADD KATA PK'}
                  </span>
                </button>

              </div>

            </div>

            {/* CARD GRID LAYOUT */}
            {sortedTemplates.length === 0 ? (
              <div className="bg-[#121322] border border-[#23253b] rounded-2xl p-12 text-center space-y-4 shadow-xl">
                <FolderOpen className="w-12 h-12 text-lime-400/50 mx-auto" />
                <h3 className="text-lg font-bold text-lime-400">
                  {selectedMainMenuId === 'menu-gambar'
                    ? 'Tidak Ada Gambar Ditemukan'
                    : selectedMainMenuId === 'menu-link-bookmark'
                    ? 'Tidak Ada Link Bookmark Ditemukan'
                    : 'Tidak Ada Data PK Ditemukan'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {searchQuery
                    ? `Tidak ada data yang cocok dengan kata kunci "${searchQuery}".`
                    : activeCategory
                    ? `Belum ada data di menu "${activeCategory.name}". Klik tombol di bawah untuk memasukkan data baru.`
                    : 'Belum ada data di menu ini. Klik tombol di bawah untuk memasukkan data baru.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditItem(null);
                      setIsAddModalOpen(true);
                    }}
                    className={`inline-flex items-center gap-2 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-lg transition-all ${
                      selectedMainMenuId === 'menu-link-bookmark'
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300'
                        : 'bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>
                      {selectedMainMenuId === 'menu-gambar'
                        ? `+ TAMBAH GAMBAR ${activeCategory ? `KE ${activeCategory.name}` : ''}`
                        : selectedMainMenuId === 'menu-link-bookmark'
                        ? `+ TAMBAH BOOKMARK ${activeCategory ? `KE ${activeCategory.name}` : ''}`
                        : `+ ADD KATA PK ${activeCategory ? `KE ${activeCategory.name}` : ''}`}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategoryId(null);
                    }}
                    className="inline-flex items-center gap-2 bg-[#1c1e33] hover:bg-[#282a47] text-lime-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-lime-500/30 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tampilkan Semua Data</span>
                  </button>
                </div>
              </div>
            ) : selectedMainMenuId === 'menu-link-bookmark' ? (
              /* Vertical Stacked List of Bookmark Cards */
              <div className="space-y-3.5">
                {sortedTemplates.map((item) => (
                    <BookmarkCard
                      key={item.id}
                      item={item}
                      onCopyLink={(url) => handleCopyText(url, item.id)}
                      onEdit={(item) => {
                        setEditItem(item);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={handleDeleteTemplate}
                      onUpdateLinks={handleUpdateLinks}
                      copiedId={copiedId}
                    />
                  ))}
                </div>
              ) : (
              <div
                className={`grid gap-4 sm:gap-5 ${
                  isWideMode
                    ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
                }`}
              >
                {sortedTemplates.map((item) => {
                  if (item.mainMenuId === 'menu-gambar' || item.imageUrl) {
                    return (
                      <ImageCard
                        key={item.id}
                        item={item}
                        onCopyImage={(url) => handleCopyImage(url, item.id)}
                        onViewImage={(item) => setViewingImageItem(item)}
                        onEdit={(item) => {
                          setEditItem(item);
                          setIsAddModalOpen(true);
                        }}
                        onDelete={handleDeleteTemplate}
                        onTogglePin={handleTogglePin}
                        copiedId={copiedId}
                      />
                    );
                  }

                  return (
                    <TemplateCard
                      key={item.id}
                      item={item}
                      onCopy={(text) => handleCopyText(text, item.id)}
                      onEdit={(item) => {
                        setEditItem(item);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={handleDeleteTemplate}
                      onTogglePin={handleTogglePin}
                      onOpenReport={(item) => setReportItem(item)}
                      onOpenVarReplacer={(item) => setVarReplacerItem(item)}
                      copiedId={copiedId}
                    />
                  );
                })}
              </div>
            )}
            </>
            )}

          </section>

        </div>

      </main>
      </div>

      {/* MODALS */}
      <ImageLightboxModal
        isOpen={!!viewingImageItem}
        onClose={() => setViewingImageItem(null)}
        title={viewingImageItem?.title || ''}
        imageUrl={viewingImageItem?.imageUrl || ''}
        categoryName={viewingImageItem?.categoryName}
        notes={viewingImageItem?.ket}
        onCopyImage={(url) => handleCopyImage(url, viewingImageItem?.id)}
      />

      <AddEditModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTemplate}
        mainMenus={mainMenus}
        categories={categories}
        editItem={editItem}
        defaultMainMenuId={selectedMainMenuId}
        defaultCategoryId={selectedCategoryId}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        mainMenus={mainMenus}
        categories={categories}
        selectedMainMenuId={selectedMainMenuId}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
        categoryCounts={categoryCounts}
        onAddMainMenu={handleAddMainMenu}
        onUpdateMainMenu={handleUpdateMainMenu}
        onDeleteMainMenu={handleDeleteMainMenu}
        onClearAllCustomData={handleClearAllCustomData}
      />

      <ReportModal
        isOpen={reportItem !== null}
        onClose={() => setReportItem(null)}
        template={reportItem}
        reports={reports}
        onAddReport={handleAddReport}
      />

      <VariableReplacerModal
        isOpen={varReplacerItem !== null}
        onClose={() => setVarReplacerItem(null)}
        template={varReplacerItem}
        onCopy={(text) => handleCopyText(text)}
      />

      <PhpSqlModal
        isOpen={isPhpSqlModalOpen}
        onClose={() => setIsPhpSqlModalOpen(false)}
        categories={categories}
        templates={templates}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSuccessToast={(msg) => addToast(msg, 'success')}
      />

      {/* TOAST NOTIFICATION CONTAINER */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

    </div>
  );
}
