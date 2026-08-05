import React, { useState, useRef, useEffect } from 'react';
import { TemplateItem } from '../types';
import { Copy, Edit2, Trash2, Pin, PinOff, Check, MoreVertical, Bot, Terminal, Sparkles } from 'lucide-react';

interface TemplateCardProps {
  item: TemplateItem;
  onCopy: (text: string) => void;
  onEdit: (item: TemplateItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenReport?: (item: TemplateItem) => void;
  onOpenVarReplacer?: (item: TemplateItem) => void;
  copiedId: string | null;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  item,
  onCopy,
  onEdit,
  onDelete,
  onTogglePin,
  copiedId,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCopied = copiedId === item.id;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div
      id={`card-${item.id}`}
      className={`group relative rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 shadow-xl overflow-hidden border ${
        item.isPinned
          ? 'bg-[#101426] border-[#ccff00]/70 shadow-[0_0_20px_rgba(204,255,0,0.3)] ring-1 ring-[#ccff00]/40 hover:border-[#ccff00] hover:shadow-[0_0_35px_rgba(204,255,0,0.5)] hover:-translate-y-1'
          : 'bg-[#0e0f20] border-[#1e2142] hover:border-[#ccff00]/80 hover:shadow-[0_0_30px_rgba(204,255,0,0.35)] hover:-translate-y-1'
      }`}
    >
      {/* Top Cyber Neon Glowing Sweep Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
          item.isPinned
            ? 'bg-[#ccff00] shadow-[0_0_12px_#ccff00]'
            : 'bg-gradient-to-r from-transparent via-[#ccff00] to-transparent opacity-0 group-hover:opacity-100 shadow-[0_0_12px_#ccff00]'
        }`}
      />

      {/* Header: Title + Pinned Badge + 3-dots Menu */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5 pt-0.5">
        <div className="flex-1 pr-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.isPinned && (
              <span className="inline-flex items-center gap-1 text-[9px] font-mono-code font-black uppercase text-slate-950 bg-[#ccff00] px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(204,255,0,0.5)]">
                <Pin className="w-2.5 h-2.5 fill-slate-950" />
                PINNED
              </span>
            )}
            <h3 className="font-heading text-xs sm:text-sm font-black text-[#ccff00] tracking-wider uppercase leading-snug break-words group-hover:text-[#e5ff80] transition-all drop-shadow-[0_0_8px_rgba(204,255,0,0.25)]">
              {item.title}
            </h3>
          </div>
        </div>

        {/* 3-Dots Action Button */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className={`p-1.5 rounded-xl border transition-all ${
              showMenu
                ? 'bg-[#ccff00]/20 text-[#ccff00] border-[#ccff00]/70 shadow-[0_0_12px_rgba(204,255,0,0.4)]'
                : 'bg-[#181b36] text-slate-400 border-[#282b4c] hover:text-[#ccff00] hover:bg-[#20244b] hover:border-[#ccff00]/60 hover:shadow-[0_0_10px_rgba(204,255,0,0.3)]'
            }`}
            title="Opsi Menu"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#141629] border border-[#2d3156] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-1 z-30 animate-fade-in text-xs font-bold space-y-0.5 backdrop-blur-md">
              <button
                onClick={() => {
                  onTogglePin(item.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#202347] hover:text-[#ccff00] transition-colors text-left font-heading"
              >
                {item.isPinned ? (
                  <>
                    <PinOff className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>Lepas Pin</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>Sematkan ke Atas</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onEdit(item);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#202347] hover:text-[#ccff00] transition-colors text-left font-heading"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#ccff00]" />
                <span>Edit Template</span>
              </button>

              <div className="my-1 border-t border-[#222647]" />

              <button
                onClick={() => {
                  onDelete(item.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-left font-heading"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Template</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Text Content Box */}
      <div className="my-1.5 flex-1 bg-[#090a18] border border-[#1b1e3b] group-hover:border-[#ccff00]/30 rounded-xl p-3 text-xs sm:text-sm text-slate-100 overflow-y-auto custom-scrollbar leading-relaxed whitespace-pre-wrap font-body transition-all min-h-[140px] max-h-[260px] group-hover:shadow-[inset_0_0_15px_rgba(204,255,0,0.05)]">
        {item.ket}
      </div>

      {/* Action Button */}
      <div className="shrink-0 pt-2">
        <button
          onClick={() => onCopy(item.ket)}
          className={`w-full flex items-center justify-center gap-2 font-heading font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition-all duration-300 active:scale-[0.98] ${
            isCopied
              ? 'bg-[#ccff00] text-slate-950 shadow-[0_0_20px_rgba(204,255,0,0.6)] ring-2 ring-[#e5ff80] font-black'
              : 'bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 shadow-[0_0_15px_rgba(204,255,0,0.35)] hover:shadow-[0_0_25px_rgba(204,255,0,0.6)] font-black'
          }`}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span className="tracking-wider">TERSALIN!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="tracking-wider">COPY TEKS PK</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};


