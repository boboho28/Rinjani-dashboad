import React, { useState, useRef, useEffect } from 'react';
import { TemplateItem } from '../types';
import { Copy, Edit2, Trash2, Pin, PinOff, Check, MoreVertical, Maximize2, Image as ImageIcon } from 'lucide-react';

interface ImageCardProps {
  item: TemplateItem;
  onCopyImage: (url: string) => void;
  onViewImage: (item: TemplateItem) => void;
  onEdit: (item: TemplateItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  copiedId: string | null;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  onCopyImage,
  onViewImage,
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
      id={`card-img-${item.id}`}
      className={`group relative rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 shadow-xl overflow-hidden border ${
        item.isPinned
          ? 'bg-[#101524] border-lime-500/70 shadow-[0_0_18px_rgba(163,230,53,0.25)] ring-1 ring-lime-500/40 hover:border-lime-400 hover:shadow-[0_0_35px_rgba(163,230,53,0.5)] hover:-translate-y-1'
          : 'bg-[#0f1022] border-[#1e2142] hover:border-lime-400/80 hover:shadow-[0_0_30px_rgba(163,230,53,0.35)] hover:-translate-y-1'
      }`}
    >
      {/* Top Cyber Neon Glowing Sweep Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
          item.isPinned
            ? 'bg-gradient-to-r from-lime-400 via-emerald-300 to-lime-500 shadow-[0_0_10px_#a3e635]'
            : 'bg-gradient-to-r from-transparent via-lime-400 to-transparent opacity-0 group-hover:opacity-100 shadow-[0_0_12px_#a3e635]'
        }`}
      />

      {/* Header: Pinned Tag + Title + Category Badge + 3-dots Menu */}
      <div>
        <div className="flex items-start justify-between gap-2.5 mb-2 pt-0.5">
          <div className="flex-1 pr-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {item.isPinned && (
                <span className="inline-flex items-center gap-1 text-[9px] font-mono-code font-black uppercase text-slate-950 bg-lime-400 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(163,230,53,0.5)]">
                  <Pin className="w-2.5 h-2.5 fill-slate-950" />
                  PINNED
                </span>
              )}
              <span className="text-[9px] font-mono-code font-bold uppercase text-lime-300 bg-[#162119] border border-lime-500/30 px-1.5 py-0.5 rounded">
                {item.categoryName || 'GAMBAR'}
              </span>
            </div>
            <h3 className="font-heading text-xs sm:text-sm font-extrabold text-lime-400 tracking-wider uppercase leading-snug break-words group-hover:text-lime-300 transition-all">
              {item.title}
            </h3>
          </div>

          {/* 3-Dots Action Button */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className={`p-1.5 rounded-xl border transition-all ${
                showMenu
                  ? 'bg-lime-500/20 text-lime-400 border-lime-500/70 shadow-[0_0_12px_rgba(163,230,53,0.4)]'
                  : 'bg-[#181b36] text-slate-400 border-[#282b4c] hover:text-lime-300 hover:bg-[#20244b] hover:border-lime-400/60'
              }`}
              title="Opsi Menu Gambar"
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
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#202347] hover:text-lime-400 transition-colors text-left"
                >
                  {item.isPinned ? (
                    <>
                      <PinOff className="w-3.5 h-3.5 text-lime-400" />
                      <span>Lepas Pin</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-3.5 h-3.5 text-lime-400" />
                      <span>Sematkan ke Atas</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onEdit(item);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-200 hover:bg-[#202347] hover:text-lime-400 transition-colors text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-lime-400" />
                  <span>Edit Data Gambar</span>
                </button>

                <div className="my-1 border-t border-[#222647]" />

                <button
                  onClick={() => {
                    onDelete(item.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Gambar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Image Display Box */}
      <div
        onClick={() => onViewImage(item)}
        className="my-2 relative group/img cursor-pointer rounded-xl overflow-hidden bg-[#070814] border border-[#1d203f] hover:border-lime-500/60 aspect-[4/3] flex items-center justify-center transition-all shadow-inner"
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-contain p-1.5 transition-transform duration-300 group-hover/img:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <ImageIcon className="w-8 h-8 text-slate-600" />
            <span className="text-[11px] font-bold">Tidak ada gambar</span>
          </div>
        )}

        {/* Hover Overlay with View Icon */}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-lime-300 backdrop-blur-[2px]">
          <Maximize2 className="w-6 h-6 stroke-[2.5] text-lime-400 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider bg-slate-950/80 px-2.5 py-1 rounded-lg border border-lime-400/40">
            Klik Untuk Perbesar
          </span>
        </div>
      </div>

      {/* Notes / Description text if present */}
      {item.ket && (
        <p className="text-[11px] text-slate-300 line-clamp-2 mb-2 px-1 leading-snug font-sans">
          {item.ket}
        </p>
      )}

      {/* Action Buttons: LIHAT GAMBAR & COPY GAMBAR */}
      <div className="shrink-0 pt-1 space-y-1.5">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewImage(item)}
            className="w-full flex items-center justify-center gap-1.5 font-heading font-bold text-xs py-2 px-3 rounded-xl bg-[#181a33] text-lime-300 hover:bg-[#202447] hover:text-lime-200 border border-lime-500/30 transition-all active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Lihat Penuh</span>
          </button>

          <button
            onClick={() => onCopyImage(item.imageUrl || item.ket)}
            className={`w-full flex items-center justify-center gap-1.5 font-heading font-black text-xs py-2 px-3 rounded-xl shadow-md transition-all active:scale-95 ${
              isCopied
                ? 'bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(52,211,153,0.5)] ring-1 ring-emerald-300'
                : 'bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>TERSALIN!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>COPY GAMBAR</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
