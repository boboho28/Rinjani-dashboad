import React, { useState } from 'react';
import { MainMenuItem, CategoryItem } from '../types';
import { X, Plus, FolderPlus, Trash2, Edit2, Check, LayoutGrid, RotateCcw } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mainMenus: MainMenuItem[];
  categories: CategoryItem[];
  selectedMainMenuId: string | null;
  onAddCategory: (category: Omit<CategoryItem, 'id' | 'order'>) => void;
  onUpdateCategory: (id: string, name: string, code: string, color?: string) => void;
  onDeleteCategory: (id: string) => void;
  categoryCounts: Record<string, number>;
  onAddMainMenu?: (name: string) => void;
  onUpdateMainMenu?: (id: string, name: string) => void;
  onDeleteMainMenu?: (id: string) => void;
  onClearAllCustomData?: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  mainMenus,
  categories,
  selectedMainMenuId,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  categoryCounts,
  onAddMainMenu,
  onUpdateMainMenu,
  onDeleteMainMenu,
  onClearAllCustomData,
}) => {
  const [activeTab, setActiveTab] = useState<'sub' | 'main'>('sub');
  const [targetMainMenuId, setTargetMainMenuId] = useState<string>(
    selectedMainMenuId || mainMenus[0]?.id || 'menu-pk-live-chat'
  );

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#8b5cf6');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Main Menu form states
  const [newMainMenuName, setNewMainMenuName] = useState('');
  const [editingMainMenuId, setEditingMainMenuId] = useState<string | null>(null);
  const [editMainMenuName, setEditMainMenuName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddCategory({
      mainMenuId: targetMainMenuId,
      name: newName.trim(),
      code: newName.trim().toUpperCase().replace(/\s+/g, '_'),
      color: newColor,
    });

    setNewName('');
  };

  const startEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    onUpdateCategory(id, editName.trim(), editName.trim().toUpperCase().replace(/\s+/g, '_'));
    setEditingId(null);
  };

  const handleAddMainMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMainMenuName.trim() || !onAddMainMenu) return;
    onAddMainMenu(newMainMenuName.trim());
    setNewMainMenuName('');
  };

  const startEditMainMenu = (m: MainMenuItem) => {
    setEditingMainMenuId(m.id);
    setEditMainMenuName(m.name);
  };

  const saveEditMainMenu = (id: string) => {
    if (!editMainMenuName.trim() || !onUpdateMainMenu) return;
    onUpdateMainMenu(id, editMainMenuName.trim());
    setEditingMainMenuId(null);
  };

  const filteredCategories = categories.filter((c) => c.mainMenuId === targetMainMenuId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#131422] border border-[#2b2e47] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#0e0f1a] px-6 py-4 border-b border-[#212338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-lime-400" />
            <h2 className="text-lg font-black text-lime-400 uppercase tracking-wide">KELOLA MENU & SUB-MENU</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#1c1e30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-[#10111d] px-6 py-2 border-b border-[#212338] flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sub')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'sub'
                ? 'bg-lime-400 text-slate-950 font-black'
                : 'bg-[#1a1c2e] text-slate-300 hover:bg-[#23263e]'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Kelola Menu Kedua (Sub-Menu)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('main')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'main'
                ? 'bg-lime-400 text-slate-950 font-black'
                : 'bg-[#1a1c2e] text-slate-300 hover:bg-[#23263e]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kelola Menu Utama (Modul)</span>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          
          {activeTab === 'sub' ? (
            <>
              {/* Main Menu Selector */}
              <div>
                <label className="block text-xs font-bold uppercase text-lime-400 mb-1.5">
                  Pilih Menu Utama (Modul Induk):
                </label>
                <select
                  value={targetMainMenuId}
                  onChange={(e) => setTargetMainMenuId(e.target.value)}
                  className="w-full bg-[#181a2b] border border-[#2c2f4a] focus:border-lime-400 rounded-xl px-3.5 py-2.5 text-slate-100 font-bold outline-none"
                >
                  {mainMenus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Sub-Menu Form */}
              <form onSubmit={handleAdd} className="bg-[#181a2b] border border-[#262842] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase text-lime-300">
                  Tambah Menu Kedua ke {mainMenus.find((m) => m.id === targetMainMenuId)?.name || 'Modul'}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama Sub-Menu Baru (contoh: Live Chat CS)"
                    required
                    className="flex-1 min-w-[200px] bg-[#10111d] border border-[#2f3252] rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-lime-400"
                  />
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-9 h-9 rounded border-none cursor-pointer bg-transparent"
                    title="Pilih Warna Badge"
                  />
                  <button
                    type="submit"
                    className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Simpan</span>
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">
                  Daftar Sub-Menu (Menu Kedua)
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => {
                      const count = categoryCounts[cat.id] || 0;
                      const isEditing = editingId === cat.id;

                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#181a2b] border border-[#24263f] text-xs"
                        >
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-[#10111d] border border-purple-500 rounded-lg px-2 py-1 text-slate-100 flex-1 outline-none font-bold"
                              />
                              <button
                                onClick={() => saveEdit(cat.id)}
                                className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color || '#8b5cf6' }}
                              />
                              <span className="font-bold text-slate-200">{cat.name}</span>
                              <span className="bg-[#21233d] text-slate-400 text-[10px] px-2 py-0.5 rounded font-mono">
                                {count} Item
                              </span>
                            </div>
                          )}

                          {!isEditing && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEdit(cat)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-[#22243d] cursor-pointer"
                                title="Edit Nama Sub-Menu"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteCategory(cat.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#22243d] cursor-pointer"
                                title="Hapus Sub-menu beserta seluruh datanya"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs italic bg-[#151627] rounded-xl border border-[#202238]">
                      Belum ada Sub-Menu di Modul ini. Silakan tambah melalui form di atas.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Add Main Menu Form */}
              <form onSubmit={handleAddMainMenuSubmit} className="bg-[#181a2b] border border-[#262842] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase text-lime-300">
                  Tambah Menu Utama Baru (Modul Induk)
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMainMenuName}
                    onChange={(e) => setNewMainMenuName(e.target.value)}
                    placeholder="Nama Menu Utama Baru (contoh: PENCAIRAN SALDO)"
                    required
                    className="flex-1 bg-[#10111d] border border-[#2f3252] rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-lime-400 font-bold"
                  />
                  <button
                    type="submit"
                    className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs py-2 px-4 rounded-xl flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah</span>
                  </button>
                </div>
              </form>

              {/* Main Menus List */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">
                  Daftar Menu Utama Aktif
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {mainMenus.map((m) => {
                    const isEditing = editingMainMenuId === m.id;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#181a2b] border border-[#24263f] text-xs"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editMainMenuName}
                              onChange={(e) => setEditMainMenuName(e.target.value)}
                              className="bg-[#10111d] border border-lime-400 rounded-lg px-2 py-1 text-slate-100 flex-1 outline-none font-bold"
                            />
                            <button
                              onClick={() => saveEditMainMenu(m.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4 text-lime-400" />
                            <span className="font-extrabold text-slate-100">{m.name}</span>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditMainMenu(m)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-[#22243d] cursor-pointer"
                              title="Edit Nama Menu Utama"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteMainMenu && (
                              <button
                                onClick={() => onDeleteMainMenu(m.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-[#22243d] cursor-pointer"
                                title="Hapus Menu Utama beserta seluruh sub-menu dan datanya"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#0e0f1a] px-6 py-3 border-t border-[#212338] flex items-center justify-between gap-2">
          {onClearAllCustomData ? (
            <button
              type="button"
              onClick={onClearAllCustomData}
              className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Hapus / Kosongkan seluruh sub-menu & template bawaan agar dapat membuat menu sendiri dari awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kosongkan Semua Data Sub-menu & Template</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1c1e30] hover:bg-[#282a45] text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
};

