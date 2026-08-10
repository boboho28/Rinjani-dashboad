import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MainMenuItem, CategoryItem, ReportItem, SortOption, TemplateItem, PasaranItem } from './types';
import { INITIAL_MAIN_MENUS, INITIAL_PASARAN_LIST } from './data/initialData';
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
} from 'lucide-react';

export default function App() {
  // --- UI States ---
  const [mainMenus, setMainMenus] = useState<MainMenuItem[]>(INITIAL_MAIN_MENUS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pasaranList, setPasaranList] = useState<PasaranItem[]>(INITIAL_PASARAN_LIST);
  const [tickerText, setTickerText] = useState("Selamat Datang di RINJANI SYSTEM");
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMainMenuId, setSelectedMainMenuId] = useState<string | null>('menu-pk-live-chat');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('terbaru');
  const [isWideMode, setIsWideMode] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

  // --- Auth & Modals ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TemplateItem | null>(null);
  const [viewingImageItem, setViewingImageItem] = useState<TemplateItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPhpSqlModalOpen, setIsPhpSqlModalOpen] = useState(false);
  const [reportItem, setReportItem] = useState<TemplateItem | null>(null);
  const [varReplacerItem, setVarReplacerItem] = useState<TemplateItem | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isRemoteUpdate = useRef(false);

  // --- Realtime Sync Logic ---
  useEffect(() => {
    const unsubAuth = subscribeAuthState((profile) => setCurrentUser(profile));
    
    // Berlangganan data GLOBAL
    const unsubData = subscribeToAppData((cloudData) => {
      if (cloudData) {
        isRemoteUpdate.current = true;
        if (cloudData.categories) setCategories(cloudData.categories);
        if (cloudData.templates) setTemplates(cloudData.templates);
        if (cloudData.reports) setReports(cloudData.reports);
        if (cloudData.pasaranList) setPasaranList(cloudData.pasaranList);
        if (cloudData.tickerText) setTickerText(cloudData.tickerText);
        setIsLoading(false);
        setTimeout(() => { isRemoteUpdate.current = false; }, 500);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubData();
    };
  }, []);

  // Simpan data ke Firebase saat ada perubahan lokal
  useEffect(() => {
    if (isLoading || isRemoteUpdate.current) return;

    const timeout = setTimeout(() => {
      saveAppDataToFirestore({
        mainMenus,
        categories,
        templates,
        reports,
        pasaranList,
        tickerText
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [categories, templates, reports, pasaranList, tickerText]);

  // --- Handlers ---
  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCopyText = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) setCopiedId(id);
    addToast('Teks berhasil disalin!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyImage = async (imageUrl: string, id?: string) => {
    if (id) setCopiedId(id);
    const success = await copyImageToClipboard(imageUrl);
    addToast(success ? 'Gambar berhasil disalin!' : 'Link gambar disalin.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplate = (data: any, id?: string) => {
    const now = new Date().toISOString();
    if (id) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: now } : t));
    } else {
      const newItem = { ...data, id: 'tpl-' + Date.now(), createdAt: now, updatedAt: now };
      setTemplates(prev => [newItem, ...prev]);
    }
    addToast('Data berhasil disimpan ke Cloud!', 'success');
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Hapus data ini?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      addToast('Data dihapus.', 'info');
    }
  };

  const handleTogglePin = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
  };

  const handleAddCategory = (catData: any) => {
    const newCat = { ...catData, id: 'cat-' + Date.now(), order: categories.length + 1 };
    setCategories(prev => [...prev, newCat]);
    addToast('Sub-Menu berhasil dibuat!', 'success');
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Hapus sub-menu ini? Semua data di dalamnya akan hilang.')) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setTemplates(prev => prev.filter(t => t.categoryId !== id));
      addToast('Sub-Menu dihapus.', 'info');
    }
  };

  // --- Filtering ---
  const filteredTemplates = useMemo(() => {
    return templates.filter((item) => {
      if (selectedMainMenuId && item.mainMenuId !== selectedMainMenuId) return false;
      if (selectedCategoryId && item.categoryId !== selectedCategoryId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.ket.toLowerCase().includes(q);
      }
      return true;
    });
  }, [templates, selectedMainMenuId, selectedCategoryId, searchQuery]);

  const sortedTemplates = useMemo(() => {
    return [...filteredTemplates].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return sortBy === 'terbaru' 
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [filteredTemplates, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0c14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <RotateCw className="w-12 h-12 text-lime-400 animate-spin mx-auto" />
          <p className="text-lime-400 font-brand font-black animate-pulse">MENYINKRONKAN DATABASE CLOUD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c14] text-slate-100 font-sans pb-16 relative">
      <Sidebar
        mainMenus={mainMenus}
        selectedMainMenuId={selectedMainMenuId}
        onSelectMainMenu={(id) => { setSelectedMainMenuId(id); setSelectedCategoryId(null); }}
        mainMenuCounts={{}}
        totalCount={templates.length}
        pinnedCount={0}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-80'}`}>
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddModal={() => { setEditItem(null); setIsAddModalOpen(true); }}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          onOpenPhpSqlModal={() => setIsPhpSqlModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          isWideMode={isWideMode}
          setIsWideMode={setIsWideMode}
          onExportBackup={() => {}}
          onImportBackup={() => {}}
        />

        <TickerBar 
          tickerText={tickerText} 
          setTickerText={setTickerText} 
        />

        <main className="w-full pt-5 px-6">
          <div className="flex flex-col md:flex-row gap-6">
            {selectedMainMenuId !== 'menu-dashboard-result' && (
              <SubMenuBar
                categories={categories.filter(c => c.mainMenuId === selectedMainMenuId)}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
                categoryCounts={{}}
                totalCount={filteredTemplates.length}
                mainMenuName={mainMenus.find(m => m.id === selectedMainMenuId)?.name || ''}
                onAddSubMenu={(name, color) => handleAddCategory({ name, color, mainMenuId: selectedMainMenuId })}
                onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
                onAddPkForCategory={() => setIsAddModalOpen(true)}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            <section className="flex-1 space-y-5">
              {selectedMainMenuId === 'menu-dashboard-result' ? (
                <DashboardResultView pasaranList={pasaranList} setPasaranList={setPasaranList} addToast={addToast} />
              ) : (
                <>
                  <div className="bg-[#121322] border border-[#23253b] rounded-2xl p-5 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-lime-400 uppercase">
                      {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'SEMUA DATA'}
                    </h2>
                    <div className="flex gap-3">
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-[#181a2c] border border-[#262842] rounded-xl px-3 py-2 text-xs text-white">
                        <option value="terbaru">Terbaru</option>
                        <option value="terlama">Terlama</option>
                      </select>
                      <button onClick={() => setIsAddModalOpen(true)} className="bg-lime-400 text-slate-950 px-4 py-2 rounded-xl font-black text-xs shadow-lg shadow-lime-900/20">
                        + TAMBAH DATA
                      </button>
                    </div>
                  </div>

                  {sortedTemplates.length === 0 ? (
                    <div className="p-20 text-center bg-[#121322] rounded-2xl border border-dashed border-slate-700">
                      <FolderOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">Belum ada data di sini.</p>
                    </div>
                  ) : (
                    <div className={`grid gap-5 ${isWideMode ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                      {sortedTemplates.map((item) => (
                        item.mainMenuId === 'menu-gambar' || item.imageUrl ? (
                          <ImageCard key={item.id} item={item} onCopyImage={handleCopyImage} onViewImage={setViewingImageItem} onEdit={setEditItem} onDelete={handleDeleteTemplate} onTogglePin={handleTogglePin} copiedId={copiedId} />
                        ) : item.mainMenuId === 'menu-link-bookmark' ? (
                          <BookmarkCard key={item.id} item={item} onCopyLink={handleCopyText} onEdit={setEditItem} onDelete={handleDeleteTemplate} onUpdateLinks={(id, links) => setTemplates(prev => prev.map(t => t.id === id ? { ...t, links } : t))} copiedId={copiedId} />
                        ) : (
                          <TemplateCard key={item.id} item={item} onCopy={handleCopyText} onEdit={setEditItem} onDelete={handleDeleteTemplate} onTogglePin={handleTogglePin} copiedId={copiedId} />
                        )
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      <AddEditModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveTemplate} mainMenus={mainMenus} categories={categories} editItem={editItem} defaultMainMenuId={selectedMainMenuId} defaultCategoryId={selectedCategoryId} />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} mainMenus={mainMenus} categories={categories} selectedMainMenuId={selectedMainMenuId} onAddCategory={handleAddCategory} onUpdateCategory={() => {}} onDeleteCategory={handleDeleteCategory} categoryCounts={{}} />
      <ImageLightboxModal isOpen={!!viewingImageItem} onClose={() => setViewingImageItem(null)} title={viewingImageItem?.title || ''} imageUrl={viewingImageItem?.imageUrl || ''} onCopyImage={handleCopyImage} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} currentUser={currentUser} onSuccessToast={(msg) => addToast(msg, 'success')} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
