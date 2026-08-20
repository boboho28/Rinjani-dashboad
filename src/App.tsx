import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MainMenuItem, CategoryItem, ReportItem, SortOption, TemplateItem, PasaranItem } from './types';
import { INITIAL_MAIN_MENUS } from './data/initialData';
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
import { AuthModal } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { copyImageToClipboard } from './utils/copyImage';
import { subscribeToAppData, saveAppDataToFirestore, subscribeAuthState, UserProfile } from './lib/firebase';
import { RotateCw, FolderOpen, Sparkles, CloudCheck, ShieldAlert, WifiOff } from 'lucide-react';

export default function App() {
  // --- States Dasar ---
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pasaranList, setPasaranList] = useState<PasaranItem[]>([]);
  const [tickerText, setTickerText] = useState("DASHBOARD RINJANI AKTIF - SINKRONISASI CLOUD");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);

  // --- UI States ---
  const [selectedMainMenuId, setSelectedMainMenuId] = useState<string | null>(() => {
    return localStorage.getItem('rinjani_last_main_menu') || 'menu-pk-live-chat';
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    return localStorage.getItem('rinjani_last_category') || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

  // --- Modals ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TemplateItem | null>(null);
  const [viewingImageItem, setViewingImageItem] = useState<TemplateItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- 1. SINKRONISASI AWAL ---
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    const unsubAuth = subscribeAuthState((profile) => {
      setCurrentUser(profile);
      if (!profile) {
        setIsLoading(false);
      }
    });
    
    const unsubData = subscribeToAppData((cloudData) => {
      if (cloudData) {
        setCategories(cloudData.categories || []);
        setTemplates(cloudData.templates || []);
        setReports(cloudData.reports || []);
        setPasaranList(cloudData.pasaranList || []);
        setTickerText(cloudData.tickerText || "RINJANI DASHBOARD SYSTEM");
      }
      setIsLoading(false);
      setHasInitialLoaded(true);
      clearTimeout(safetyTimer);
    });

    return () => { 
      unsubAuth(); 
      unsubData(); 
      clearTimeout(safetyTimer);
    };
  }, []);

  // --- 2. FUNGSI SIMPAN PAKSA (FORCE SYNC) ---
  const forceSync = async (overrides: Partial<{
    categories: any[], 
    templates: any[], 
    pasaranList: any[], 
    tickerText: string
  }>) => {
    if (!currentUser || !hasInitialLoaded) return;
    
    setIsSaving(true);
    try {
      await saveAppDataToFirestore({
        categories: overrides.categories !== undefined ? overrides.categories : categories,
        templates: overrides.templates !== undefined ? overrides.templates : templates,
        reports: reports,
        pasaranList: overrides.pasaranList !== undefined ? overrides.pasaranList : pasaranList,
        tickerText: overrides.tickerText !== undefined ? overrides.tickerText : tickerText
      });
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  // --- Handlers UI ---
  useEffect(() => {
    if (selectedMainMenuId) localStorage.setItem('rinjani_last_main_menu', selectedMainMenuId);
    if (selectedCategoryId) localStorage.setItem('rinjani_last_category', selectedCategoryId);
  }, [selectedMainMenuId, selectedCategoryId]);

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Teks berhasil disalin!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplate = async (data: any, id?: string) => {
    const now = new Date().toISOString();
    let updated;
    if (id) {
      updated = templates.map(t => t.id === id ? { ...t, ...data, updatedAt: now } : t);
    } else {
      const newItem = { ...data, id: 'tpl-' + Date.now(), createdAt: now, updatedAt: now };
      updated = [newItem, ...templates];
    }
    setTemplates(updated);
    await forceSync({ templates: updated });
    addToast('Data tersimpan aman di Cloud.', 'success');
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Hapus data ini selamanya?')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      await forceSync({ templates: updated });
      addToast('Data terhapus.', 'info');
    }
  };

  // FUNGSI PIN UNTUK TEMPLATE/IMAGE
  const handleTogglePinTemplate = async (id: string) => {
    const updated = templates.map(t => 
      t.id === id ? { ...t, isPinned: !t.isPinned, updatedAt: new Date().toISOString() } : t
    );
    setTemplates(updated);
    await forceSync({ templates: updated });
    const isNowPinned = updated.find(t => t.id === id)?.isPinned;
    addToast(isNowPinned ? 'Item disematkan ke atas.' : 'Pin dilepaskan.', 'info');
  };

  const handleAddCategory = async (catData: any) => {
    const newCat = { ...catData, id: 'cat-' + Date.now(), order: categories.length + 1 };
    const updated = [...categories, newCat];
    setCategories(updated);
    await forceSync({ categories: updated });
    addToast('Sub-Menu tersimpan.', 'success');
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Hapus sub-menu? Semua data di dalamnya ikut terhapus.')) {
      const updatedCats = categories.filter(c => c.id !== id);
      const updatedTpls = templates.filter(t => t.categoryId !== id);
      setCategories(updatedCats);
      setTemplates(updatedTpls);
      await forceSync({ categories: updatedCats, templates: updatedTpls });
      addToast('Sub-Menu terhapus.', 'info');
    }
  };

  const handleUpdatePasaranList = async (update: PasaranItem[] | ((prev: PasaranItem[]) => PasaranItem[])) => {
    let nextList: PasaranItem[];
    if (typeof update === 'function') {
      nextList = update(pasaranList);
    } else {
      nextList = update;
    }
    setPasaranList(nextList);
    await forceSync({ pasaranList: nextList });
  };

  // --- LOGIKA FILTER + SORTING (PIN DI ATAS) ---
  const filteredTemplates = useMemo(() => {
    // 1. Lakukan Filter dulu
    const filtered = templates.filter((item) => {
      if (selectedMainMenuId && item.mainMenuId !== selectedMainMenuId) return false;
      if (selectedCategoryId && item.categoryId !== selectedCategoryId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.ket.toLowerCase().includes(q);
      }
      return true;
    });

    // 2. Lakukan Sorting (Pinned item selalu di atas)
    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Jika status pin sama, urutkan berdasarkan waktu update terbaru
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }, [templates, selectedMainMenuId, selectedCategoryId, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0c14] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <RotateCw className="w-24 h-24 text-[#ccff00] animate-spin opacity-20" />
            <RotateCw className="w-24 h-24 text-[#ccff00] animate-spin absolute top-0 left-0" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-[#ccff00] font-brand font-black text-xl tracking-widest animate-pulse uppercase">Menghubungkan Database...</h1>
          <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em]">Rinjani Cloud System v2.0</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c14] text-slate-100 font-sans pb-16 relative">
      
      <Sidebar
        mainMenus={INITIAL_MAIN_MENUS}
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

      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-16 sm:ml-20' : 'ml-72 sm:ml-80'}`}>
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddModal={() => { setEditItem(null); setIsAddModalOpen(true); }}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          onOpenPhpSqlModal={() => {}} 
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          isWideMode={true}
          setIsWideMode={() => {}}
          onExportBackup={() => {}}
          onImportBackup={() => {}}
        />

        <TickerBar tickerText={tickerText} setTickerText={(txt) => { setTickerText(txt); forceSync({ tickerText: txt }); }} />

        <main className="w-full pt-5 px-6">
          {!currentUser ? (
             <div className="bg-[#121322] border-2 border-amber-500/50 rounded-3xl p-16 text-center space-y-5 shadow-2xl mt-10">
                <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
                <h2 className="text-3xl font-black text-amber-400 font-brand uppercase tracking-tighter">DATABASE TERKUNCI</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">Masuk untuk melihat dan menyimpan data Anda ke Cloud secara permanen.</p>
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-black px-12 py-4 rounded-2xl font-black transition-all transform active:scale-95 shadow-lg">LOGIN SEKARANG</button>
             </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {selectedMainMenuId !== 'menu-dashboard-result' && (
                <SubMenuBar
                  categories={categories.filter(c => c.mainMenuId === selectedMainMenuId)}
                  selectedCategoryId={selectedCategoryId}
                  onSelectCategory={setSelectedCategoryId}
                  categoryCounts={{}}
                  totalCount={filteredTemplates.length}
                  mainMenuName={INITIAL_MAIN_MENUS.find(m => m.id === selectedMainMenuId)?.name || ''}
                  onAddSubMenu={(name, color) => handleAddCategory({ name, color, mainMenuId: selectedMainMenuId })}
                  onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
                  onAddPkForCategory={() => setIsAddModalOpen(true)}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}

              <section className="flex-1 space-y-5">
                {selectedMainMenuId === 'menu-dashboard-result' ? (
                  <DashboardResultView 
                    pasaranList={pasaranList} 
                    setPasaranList={handleUpdatePasaranList} 
                    addToast={addToast} 
                  />
                ) : (
                  <>
                    <div className="bg-[#121322] border border-[#23253b] rounded-2xl p-5 flex justify-between items-center shadow-lg">
                      <h2 className="text-2xl font-black text-[#ccff00] uppercase tracking-tight font-brand">
                        {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'RINGKASAN DATA'}
                      </h2>
                      <button onClick={() => { setEditItem(null); setIsAddModalOpen(true); }} className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 px-6 py-3 rounded-xl font-black text-xs shadow-md transition-all active:scale-95 uppercase">
                        + Tambah Data Baru
                      </button>
                    </div>

                    {filteredTemplates.length === 0 ? (
                      <div className="p-24 text-center bg-[#0e0f1d] rounded-3xl border-2 border-dashed border-slate-800 shadow-inner">
                        <FolderOpen className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest italic">Belum Ada Data Tersimpan.</p>
                      </div>
                    ) : (
                      <div className={`grid gap-5 grid-cols-1 md:grid-cols-2 ${
                        selectedMainMenuId === 'menu-link-bookmark' 
                          ? (isSidebarCollapsed ? 'xl:grid-cols-3 lg:grid-cols-2' : 'xl:grid-cols-2 lg:grid-cols-2') 
                          : (isSidebarCollapsed ? 'xl:grid-cols-5 lg:grid-cols-4' : 'xl:grid-cols-4 lg:grid-cols-3')
                      }`}>
                        {filteredTemplates.map((item) => (
                          item.mainMenuId === 'menu-gambar' || item.imageUrl ? (
                            <ImageCard 
                              key={item.id} 
                              item={item} 
                              onCopyImage={(url) => copyImageToClipboard(url)} 
                              onViewImage={setViewingImageItem} 
                              onEdit={(item) => { setEditItem(item); setIsAddModalOpen(true); }} 
                              onDelete={handleDeleteTemplate} 
                              onTogglePin={handleTogglePinTemplate} 
                              copiedId={copiedId} 
                            />
                          ) : item.mainMenuId === 'menu-link-bookmark' ? (
                            <BookmarkCard 
                              key={item.id} 
                              item={item} 
                              onCopyLink={(txt) => navigator.clipboard.writeText(txt)} 
                              onEdit={(item) => { setEditItem(item); setIsAddModalOpen(true); }} 
                              onDelete={handleDeleteTemplate} 
                              onUpdateLinks={async (id, links) => { const up = templates.map(t => t.id === id ? { ...t, links } : t); setTemplates(up); await forceSync({templates: up}); }} 
                              copiedId={copiedId} 
                            />
                          ) : (
                            <TemplateCard 
                              key={item.id} 
                              item={item} 
                              onCopy={(txt) => handleCopyText(txt, item.id)} 
                              onEdit={(item) => { setEditItem(item); setIsAddModalOpen(true); }} 
                              onDelete={handleDeleteTemplate} 
                              onTogglePin={handleTogglePinTemplate} 
                              copiedId={copiedId} 
                            />
                          )
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          )}
        </main>
      </div>

      <AddEditModal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setEditItem(null); }} onSave={handleSaveTemplate} mainMenus={INITIAL_MAIN_MENUS} categories={categories} editItem={editItem} defaultMainMenuId={selectedMainMenuId} defaultCategoryId={selectedCategoryId} />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} mainMenus={INITIAL_MAIN_MENUS} categories={categories} selectedMainMenuId={selectedMainMenuId} onAddCategory={handleAddCategory} onUpdateCategory={() => {}} onDeleteCategory={handleDeleteCategory} categoryCounts={{}} />
      <ImageLightboxModal isOpen={!!viewingImageItem} onClose={() => setViewingImageItem(null)} title={viewingImageItem?.title || ''} imageUrl={viewingImageItem?.imageUrl || ''} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} currentUser={currentUser} onSuccessToast={(msg) => addToast(msg, 'success')} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
