import React, { useState, useEffect } from 'react';
import { MainMenuItem, CategoryItem, TemplateItem } from '../types';
import { X, Save, PlusCircle, Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

/**
 * Kompresi Gambar Dioptimalkan (Balance antara Kejernihan & Ukuran Dokumen)
 * Resolusi 1000px sudah sangat cukup untuk membaca teks pada screenshot
 * Kualitas 0.7 menjaga ukuran file agar bisa menampung banyak data di Firebase
 */
export function compressBase64Image(dataUrl: string, maxDim = 1000, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Gunakan JPEG untuk efisiensi ukuran data yang maksimal
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: Omit<TemplateItem, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  mainMenus: MainMenuItem[];
  categories: CategoryItem[];
  editItem: TemplateItem | null;
  defaultMainMenuId?: string | null;
  defaultCategoryId?: string | null;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mainMenus,
  categories,
  editItem,
  defaultMainMenuId,
  defaultCategoryId,
}) => {
  const activeMainId = editItem?.mainMenuId || defaultMainMenuId || mainMenus[0]?.id || 'menu-pk-live-chat';
  const isImageMenu = activeMainId === 'menu-gambar';
  const isBookmarkMenu = activeMainId === 'menu-link-bookmark';

  const availableCategories = categories.filter((c) => c.mainMenuId === activeMainId);

  const [title, setTitle] = useState('');
  const [perihal, setPerihal] = useState('');
  const [ket, setKet] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linksText, setLinksText] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setPerihal(editItem.perihal || '');
      setKet(editItem.ket || '');
      setImageUrl(editItem.imageUrl || '');
      if (editItem.links && editItem.links.length > 0) {
        setLinksText(editItem.links.join('\n'));
      } else {
        setLinksText(editItem.linkUrl || '');
      }
      setSelectedCatId(editItem.categoryId);
    } else {
      setTitle('');
      setPerihal('');
      setKet('');
      setImageUrl('');
      setLinksText('');
      const defaultSub = defaultCategoryId && availableCategories.some((c) => c.id === defaultCategoryId)
        ? defaultCategoryId
        : availableCategories[0]?.id || '';
      setSelectedCatId(defaultSub);
    }
  }, [editItem, isOpen, defaultCategoryId, activeMainId]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const compressed = await compressBase64Image(event.target.result as string);
          setImageUrl(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalImageUrl = imageUrl.trim();
    if (isImageMenu && finalImageUrl.startsWith('data:image/')) {
      finalImageUrl = await compressBase64Image(finalImageUrl);
    }

    let parsedLinks: string[] = [];
    if (isBookmarkMenu) {
      parsedLinks = linksText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    }

    const activeCatId = selectedCatId || availableCategories[0]?.id || '';
    const selectedCat = categories.find((c) => c.id === activeCatId);

    onSave(
      {
        mainMenuId: activeMainId,
        categoryId: activeCatId,
        categoryName: selectedCat ? selectedCat.name.toUpperCase() : 'UMUM',
        title: title.trim().toUpperCase(),
        info: isBookmarkMenu ? parsedLinks[0] : 'Rinjani Cloud System',
        perihal: perihal.trim() || title.trim(),
        ket: ket.trim(),
        imageUrl: isImageMenu ? finalImageUrl : undefined,
        linkUrl: isBookmarkMenu ? parsedLinks[0] : undefined,
        links: isBookmarkMenu ? parsedLinks : undefined,
        isPinned: editItem?.isPinned || false,
      },
      editItem?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#131422] border border-[#2b2e47] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-[#0e0f1a] px-6 py-4 border-b border-[#212338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-lime-400" />
            <h2 className="text-base font-black text-lime-400 uppercase tracking-wide">
              {editItem ? 'EDIT DATA' : 'TAMBAH DATA BARU'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#1c1e30] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm scrollbar-thin scrollbar-thumb-[#2b2e47]">
          {availableCategories.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase mb-1.5 text-lime-400">Pilih Sub-Menu</label>
              <select value={selectedCatId} onChange={(e) => setSelectedCatId(e.target.value)} className="w-full bg-[#181a2b] border border-[#2c2f4a] rounded-xl px-3 py-2.5 text-white outline-none focus:border-lime-500/50">
                {availableCategories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase mb-1.5 text-lime-400">Judul / Label</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full bg-[#181a2b] border border-[#2c2f4a] rounded-xl px-3 py-2.5 text-white uppercase outline-none focus:border-lime-500/50" />
          </div>

          {isImageMenu ? (
            <div className="space-y-4 bg-[#0d0e19] border border-[#232644] p-4 rounded-xl">
              <label className="block text-xs font-bold text-lime-400 uppercase">Upload Gambar</label>
              <label className="w-full flex flex-col items-center justify-center gap-2 bg-[#1a1c33] text-lime-300 border border-dashed border-lime-500/40 font-bold text-xs py-5 rounded-xl cursor-pointer hover:bg-[#202342] transition-all">
                <Upload className="w-5 h-5" /> <span>Klik Pilih Gambar</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              {imageUrl && (
                <div className="mt-2 border border-lime-500/40 rounded-xl p-2 bg-black flex justify-center flex-col items-center">
                  <img src={imageUrl} alt="Preview" className="max-h-44 rounded shadow-lg object-contain" />
                  <button type="button" onClick={() => setImageUrl('')} className="mt-2 text-[10px] text-red-400 font-bold underline">Hapus</button>
                </div>
              )}
               <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Catatan Gambar</label>
                <textarea value={ket} onChange={(e) => setKet(e.target.value)} rows={3} className="w-full bg-[#181a2b] border border-[#2c2f4a] rounded-xl p-3 text-xs text-white outline-none" />
              </div>
            </div>
          ) : isBookmarkMenu ? (
             <div>
              <label className="block text-xs font-bold text-lime-400 uppercase mb-1.5">Daftar URL Link</label>
              <textarea value={linksText} onChange={(e) => setLinksText(e.target.value)} rows={4} required placeholder="Contoh: Nama Link | https://url.com" className="w-full bg-[#181a2b] border border-[#2c2f4a] rounded-xl p-3 text-xs text-cyan-300 font-mono" />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-lime-400 uppercase mb-1.5">Isi Kata-Kata PK</label>
              <textarea value={ket} onChange={(e) => setKet(e.target.value)} required rows={8} className="w-full bg-[#181a2b] border border-[#2c2f4a] rounded-xl p-4 text-white outline-none leading-relaxed" />
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-[#212338]">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-[#1c1e30] text-slate-300 rounded-xl text-xs font-bold">Batal</button>
            <button type="submit" className="px-7 py-2.5 bg-lime-400 text-black rounded-xl text-xs font-black shadow-lg shadow-lime-900/40 hover:bg-lime-300 active:scale-95 transition-all">SIMPAN KE CLOUD</button>
          </div>
        </form>
      </div>
    </div>
  );
};
