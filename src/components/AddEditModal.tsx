import React, { useState, useEffect } from 'react';
import { MainMenuItem, CategoryItem, TemplateItem } from '../types';
import { X, Save, PlusCircle, Upload, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';

export function compressBase64Image(dataUrl: string, maxDim = 650, quality = 0.72): Promise<string> {
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
        ctx.drawImage(img, 0, 0, width, height);
        let result = canvas.toDataURL('image/jpeg', quality);
        if (result.length > 150000) {
          const smallCanvas = document.createElement('canvas');
          const targetW = Math.min(width, 500);
          const targetH = Math.round((height * targetW) / width);
          smallCanvas.width = targetW;
          smallCanvas.height = targetH;
          const smallCtx = smallCanvas.getContext('2d');
          if (smallCtx) {
            smallCtx.drawImage(img, 0, 0, targetW, targetH);
            result = smallCanvas.toDataURL('image/jpeg', 0.65);
          }
        }
        resolve(result);
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
  const [linkUrl, setLinkUrl] = useState('');
  const [linksText, setLinksText] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setPerihal(editItem.perihal || '');
      setKet(editItem.ket || '');
      setImageUrl(editItem.imageUrl || '');
      const primaryUrl = editItem.linkUrl || editItem.info || '';
      setLinkUrl(primaryUrl);
      if (editItem.links && editItem.links.length > 0) {
        setLinksText(editItem.links.join('\n'));
      } else {
        setLinksText(primaryUrl);
      }
      setSelectedCatId(editItem.categoryId);
    } else {
      setTitle('');
      setPerihal('');
      setKet('');
      setImageUrl('');
      setLinkUrl('');
      setLinksText('');
      const defaultSub = defaultCategoryId && availableCategories.some((c) => c.id === defaultCategoryId)
        ? defaultCategoryId
        : availableCategories[0]?.id || categories[0]?.id || '';
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
          const rawUrl = event.target.result as string;
          const compressed = await compressBase64Image(rawUrl, 650, 0.72);
          setImageUrl(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isImageMenu && !imageUrl.trim()) {
      alert('Silakan upload atau masukkan URL gambar!');
      return;
    }

    if (isBookmarkMenu) {
      const rawLines = linksText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (rawLines.length === 0 && !linkUrl.trim()) {
        alert('Silakan masukkan minimal 1 URL / Alamat Web Link!');
        return;
      }
    }

    if (!isImageMenu && !isBookmarkMenu && !ket.trim()) {
      alert('Silakan isi kata-kata template!');
      return;
    }

    let finalImageUrl = imageUrl.trim();
    if (isImageMenu && finalImageUrl.startsWith('data:image/')) {
      finalImageUrl = await compressBase64Image(finalImageUrl, 650, 0.72);
    }

    // Process bookmark URLs list
    let parsedLinks: string[] = [];
    if (isBookmarkMenu) {
      const rawLines = linksText.length > 0 ? linksText.split('\n') : [linkUrl];
      parsedLinks = rawLines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          if (!line.startsWith('http://') && !line.startsWith('https://')) {
            return `https://${line}`;
          }
          return line;
        });
    }

    const primaryLink = parsedLinks[0] || linkUrl.trim();

    const activeCatId = selectedCatId || availableCategories[0]?.id || categories[0]?.id || '';
    const selectedCat = categories.find((c) => c.id === activeCatId);

    onSave(
      {
        mainMenuId: activeMainId,
        categoryId: activeCatId,
        categoryName: selectedCat
          ? selectedCat.name.toUpperCase()
          : isImageMenu
          ? 'GAMBAR'
          : isBookmarkMenu
          ? 'LINK BOOKMARKS'
          : 'TEMPLATE CS & CHAT',
        title: title.trim().toUpperCase(),
        info: isBookmarkMenu ? primaryLink : editItem?.info || (isImageMenu ? 'Storage Gambar' : 'Customer Support'),
        perihal: perihal.trim() || title.trim(),
        ket: ket.trim(),
        imageUrl: isImageMenu ? finalImageUrl : undefined,
        linkUrl: isBookmarkMenu ? primaryLink : undefined,
        links: isBookmarkMenu ? parsedLinks : undefined,
        tag: editItem?.tag,
        isPinned: editItem?.isPinned || false,
      },
      editItem?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#131422] border border-[#2b2e47] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-[#0e0f1a] px-6 py-4 border-b border-[#212338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isImageMenu ? (
              <ImageIcon className="w-5 h-5 text-lime-400" />
            ) : isBookmarkMenu ? (
              <LinkIcon className="w-5 h-5 text-cyan-400" />
            ) : (
              <PlusCircle className="w-5 h-5 text-lime-400" />
            )}
            <h2 className={`text-base font-black uppercase tracking-wide ${isBookmarkMenu ? 'text-cyan-400' : 'text-lime-400'}`}>
              {isImageMenu
                ? editItem
                  ? 'EDIT DATA GAMBAR'
                  : 'TAMBAH GAMBAR BARU'
                : isBookmarkMenu
                ? editItem
                  ? 'EDIT LINK BOOKMARK'
                  : 'TAMBAH LINK BOOKMARK BARU'
                : editItem
                ? 'EDIT TEMPLATE TEXT / PK'
                : 'TAMBAH TEMPLATE TEXT / PK BARU'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#1c1e30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
          
          {/* Sub-menu Selection if multiple available */}
          {availableCategories.length > 0 && (
            <div>
              <label className={`block text-xs font-bold uppercase mb-1.5 ${isBookmarkMenu ? 'text-cyan-400' : 'text-lime-400'}`}>
                Pilih Sub-Menu Category <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
                className={`w-full bg-[#181a2b] border border-[#2c2f4a] rounded-xl px-3.5 py-2.5 text-slate-100 font-bold uppercase outline-none ${
                  isBookmarkMenu ? 'focus:border-cyan-400' : 'focus:border-lime-400'
                }`}
              >
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Judul */}
          <div>
            <label className={`block text-xs font-bold uppercase mb-1.5 ${isBookmarkMenu ? 'text-cyan-400' : 'text-lime-400'}`}>
              {isImageMenu ? 'Judul / Label Gambar' : isBookmarkMenu ? 'Nama Box Group Bookmark' : 'Judul Template / PK'} <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              placeholder={
                isImageMenu
                  ? 'Contoh: DETAIL TRANSAKSI DANA 150K'
                  : isBookmarkMenu
                  ? 'Contoh: PAGI (atau SORE, MALAM, POIPET, dll)'
                  : 'Contoh: BANK BSI DAN BCA OFFLINE'
              }
              className={`w-full bg-[#181a2b] border border-[#2c2f4a] rounded-xl px-3.5 py-2.5 text-slate-100 font-bold uppercase outline-none ${
                isBookmarkMenu ? 'focus:border-cyan-400' : 'focus:border-lime-400'
              }`}
            />
          </div>

          {/* Special BOOKMARK URL input for LINK BOOKMARKS menu */}
          {isBookmarkMenu ? (
            <div className="space-y-3 bg-[#0d0e19] border border-[#1e2342] p-4 rounded-xl">
              <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase mb-1 flex items-center justify-between">
                  <span>Daftar Link (Format: Nama Link | URL)</span>
                  <span className="text-[10px] text-cyan-300 font-normal">Tekan Enter untuk link berikutnya</span>
                </label>
                <div className="bg-[#181a2b] border border-[#2c2f4a] focus-within:border-cyan-400 rounded-xl p-2.5">
                  <textarea
                    value={linksText}
                    onChange={(e) => setLinksText(e.target.value)}
                    rows={4}
                    required
                    placeholder={`Engine 1 | https://poipetlottery.com\nEngine 2 | https://poipet-alt1.com\nhttps://poipet-alt2.com`}
                    className="w-full bg-transparent text-xs text-cyan-300 font-mono-code outline-none leading-relaxed resize-y"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 <i>Gunakan format <b>Nama Link | https://url.com</b> (contoh: <code>Engine 1 | https://google.com</code>) atau langsung tulis URL. Semua link dalam box bisa dibuka bersamaan!</i>
                </p>
              </div>


            </div>
          ) : isImageMenu ? (
            /* Special IMAGE Upload section for GAMBAR menu */
            <div className="space-y-3 bg-[#0d0e19] border border-[#232644] p-4 rounded-xl">
              <label className="block text-xs font-bold text-lime-400 uppercase">
                Pilih & Upload Gambar <span className="text-red-400">*</span>
              </label>

              {/* Upload File button */}
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 bg-[#1a1c33] hover:bg-[#232647] text-lime-300 border border-lime-500/40 font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-md">
                  <Upload className="w-4 h-4 text-lime-400" />
                  <span>Upload Gambar Dari Perangkat</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Direct Image URL input */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">atau Masukkan URL/Link Gambar:</span>
                <div className="flex items-center bg-[#181a2b] border border-[#2c2f4a] rounded-xl px-3 py-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... atau paste link data URI"
                    className="w-full bg-transparent text-xs text-slate-100 outline-none"
                  />
                </div>
              </div>

              {/* Live Image Preview */}
              {imageUrl && (
                <div className="mt-2 pt-2 border-t border-[#1e213b]">
                  <span className="text-[10px] font-mono-code font-bold text-slate-400 uppercase block mb-1.5">Pratinjau Gambar:</span>
                  <div className="bg-[#060710] border border-lime-500/40 rounded-xl p-2 max-h-48 flex items-center justify-center overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Pratinjau"
                      className="max-h-40 w-auto object-contain rounded"
                    />
                  </div>
                </div>
              )}

              {/* Catatan Keterangan Gambar (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Catatan / Keterangan Gambar (Opsional)
                </label>
                <textarea
                  value={ket}
                  onChange={(e) => setKet(e.target.value)}
                  rows={3}
                  placeholder="Contoh: Detail Kirim Uang Rp150.000 via DANA (SmartPay)..."
                  className="w-full bg-[#181a2b] border border-[#2c2f4a] focus:border-lime-400 rounded-xl p-3 text-slate-100 outline-none leading-relaxed text-xs"
                />
              </div>
            </div>
          ) : (
            /* Regular TEXT template input */
            <div>
              <label className="block text-xs font-bold text-lime-400 uppercase mb-1.5">
                Isi Kata-Kata / Pesan PK <span className="text-red-400">*</span>
              </label>
              <textarea
                value={ket}
                onChange={(e) => setKet(e.target.value)}
                required
                rows={6}
                placeholder="Ketikkan template pesan atau data operasional PK di sini..."
                className="w-full bg-[#181a2b] border border-[#2c2f4a] focus:border-lime-400 rounded-xl p-3.5 text-slate-100 outline-none leading-relaxed font-sans"
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-[#212338] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#1c1e30] hover:bg-[#282a45] text-slate-300 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 ${
                isBookmarkMenu
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 hover:from-cyan-300 hover:to-blue-300 shadow-cyan-950/40'
                  : 'bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 shadow-lime-950/40'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {editItem
                  ? 'Simpan Perubahan'
                  : isImageMenu
                  ? 'Simpan Gambar'
                  : isBookmarkMenu
                  ? 'Simpan Bookmark'
                  : 'Tambah Data PK'}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

