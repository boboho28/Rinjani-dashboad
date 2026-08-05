import React, { useState } from 'react';
import { CategoryItem } from '../types';
import {
  Folder,
  Layers,
  Plus,
  Trash2,
  FolderPlus,
} from 'lucide-react';

interface SubMenuBarProps {
  categories: CategoryItem[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
  mainMenuName: string;
  onAddSubMenu: (name: string, color?: string) => void;
  onOpenCategoryManager: () => void;
  onAddPkForCategory: (categoryId: string) => void;
  onDeleteCategory: (id: string) => void;
}

export const SubMenuBar: React.FC<SubMenuBarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  categoryCounts,
  totalCount,
  mainMenuName,
  onAddSubMenu,
  onDeleteCategory,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [subName, setSubName] = useState('');
  const [subColor, setSubColor] = useState('#8b5cf6');

  const COLOR_OPTIONS = [
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Red', hex: '#e11d48' },
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    onAddSubMenu(subName.trim(), subColor);
    setSubName('');
    setShowAddForm(false);
  };

  return (
    <aside
      id="sub-menu-panel"
      className="w-full md:w-64 lg:w-72 shrink-0 min-w-[250px] md:sticky md:top-[105px] z-20 bg-[#101124] border border-[#202340] rounded-2xl p-4 shadow-xl space-y-3 font-sans transition-all duration-200"
    >
      {/* 1. Header Section */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1c1e36]">
        <div className="flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-[#ccff00]" />
          <h3 className="font-heading text-xs font-black uppercase text-[#ccff00] tracking-wider">
            MENU KEDUA (SUB-MENU)
          </h3>
        </div>
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="flex items-center gap-1 text-[11px] font-extrabold text-[#ccff00] hover:text-[#e5ff80] hover:bg-[#1a1d38] px-2 py-1 rounded-lg transition-colors cursor-pointer font-heading"
          title="Tambah Menu Kedua Baru"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Tambah</span>
        </button>
      </div>

      {/* 2. Selected Main Menu Context Bar */}
      <div className="text-[10px] font-mono-code font-black uppercase tracking-wider flex items-center justify-between px-1">
        <span>
          MODUL: <span className="text-[#ccff00]">{mainMenuName}</span>
        </span>
        <span className="text-slate-400 font-bold">{categories.length} SUB-MENU</span>
      </div>

      {/* 3. Quick Add Sub-Menu Input Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-[#15172b] border border-[#ccff00]/60 p-3 rounded-2xl space-y-2.5 animate-fade-in shadow-[0_0_15px_rgba(204,255,0,0.2)]"
        >
          <input
            type="text"
            value={subName}
            onChange={(e) => setSubName(e.target.value)}
            placeholder="Nama Menu Kedua..."
            required
            autoFocus
            className="w-full bg-[#0b0c16] border border-[#303352] focus:border-[#ccff00] rounded-xl px-3 py-1.5 text-xs text-[#ccff00] outline-none font-bold"
          />

          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSubColor(c.hex)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    subColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-1 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="bg-[#ccff00] text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg hover:bg-[#e5ff80] shadow font-heading uppercase"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4. Sub-Menu Capsule Buttons List */}
      <div className="space-y-2">
        {/* All Sub-Menus option */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-heading font-black tracking-wider uppercase transition-all duration-200 ${
            selectedCategoryId === null
              ? 'bg-[#ccff00] text-slate-950 shadow-[0_0_20px_rgba(204,255,0,0.45)] border border-[#e5ff80] scale-[1.01]'
              : 'bg-[#15172b] text-slate-200 hover:bg-[#1a1d38] hover:text-[#ccff00] border border-[#222547] hover:border-[#ccff00]/50 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className={`w-4 h-4 ${selectedCategoryId === null ? 'text-slate-950' : 'text-[#ccff00]'}`} />
            <span>Semua Sub-Menu</span>
          </div>
          <span
            className={`text-[10px] font-mono-code font-black px-2.5 py-0.5 rounded-full ${
              selectedCategoryId === null
                ? 'bg-slate-950 text-[#ccff00] shadow-sm border border-[#ccff00]/40'
                : 'bg-[#0d0e1a] text-slate-400 border border-[#222547]'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Individual Sub-Menu items list */}
        {categories.map((cat) => {
          const count = categoryCounts[cat.id] || 0;
          const isSelected = selectedCategoryId === cat.id;

          return (
            <div key={cat.id} className="group relative flex items-center">
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelectCategory(cat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCategory(cat.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-heading font-black tracking-wider uppercase transition-all duration-200 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#ccff00] text-slate-950 shadow-[0_0_20px_rgba(204,255,0,0.45)] border border-[#e5ff80] scale-[1.01]'
                    : 'bg-[#15172b] text-slate-200 hover:bg-[#1a1d38] hover:text-[#ccff00] border border-[#222547] hover:border-[#ccff00]/50 hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Folder
                    className="w-4 h-4 shrink-0"
                    style={{ color: !isSelected && cat.color ? cat.color : undefined }}
                  />
                  <span className="truncate">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span
                    className={`text-[10px] font-mono-code font-black px-2.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-slate-950 text-[#ccff00] border border-[#ccff00]/40'
                        : 'bg-[#0d0e1a] text-slate-400 border border-[#222547]'
                    }`}
                  >
                    {count}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCategory(cat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-400 rounded transition-opacity ml-0.5 cursor-pointer"
                    title="Hapus Menu Kedua"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

