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
  // --- UI States (Inisialisasi Kosong [] Agar Tidak Ada Data Hantu) ---
  const [mainMenus] = useState<MainMenuItem[]>(INITIAL_MAIN_MENUS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [pasaranList, setPasaranList] = useState<PasaranItem[]>([]);
  const [tickerText, setTickerText] = useState("DASHBOARD AKTIF - SILAKAN LOGIN UNTUK SYNC DATA");
  
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

  // Mencegah Overwrite Data saat pertama kali load
  const isInitialLoadRef = useRef(true);

  // --- 1. SINKRONISASI REALTIME FIREBASE ---
  useEffect(() => {
    const unsubAuth = subscribeAuthState((profile) => setCurrentUser(profile));
    
    const unsubData = subscribeToAppData((cloudData) => {
      if (cloudData) {
        // Hanya update jika data di cloud memang ada
        setCategories(cloudData.categories || []);
        setTemplates(cloudData.templates || []);
        setReports(cloudData.reports || []);
        setPasaranList(cloudData.pasaranList || []);
        setTickerText(cloudData.tickerText || "RINJANI SYSTEM CONNECTED");
      }
      setIsLoading(false);
      isInitialLoadRef.current = false;
    });

    return () => { unsubAuth(); unsubData(); };
  }, []);

  // --- 2. FUNGSI SIMPAN GLOBAL KE FIREBASE ---
  const syncToCloud = async (newData: any) => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await saveAppDataToFirestore({
        categories: newData.categories || categories,
        templates: newData.templates || templates,
        reports: newData.reports || reports,
        pasaranList: newData.pasaranList || pasaranList,
        tickerText: newData.tickerText || tickerText
      });
    } catch (e) {
      console.error("Cloud Sync Failed");
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  // Auto-save untuk Ticker Text saja (karena diketik)
  useEffect(() => {
    if (isInitialLoadRef.current || !currentUser) return;
    const timer = setTimeout(() => syncToCloud({}), 3000);
    return () => clearTimeout(timer);
  }, [tickerText]);

  // --- Toast Handlers ---
  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- Action Handlers (Sekarang Memanggil syncToCloud secara instan) ---
  const handleSaveTemplate = (data: any, id?: string) => {
    const now = new Date().toISOString();
    let updatedTemplates;
    if (id) {
      updatedTemplates = templates.map(t => t.id === id ? { ...t, ...data, updatedAt: now } : t);
    } else {
      const newItem = { ...data, id: 'tpl-' + Date.now(), createdAt: now, updatedAt: now };
      updatedTemplates = [newItem, ...templates];
    }
    setTemplates(updatedTemplates);
    syncToCloud({ templates: updatedTemplates }); // Langsung Simpan
    addToast('Berhasil disimpan ke Cloud!', 'success');
  };

  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Hapus data ini secara permanen dari Cloud?')) {
      const updated = templates.filter(t => t.id !== id);
      setTemplates(updated);
      syncToCloud({ templates: updated }); // Langsung Simpan
      addToast('Data Cloud terhapus.', 'info');
    }
  };

  const handleAddCategory = (catData: any) => {
    const newCat = { ...catData, id: 'cat-' + Date.now(), order: categories.length + 1 };
    const updated = [...categories, newCat];
    setCategories(updated);
    syncToCloud({ categories: updated }); // Langsung Simpan
    addToast('Sub-Menu Baru dibuat.', 'success');
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Hapus sub-menu ini? Data di dalamnya akan ikut terhapus.')) {
      const updatedCats = categories.filter(c => c.id !== id);
      const updatedTpls = templates.filter(t => t.categoryId !== id);
      setCategories(updatedCats);
      setTemplates(updatedTpls);
      syncToCloud({ categories: updatedCats, templates: updatedTpls }); // Langsung Simpan
      addToast('Sub-Menu terhapus.', 'info');
    }
  };

  // Handler khusus untuk Pasaran (Shortcut Result)
  const updatePasaranListWithSync = (newList: PasaranItem[]) => {
    setPasaranList(newList);
    syncToCloud({ pasaranList: newList });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b0c14] flex items-center justify-center">
        <div className="text-center space-y-6">
          <RotateCw className="w-16 h-16 text-[#ccff00] animate-spin mx-auto" />
          <h1 className="text-[#ccff00] font-brand font-black text-xl tracking-widest animate-pulse uppercase">Sinkronisasi Database Cloud...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c14] text-slate-100 font-sans pb-16 relative">
      
      {/* Indikator Realtime Cloud Status */}
      <div className="fixed bottom-5 left-5 z-50 flex items-center gap-2">
        {isSaving ? (
           <div className="bg-black/80 border border-[#ccff00]/50 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold text-[#ccff00] shadow-lg">
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>SEDANG MENYIMPAN...</span>
           </div>
        ) : (
          currentUser && (
            <div className="bg-[#ccff00]/10 border border-[#ccff00]/30 px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-bold text-[#ccff00] shadow-sm">
              <CloudCheck className="w-3 h-3" />
              <span>DATABASE CLOUD TERHUBUNG</span>
            </div>
          )
        )}
      </div>

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
          onOpenPhpSqlModal={() => {}} 
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
          isWideMode={true}
          setIsWideMode={() => {}}
          onExportBackup={() => {}}
          onImportBackup={() => {}}
        />

        <TickerBar tickerText={tickerText} setTickerText={setTickerText} />

        <main className="w-full pt-5 px-6">
          {!currentUser ? (
             <div className="bg-[#121322] border-2 border-amber-500/50 rounded-3xl p-16 text-center space-y-5 shadow-2xl mt-10">
                <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
                <h2 className="text-2xl font-black text-amber-400 font-brand uppercase tracking-tighter">DATABASE TERKUNCI</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">Data hanya bisa diakses dan disimpan setelah Anda masuk ke sistem.</p>
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-amber-500 hover:bg-amber-400 text-black px-10 py-3.5 rounded-2xl font-black transition-all transform active:scale-95 shadow-lg">DAFTAR / LOGIN</button>
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
                  <DashboardResultView pasaranList={pasaranList} setPasaranList={updatePasaranListWithSync} addToast={addToast} />
                ) : (
                  <>
                    <div className="bg-[#121322] border border-[#23253b] rounded-2xl p-5 flex justify-between items-center shadow-lg">
                      <h2 className="text-2xl font-black text-[#ccff00] uppercase tracking-tight font-brand">
                        {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'DATABASE KESELURUHAN'}
                      </h2>
                      <button onClick={() => { setEditItem(null); setIsAddModalOpen(true); }} className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all active:scale-95">
                        + INPUT DATA BARU
                      </button>
                    </div>

                    {filteredTemplates.length === 0 ? (
                      <div className="p-24 text-center bg-[#121322] rounded-2xl border-2 border-dashed border-slate-800">
                        <FolderOpen className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest italic">Belum Ada Data. Silakan Tambah Data Baru.</p>
                      </div>
                    ) : (
                      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                        {filteredTemplates.map((item) => (
                          item.mainMenuId === 'menu-gambar' || item.imageUrl ? (
                            <ImageCard key={item.id} item={item} onCopyImage={(url) => copyImageToClipboard(url)} onViewImage={setViewingImageItem} onEdit={setEditItem} onDelete={handleDeleteTemplate} onTogglePin={(id) => { const updated = templates.map(t => t.id === id ? {...t, isPinned: !t.isPinned} : t); setTemplates(updated); syncToCloud({templates: updated}); }} copiedId={copiedId} />
                          ) : item.mainMenuId === 'menu-link-bookmark' ? (
                            <BookmarkCard key={item.id} item={item} onCopyLink={(txt) => handleCopyText(url)} onEdit={setEditItem} onDelete={handleDeleteTemplate} onUpdateLinks={(id, links) => { const updated = templates.map(t => t.id === id ? { ...t, links } : t); setTemplates(updated); syncToCloud({templates: updated}); }} copiedId={copiedId} />
                          ) : (
                            <TemplateCard key={item.id} item={item} onCopy={(txt) => handleCopyText(txt, item.id)} onEdit={setEditItem} onDelete={handleDeleteTemplate} onTogglePin={(id) => { const updated = templates.map(t => t.id === id ? {...t, isPinned: !t.isPinned} : t); setTemplates(updated); syncToCloud({templates: updated}); }} copiedId={copiedId} />
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
      <ImageLightboxModal isOpen={!!viewingImageItem} onClose={() => setViewingImageItem(null)} title={viewingImageItem?.title || ''} imageUrl={viewingImageItem?.imageUrl || ''} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} currentUser={currentUser} onSuccessToast={(msg) => addToast(msg, 'success')} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
