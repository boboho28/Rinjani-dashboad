import React, { useState, useEffect } from 'react';
import { MainMenuItem } from '../types';
import { UserProfile } from '../lib/firebase';
import {
  Menu,
  ChevronDown,
  DoorOpen,
  Clock,
  AlarmClock,
  DollarSign,
  Bitcoin,
  KeyRound,
  FileText,
  Trophy,
  Image as ImageIcon,
  BarChart3,
  Banknote,
  Search,
  Zap,
  Bookmark,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  mainMenus: MainMenuItem[];
  selectedMainMenuId: string | null;
  onSelectMainMenu: (id: string | null) => void;
  mainMenuCounts: Record<string, number>;
  totalCount: number;
  pinnedCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mainMenus,
  selectedMainMenuId,
  onSelectMainMenu,
  isCollapsed,
  onToggleCollapse,
  currentUser,
  onOpenAuthModal,
}) => {
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU'];
      const dayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const dayName = days[dayIndex] || 'SENIN';

      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

      const dayNum = String(now.getDate()).padStart(2, '0');
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();

      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');

      setDateString(`${dayName}, ${dayNum} ${monthName} ${year}`);
      setTimeString(`${hours}:${mins}:${secs}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getMenuEmojiAndIcon = (name: string) => {
    const u = name.toUpperCase();
    if (u.includes('SERAH') || u.includes('CHAT') || u.includes('PK')) return { emoji: '📝', Icon: FileText };
    if (u.includes('RESULT') || u.includes('DASHBOARD')) return { emoji: '🏆', Icon: Trophy };
    if (u.includes('POSTINGAN') || u.includes('GAMBAR') || u.includes('IMAGE')) return { emoji: '📁', Icon: ImageIcon };
    if (u.includes('REPORT') || u.includes('DATA')) return { emoji: '📊', Icon: BarChart3 };
    if (u.includes('USDT') || u.includes('PENCAIRAN') || u.includes('PAY')) return { emoji: '💵', Icon: Banknote };
    if (u.includes('MINERAPAY') || u.includes('SEARCH')) return { emoji: '🔍', Icon: Search };
    if (u.includes('XPAY') || u.includes('QRIS')) return { emoji: '⚡', Icon: Zap };
    if (u.includes('BOOKMARK') || u.includes('LINK')) return { emoji: '🔖', Icon: Bookmark };
    return { emoji: '📁', Icon: FileText };
  };

  return (
    <aside
      id="main-fixed-sidebar"
      className={`fixed top-0 left-0 bottom-0 z-50 bg-[#080912] border-r border-[#ccff00]/40 shadow-[0_0_35px_rgba(0,0,0,0.85)] flex flex-col justify-between transition-all duration-300 font-sans select-none overflow-y-auto custom-scrollbar ${
        isCollapsed ? 'w-16 sm:w-20' : 'w-72 sm:w-80'
      }`}
    >
      {/* FLOATING TOGGLE BUTTON (☰) ON TOP RIGHT BORDER */}
      <button
        type="button"
        onClick={onToggleCollapse}
        className={`absolute z-50 w-8 h-8 bg-[#131526] border-2 border-[#ccff00] hover:bg-[#ccff00] text-[#ccff00] hover:text-slate-950 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.6)] cursor-pointer transition-all active:scale-95 ${
          isCollapsed ? 'right-2 top-4' : 'right-3 top-4'
        }`}
        title={isCollapsed ? 'Buka Full Menu Utama' : 'Kecilkan Menu Utama'}
      >
        <Menu className="w-4 h-4 stroke-[3]" />
      </button>

      {/* TOP CONTENT AREA */}
      <div className="p-3 sm:p-4 space-y-4">
        {/* COLLAPSED MODE TOP AVATAR */}
        {isCollapsed ? (
          <div className="pt-2 text-center">
            <button
              onClick={onToggleCollapse}
              className="w-11 h-11 rounded-2xl bg-[#ccff00] text-slate-950 font-black text-xl flex items-center justify-center border-2 border-[#e5ff80] shadow-[0_0_18px_rgba(204,255,0,0.5)] mx-auto cursor-pointer hover:scale-105 transition-transform font-brand uppercase"
              title={currentUser ? `Akun: ${currentUser.displayName || currentUser.email}` : 'Klik untuk Perbesar Dashboard'}
            >
              {currentUser
                ? (currentUser.displayName ? currentUser.displayName.charAt(0) : currentUser.email.charAt(0))
                : 'R'}
            </button>
          </div>
        ) : (
          /* EXPANDED MODE TOP HEADER & PROFILE & CLOCK WIDGET */
          <div className="space-y-3.5 pr-4">
            {/* 1. Header Title */}
            <div className="pt-1 text-center">
              <h2 className="font-brand text-lg sm:text-xl font-black text-[#ccff00] tracking-wider uppercase drop-shadow-[0_0_12px_rgba(204,255,0,0.4)]">
                DASHBOARD RINJANI
              </h2>
            </div>

            {/* 2. User Profile Box */}
            <div
              onClick={onOpenAuthModal}
              className="bg-[#101222] hover:bg-[#16182e] border border-[#ccff00]/30 hover:border-[#ccff00]/60 rounded-2xl p-3 flex items-center gap-3 shadow-md transition-all cursor-pointer group"
              title="Klik untuk Kelola Akun / Login"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#ccff00] text-slate-950 font-black text-lg flex items-center justify-center border border-[#e5ff80] shadow-[0_0_12px_rgba(204,255,0,0.4)] shrink-0 font-brand uppercase">
                {currentUser
                  ? (currentUser.displayName ? currentUser.displayName.charAt(0) : currentUser.email.charAt(0))
                  : 'R'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-[#ccff00] tracking-wider uppercase truncate font-heading group-hover:text-lime-300">
                    {currentUser ? (currentUser.displayName || 'MEMBER TERDAFTAR') : 'RINJANI SYSTEM'}
                  </h3>
                  {currentUser && (
                    <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse shrink-0" title="Online" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono-code truncate">
                  {currentUser ? currentUser.email : 'system@rinjani.com'}
                </p>
              </div>
            </div>

            {/* 3. Realtime Live Clock & Quick Status Grid */}
            <div className="bg-[#101222] border border-[#ccff00]/30 rounded-2xl p-3 space-y-2.5 text-center shadow-md">
              <div className="text-[10px] font-mono-code font-bold text-slate-400 uppercase tracking-widest">
                {dateString}
              </div>

              <div className="text-2xl font-mono-code font-black text-[#ccff00] tracking-widest drop-shadow-[0_0_12px_rgba(204,255,0,0.5)]">
                {timeString}
              </div>

              <div>
                <span className="bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/40 text-[9px] font-mono-code font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-ping" />
                  <span>GMT+7 BANGKOK</span>
                </span>
              </div>

              {/* Quick Status Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1.5 border-t border-[#1a1d36]">
                <button
                  type="button"
                  onClick={() => alert('Fitur Alarm System Aktif (20:07 - LIVE)')}
                  className="bg-[#161830] hover:bg-[#1e2142] border border-[#ccff00]/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-[#ccff00] transition-all cursor-pointer group"
                  title="Alarm Notification"
                >
                  <AlarmClock className="w-3.5 h-3.5 text-[#ccff00] group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5 font-heading">ALARM</span>
                  <span className="text-[7px] text-slate-400 font-mono-code">20:07</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert('Kurs FX Live Updated!')}
                  className="bg-[#161830] hover:bg-[#1e2142] border border-[#ccff00]/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-[#ccff00] transition-all cursor-pointer group"
                  title="Rate FX Live"
                >
                  <DollarSign className="w-3.5 h-3.5 text-[#ccff00] group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5 font-heading">RATE</span>
                  <span className="text-[7px] text-slate-400 font-mono-code">FX LIVE</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert('Crypto Rate: BTC/USDT Live')}
                  className="bg-[#161830] hover:bg-[#1e2142] border border-[#ccff00]/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-[#ccff00] transition-all cursor-pointer group"
                  title="Crypto Rate"
                >
                  <Bitcoin className="w-3.5 h-3.5 text-[#ccff00] group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5 font-heading">CRYPTO</span>
                  <span className="text-[7px] text-slate-400 font-mono-code">BTC/US</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert('Generator Password Siap!')}
                  className="bg-[#161830] hover:bg-[#1e2142] border border-[#ccff00]/30 rounded-xl p-1.5 flex flex-col items-center justify-center text-[#ccff00] transition-all cursor-pointer group"
                  title="Pass Generator"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#ccff00] group-hover:scale-110 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-tighter mt-0.5 font-heading">PASS</span>
                  <span className="text-[7px] text-slate-400 font-mono-code">GENER...</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN MENU BUTTONS LIST */}
        <div className="space-y-2 pt-2">
          {!isCollapsed && (
            <div className="text-[10px] font-mono-code font-black uppercase text-[#ccff00] tracking-wider px-1 pb-1">
              MENU UTAMA (MODUL)
            </div>
          )}

          {mainMenus.map((menu) => {
            const isSelected = selectedMainMenuId === menu.id;
            const { emoji, Icon } = getMenuEmojiAndIcon(menu.name);

            if (isCollapsed) {
              return (
                <div key={menu.id} className="relative group/tooltip flex justify-center">
                  <button
                    type="button"
                    onClick={() => onSelectMainMenu(menu.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-[#ccff00] text-slate-950 border-2 border-[#e5ff80] shadow-[0_0_20px_rgba(204,255,0,0.6)] scale-105'
                        : 'bg-[#101222] hover:bg-[#181a32] border border-[#ccff00]/30 text-[#ccff00] hover:text-[#e5ff80] hover:border-[#ccff00] shadow-md'
                    }`}
                  >
                    <span className="text-base">{emoji}</span>
                  </button>

                  {/* Tooltip on hover */}
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#101222] text-[#ccff00] border border-[#ccff00]/50 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 flex items-center gap-1.5 font-heading">
                    <span>{emoji}</span>
                    <span>{menu.name}</span>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={menu.id}
                onClick={() => onSelectMainMenu(menu.id)}
                className={`w-full flex items-center justify-start px-3.5 py-3 rounded-2xl text-xs font-heading font-black tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-[#ccff00] text-slate-950 shadow-[0_0_22px_rgba(204,255,0,0.5)] border border-[#e5ff80] border-l-4 border-l-slate-950 scale-[1.01]'
                    : 'bg-[#101222] hover:bg-[#181a32] text-[#ccff00] hover:text-[#e5ff80] border border-[#ccff00]/30 border-l-4 border-l-[#ccff00] hover:border-[#ccff00] hover:shadow-[0_0_15px_rgba(204,255,0,0.3)]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-base shrink-0">{emoji}</span>
                  <span className="truncate drop-shadow-sm">{menu.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM LOGOUT & FOOTER AREA */}
      <div className="p-3 border-t border-[#ccff00]/20 bg-[#06070e] space-y-2">
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => alert('Sistem Logout/Refresh Session.')}
            className="w-11 h-11 rounded-2xl bg-[#101222] border border-[#ccff00]/40 hover:border-red-500 hover:bg-red-950/40 text-[#ccff00] hover:text-red-400 flex items-center justify-center mx-auto cursor-pointer transition-all shadow-md"
            title="Keluar / Logout"
          >
            <DoorOpen className="w-5 h-5 text-[#ccff00]" />
          </button>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => alert('Sistem Logout/Refresh Session.')}
              className="w-full bg-[#101222] hover:bg-red-950/40 border border-[#ccff00]/40 hover:border-red-500 text-[#ccff00] hover:text-red-400 font-extrabold text-xs uppercase py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 font-heading"
            >
              <DoorOpen className="w-4 h-4" />
              <span>LOGOUT</span>
            </button>
            <p className="text-[9px] text-slate-500 text-center font-mono-code leading-tight">
              Copyright © | Since · 2026 | <span className="text-[#ccff00] font-bold">Rinjani System</span>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
