import React from 'react';
import { Search, UserCheck, UserPlus, Maximize2, Minimize2 } from 'lucide-react';
import { UserProfile } from '../lib/firebase';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAddModal: () => void;
  onOpenCategoryModal: () => void;
  onOpenPhpSqlModal: () => void;
  onOpenAuthModal?: () => void;
  currentUser?: UserProfile | null;
  isWideMode: boolean;
  setIsWideMode: (wide: boolean | ((prev: boolean) => boolean)) => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onOpenCategoryModal,
  onOpenPhpSqlModal,
  onOpenAuthModal,
  currentUser,
  isWideMode,
  setIsWideMode,
  onExportBackup,
  onImportBackup,
}) => {
  return (
    <header id="header-container" className="bg-[#0b0c14] border-b border-[#1f2133] sticky top-0 z-40 px-4 py-3 shadow-lg">
      <div className="w-full mx-auto px-2 sm:px-4 transition-all duration-300 flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#ccff00] flex items-center justify-center font-black text-slate-950 text-2xl shadow-[0_0_20px_rgba(204,255,0,0.5)] border border-[#e5ff80] shrink-0 font-brand">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-[#ccff00] font-brand drop-shadow-[0_0_10px_rgba(204,255,0,0.35)]">
                  RINJANI DASHBOARD
                </h1>
                <span className="bg-[#ccff00] text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(204,255,0,0.3)] font-brand">
                  PRO SYSTEM
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Penyimpanan PK, Kata-Kata & Data Operasional
              </p>
            </div>
          </div>

          {/* Quick Layout Toggle for Mobile/Tablet */}
          <button
            onClick={() => setIsWideMode((prev) => !prev)}
            title={isWideMode ? 'Modus Standar' : 'Lebarkan Layout Full Width'}
            className="lg:hidden text-slate-400 hover:text-lime-400 bg-[#161826] p-2 rounded-lg border border-[#26283d] transition-colors"
          >
            {isWideMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Center & Right Search and Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto justify-end">
          
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-72 md:w-80 lg:w-96 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata-kata / PK / info..."
              className="w-full bg-[#131522] border border-[#26283d] focus:border-lime-400 focus:ring-1 focus:ring-lime-400/50 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-lime-400 bg-[#1c1e30] px-1.5 py-0.5 rounded"
              >
                Clear
              </button>
            )}
          </div>

          {/* User Account / Auth Button */}
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              title="Sistem Akun & Data Pengguna Terdaftar"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[#161829] hover:bg-[#1e2138] text-[#ccff00] border border-[#ccff00]/40 transition-all shadow-[0_0_15px_rgba(204,255,0,0.15)] cursor-pointer shrink-0"
            >
              {currentUser ? (
                <>
                  <UserCheck className="w-4 h-4 text-[#ccff00]" />
                  <span className="max-w-[120px] sm:max-w-[160px] truncate">{currentUser.displayName || currentUser.email}</span>
                  <span className="text-[9px] bg-[#ccff00] text-slate-950 font-mono px-1.5 py-0.2 rounded font-bold">
                    ONLINE
                  </span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#ccff00]" />
                  <span>Daftar / Login Akun</span>
                </>
              )}
            </button>
          )}

        </div>
      </div>
    </header>
  );
};

