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
import { RotateCw, FolderOpen, Sparkles, CloudCheck } from 'lucide-react';

export default function App() {
  // --- UI States ---
  const [mainMenus] = useState<MainMenuItem[]>(INITIAL_MAIN_MENUS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pasaranList, setPasaranList] = useState<PasaranItem[]>([]);
  const [tickerText, setTickerText] = useState("SELAMAT DATANG DI RINJANI DASHBOARD - SILAKAN INPUT DATA ANDA");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- Menu Persistence ---
  const [selectedMainMenuId, setSelectedMainMenuId] = useState<string | null>(() => {
    return localStorage.getItem('rinjani_last_main_menu') || 'menu-pk-live-chat';
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    return localStorage.getItem('rinjani_last_category') || null;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy] = useState<SortOption>('terbaru');
  const [isWideMode, setIsWideMode] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

  // --- Auth & Modals ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<TemplateItem | null>(null);
  const [viewingImageItem, setViewingImageItem] = useState<TemplateItem | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Flags to prevent accidental data overwrites
  const isInitialLoadRef = useRef(true);

  // --- 1. REALTIME FETCH DARI FIREBASE ---
  useEffect(() => {
    // Pantau status Login
    const unsubAuth = subscribeAuthState((profile) => {
      setCurrentUser(profile);
    });
    
    // Pantau perubahan Data di Cloud
    const unsubData = subscribeToAppData((cloudData) => {
      if (cloudData) {
        setCategories(cloudData.categories || []);
        setTemplates(cloudData.templates || []);
        setReports(cloudData.reports || []);
        setPasaranList(cloudData.pasaranList || []);
        setTickerText(cloudData.tickerText || "RINJANI DASHBOARD ACTIVE");
      }
      setIsLoading(false);
      isInitialLoadRef.current = false; // Setel ke false setelah data pertama masuk
    });

    return () => { 
      unsubAuth(); 
      unsubData(); 
    };
  }, []);

  // --- 2. AUTO-SAVE KE FIREBASE SETIAP ADA PERUBAHAN ---
  useEffect(() => {
    // Jangan simpan jika sedang loading awal atau user belum login
    if (isInitialLoadRef.current || !currentUser) return;

    const performSync = async () => {
      setIsSaving(true);
      try {
        await saveAppDataToFirestore({
          categories,
          templates,
          reports,
          pasaranList,
          tickerText
        });
        console.log("Cloud Updated.");
      } catch (e) {
        console.error("Sync Error");
      } finally {
        // Beri jeda sedikit agar indikator saving terlihat
        setTimeout(() => setIsSaving(false), 800);
      }
    };

    // Debounce: Tunggu 2 detik diam baru simpan (menghemat kuota Firebase)
    const timer = setTimeout(performSync, 2000);
    return () => clearTimeout(timer);
  }, [categories, templates, reports, pasaranList, tickerText, currentUser]);

  // --- Persistence ---
  useEffect(() => {
    if (selectedMainMenuId) localStorage.setItem('rinjani_last_main_menu', selectedMainMenuId);
    if (selectedCategoryId) localStorage.setItem('rinjani_last_category', selectedCategoryId);
    else localStorage.removeItem('rinjani_last_category');
  }, [selectedMainMenuId, selectedCategoryId]);

  // --- Toast Handlers ---
  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- Action Handlers ---
  const handleCopyText = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) setCopiedId(id);
    addToast('Berhasil disalin!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyImage = async (imageUrl: string, id?: string) => {
    if (id) setCopiedId(id);
    const success = await copyImageToClipboard(imageUrl);
    addToast(success ? 'Gambar disalin!' : 'Link gambar disalin.', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveTemplate = (data: any, id?: string) => {
    const now = new Date().toISOString();
    if (id) {
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: now } : t));
      addToast('Data diperbarui.', 'success');
    } else {
      const newItem = { ...data, id: 'tpl-' + Date.now(), createdAt: now, updatedAt: now };
      setTemplates(prev => [newItem, ...prev]);
      addToast('Data ditambahkan.', 'success');
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Hapus data ini secara permanen dari Cloud?')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      addToast('Data terhapus.', 'info');
    }
  };

  const handleTogglePin = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
  };

  const handleAddCategory = (catData: any) => {
    const newCat = { ...catData, id: 'cat-' + Date.now(), order: categories.length + 1 };
    setCategories(prev => [...prev, newCat]);
    addToast('Sub-Menu dibuat.', 'success');
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Hapus sub-menu ini? Semua data di dalamnya akan ikut terhapus.')) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setTemplates(prev => prev.filter(t => t.categoryId !== id));
      addToast('Sub-Menu terhapus.', 'info');
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
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filteredTemplates]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0c14] flex items-center justify-center">
        <div className="text-center space-y-6">
          <RotateCw className="w-16 h-16 text-[#ccff00] animate-spin mx-auto" />
          <h1 className="text-[#ccff00] font-brand font-black text-xl tracking-widest animate-pulse uppercase">Menghubungkan ke Cloud...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c14] text-slate-100 font-sans pb-16 relative">
      
      {/* Indikator Cloud Sync */}
      {isSaving && (
        <div className="fixed bottom-5 left-5 z-50 bg-black/80 border border-[#ccff00]/50 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold text-[#ccff00] animate-fade-in shadow-lg">
          <RotateCw className="w-3 h-3 animate-spin" />
          <span>SINKRONISASI CLOUD...</span>
        </div>
      )}
      {!isSaving && currentUser && (
        <div className="fixed bottom-5 left-5 z-50 bg-[#ccff00]/10 border border-[#ccff00]/30 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold text-[#ccff00] shadow-sm">
          <CloudCheck className="w-3 h-3" />
          <span>CLOUD TERHUBUNG</span>
        </div>
      )}

      <Sidebar
        mainMenus={mainMenus}
        selectedMainMenuId={selectedMainMenuId}
        onSelectMainMenu={(id) => { 
          setSelectedMainMenuId(id); 
          setSelectedCategoryId(null); 
        }}
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
          onOpenPhpSqlModal={() => {}} // Nonaktifkan karena sudah Firebase
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          isWideMode={isWideMode}
          setIsWideMode={setIsWideMode}
          onExportBackup={() => {}}
          onImportBackup={() => {}}
        />

        <TickerBar tickerText={tickerText} setTickerText={setTickerText} />

        <main className="w-full pt-5 px-6">
          {!currentUser ? (
             <div className="bg-[#121322] border-2 border-amber-500/50 rounded-3xl p-16 text-center space-y-5 shadow-2xl mt-10">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
                <h2 className="text-2xl font-black text-amber-400 font-brand uppercase tracking-tighter">DATABASE TERKUNCI</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">Silakan Daftar Akun atau Login untuk mengelola data Cloud Firebase Anda sendiri.</p>
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-black px-10 py-3.5 rounded-2xl font-black transition-all transform active:scale-95 shadow-lg">MASUK / DAFTAR</button>
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
                    <div className="bg-[#121322] border border-[#23253b] rounded-2xl p-5 flex justify-between items-center shadow-lg">
                      <h2 className="text-2xl font-black text-[#ccff00] uppercase tracking-tight font-brand">
                        {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'SEMUA DATA'}
                      </h2>
                      <button onClick={() => { setEditItem(null); setIsAddModalOpen(true); }} className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95">
                        + TAMBAH DATA BARU
                      </button>
                    </div>

                    {sortedTemplates.length === 0 ? (
                      <div className="p-24 text-center bg-[#121322] rounded-2xl border-2 border-dashed border-slate-800">
                        <FolderOpen className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest italic">Belum ada data. Klik tombol Tambah di atas.</p>
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
          )}
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
