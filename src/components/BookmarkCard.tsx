import React, { useState } from 'react';
import { TemplateItem } from '../types';
import {
  ExternalLink,
  Copy,
  Check,
  Plus,
  Edit3,
  Trash2,
  Globe,
  X,
  Link as LinkIcon,
  Layers,
  FolderOpen,
  Eye,
  EyeOff,
} from 'lucide-react';

interface BookmarkCardProps {
  item: TemplateItem;
  onCopyLink: (url: string) => void;
  onEdit: (item: TemplateItem) => void;
  onDelete: (id: string) => void;
  onUpdateLinks: (id: string, updatedLinks: string[]) => void;
  copiedId: string | null;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  item,
  onCopyLink,
  onEdit,
  onDelete,
  onUpdateLinks,
  copiedId,
}) => {
  const [showAddInline, setShowAddInline] = useState(false);
  const [newLinksText, setNewLinksText] = useState('');
  const [defaultLinkLabel, setDefaultLinkLabel] = useState('');
  const [showLinks, setShowLinks] = useState(false);

  // Extract all links array from item.links or fallback to item.linkUrl / item.info
  const getLinksList = (): string[] => {
    if (item.links && Array.isArray(item.links) && item.links.length > 0) {
      return item.links.filter((l) => l && l.trim().length > 0);
    }
    const fallback = item.linkUrl || item.info || '';
    return fallback ? [fallback] : [];
  };

  const linksList = getLinksList();
  const isCopiedAll = copiedId === `all-${item.id}`;

  const parseLinkItem = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.includes('|')) {
      const parts = trimmed.split('|');
      const label = parts[0].trim();
      const rawUrl = parts.slice(1).join('|').trim();
      return { label, rawUrl };
    }
    return { label: '', rawUrl: trimmed };
  };

  const formatUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return 'https://google.com';
    return trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
  };

  // Open ALL links simultaneously in new tabs
  const handleOpenAllLinks = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linksList.length === 0) return;

    linksList.forEach((raw) => {
      const { rawUrl } = parseLinkItem(raw);
      const formatted = formatUrl(rawUrl);
      window.open(formatted, '_blank', 'noopener,noreferrer');
    });
  };

  // Open single link
  const handleOpenSingleLink = (e: React.MouseEvent, raw: string) => {
    e.stopPropagation();
    const { rawUrl } = parseLinkItem(raw);
    const formatted = formatUrl(rawUrl);
    window.open(formatted, '_blank', 'noopener,noreferrer');
  };

  // Quick Inline Add Link to this specific Box Group via Textarea (Format: Nama Link | URL)
  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!newLinksText.trim()) return;

    const rawLines = newLinksText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (rawLines.length === 0) return;

    const formattedItems = rawLines.map((line) => {
      let label = defaultLinkLabel.trim();
      let rawUrl = line;

      if (line.includes('|')) {
        const parts = line.split('|');
        label = parts[0].trim();
        rawUrl = parts.slice(1).join('|').trim();
      }

      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = `https://${rawUrl}`;
      }

      return label ? `${label} | ${rawUrl}` : rawUrl;
    });

    const updated = [...linksList, ...formattedItems];
    onUpdateLinks(item.id, updated);
    setNewLinksText('');
    setDefaultLinkLabel('');
    setShowAddInline(false);
    setShowLinks(true);
  };

  // Delete single link from card
  const handleDeleteSingleLink = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    if (linksList.length <= 1) {
      alert('Minimal harus ada 1 link di dalam box. Jika ingin menghapus seluruh box ini, gunakan tombol Hapus Box.');
      return;
    }
    const updated = linksList.filter((_, idx) => idx !== indexToRemove);
    onUpdateLinks(item.id, updated);
  };

  // Copy all links
  const handleCopyAllLinks = (e: React.MouseEvent) => {
    e.stopPropagation();
    const allText = linksList
      .map((raw) => {
        const { label, rawUrl } = parseLinkItem(raw);
        const formatted = formatUrl(rawUrl);
        return label ? `${label}: ${formatted}` : formatted;
      })
      .join('\n');
    onCopyLink(allText);
  };

  // Rename Sub-Group label
  const handleRenameSubGroup = (oldLabel: string) => {
    const newName = window.prompt(`Masukkan nama baru untuk grup "${oldLabel}":`, oldLabel);
    if (newName === null) return;
    const trimmedNew = newName.trim();
    if (!trimmedNew) return;

    const updated = linksList.map((raw) => {
      const { label, rawUrl } = parseLinkItem(raw);
      if (label.trim().toLowerCase() === oldLabel.trim().toLowerCase()) {
        return `${trimmedNew} | ${rawUrl}`;
      }
      return raw;
    });

    onUpdateLinks(item.id, updated);
  };

  // Delete all links in Sub-Group
  const handleDeleteSubGroup = (groupLabel: string) => {
    if (!window.confirm(`Yakin ingin menghapus seluruh grup link "${groupLabel}"?`)) return;

    const updated = linksList.filter((raw) => {
      const { label } = parseLinkItem(raw);
      return label.trim().toLowerCase() !== groupLabel.trim().toLowerCase();
    });

    if (updated.length === 0) {
      alert('Box harus menyisakan minimal 1 link. Jika ingin menghapus seluruh box, gunakan tombol Hapus Box.');
      return;
    }

    onUpdateLinks(item.id, updated);
  };

  const getCleanDomain = (url: string) => {
    try {
      const formatted = formatUrl(url);
      const parsed = new URL(formatted);
      return parsed.hostname;
    } catch {
      return url;
    }
  };

  return (
    <div
      id={`bookmark-card-${item.id}`}
      className="group relative bg-[#0f1022] hover:bg-[#121429] border border-[#1e2142] hover:border-lime-400/80 hover:shadow-[0_0_25px_rgba(163,230,53,0.25)] rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-xl flex flex-col gap-3.5 select-none overflow-hidden"
    >
      {/* Top Cyber Neon Sweep Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_12px_#a3e635]" />

      {/* Top Header Banner: Badges & Primary Action Buttons (Tambah Link, Copy, Buka Link) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1c2045]">
        {/* Badges */}
        <div className="flex items-center gap-2">
          <span className="bg-[#141a32] text-lime-400 border border-lime-500/30 text-xs font-mono-code font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 uppercase tracking-wide">
            <Globe className="w-3.5 h-3.5 text-lime-400" />
            <span>{item.categoryName || 'DOCS'}</span>
          </span>

          <span className="bg-[#141a32] text-lime-300 border border-lime-500/30 text-xs font-mono-code font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-lime-400" />
            <span>{linksList.length} Link</span>
          </span>

          {(item.perihal || item.ket) && (
            <span className="text-xs text-slate-400 font-mono-code hidden sm:flex items-center gap-1.5 ml-1">
              <span className="text-lime-400 font-bold">•</span>
              <span className="text-slate-300">{item.perihal || item.ket}</span>
            </span>
          )}
        </div>

        {/* Top Right Action Buttons: + Tambah Link, Copy All & BUKA LINK */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDefaultLinkLabel(item.title);
              setShowAddInline(true);
            }}
            className="bg-[#141b2e] border border-lime-500/40 hover:border-lime-400 hover:bg-[#1a253e] text-lime-400 hover:text-white font-medium text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Tambah Link ke Box ini"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5] text-lime-400" />
            <span>+ Tambah Link</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAllLinks}
            className="p-1.5 bg-[#141b2e] border border-[#232a4e] hover:border-lime-400 hover:bg-[#1a253e] text-slate-300 hover:text-lime-400 rounded-xl transition-all cursor-pointer active:scale-95"
            title="Salin Semua Link dalam Box ini"
          >
            {isCopiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleOpenAllLinks}
            className="px-3.5 py-1.5 bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(163,230,53,0.35)] border border-lime-300 cursor-pointer transition-all active:scale-95"
            title={`Sekali klik langsung membuka ${linksList.length} link di tab baru`}
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>BUKA LINK ({linksList.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-3 min-w-0">
        {/* Main Title Row + Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              onClick={handleOpenAllLinks}
              className="font-heading text-sm sm:text-base font-extrabold text-lime-400 tracking-wider uppercase group-hover:text-lime-300 transition-colors cursor-pointer flex items-center gap-2 truncate"
            >
              <span>{item.title}</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-lime-400 transition-colors shrink-0" />
            </h3>
          </div>

          {/* Action Buttons directly next to Main Title */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLinks(!showLinks)}
              className="px-3 py-1.5 bg-[#141b2e] border border-[#232a4e] hover:border-lime-400 hover:bg-[#1a253e] text-lime-400 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title={showLinks ? "Sembunyikan Daftar Link" : "Lihat Daftar Link"}
            >
              {showLinks ? <EyeOff className="w-3.5 h-3.5 text-lime-400" /> : <Eye className="w-3.5 h-3.5 text-lime-400" />}
              <span>{showLinks ? "Sembunyi" : "Lihat Link"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowLinks(true);
                onEdit(item);
              }}
              className="px-3 py-1.5 bg-[#141b2e] border border-[#232a4e] hover:border-lime-400 hover:bg-[#1a253e] text-slate-300 hover:text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Edit Box"
            >
              <Edit3 className="w-3.5 h-3.5 text-lime-400" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="px-3 py-1.5 bg-[#141b2e] border border-[#232a4e] hover:border-rose-500/70 hover:bg-[#28182b] text-slate-300 hover:text-rose-400 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Hapus Box"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Hapus</span>
            </button>
          </div>
        </div>

        {/* Stacked Link Groups & Pills */}
        <div className="space-y-3.5 max-w-3xl">
          {(() => {
            interface GroupedLinks {
              groupLabel: string;
              items: {
                originalIndex: number;
                raw: string;
                label: string;
                rawUrl: string;
              }[];
            }

            const groups: GroupedLinks[] = [];

            linksList.forEach((raw, idx) => {
              const { label, rawUrl } = parseLinkItem(raw);
              const normLabel = label.trim();

              const lastGroup = groups[groups.length - 1];
              if (lastGroup && lastGroup.groupLabel.toLowerCase() === normLabel.toLowerCase()) {
                lastGroup.items.push({ originalIndex: idx, raw, label, rawUrl });
              } else {
                groups.push({
                  groupLabel: normLabel,
                  items: [{ originalIndex: idx, raw, label, rawUrl }],
                });
              }
            });

            return groups.map((group, groupIdx) => {
              // Hide sub-header if groupLabel is empty OR matches the main card item.title
              const isMainGroup =
                !group.groupLabel ||
                group.groupLabel.toLowerCase() === item.title.trim().toLowerCase();

              return (
                <div key={groupIdx} className={!isMainGroup ? 'mt-3 pt-2 border-t border-[#1c2045]' : ''}>
                  {/* Sub-Group Section Header (e.g. BANGKOK 0930, HOKIDRAW 08:00) */}
                  {!isMainGroup && (
                    <div className="mb-2 flex items-center justify-between gap-2 flex-wrap bg-[#10142b] px-3.5 py-1.5 rounded-xl border border-[#202652]">
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderOpen className="w-4 h-4 text-lime-400 shrink-0" />
                        <h4 className="font-heading text-xs sm:text-sm font-bold text-lime-300 uppercase tracking-wide truncate">
                          {group.groupLabel}
                        </h4>
                        <span className="text-[10px] font-mono-code bg-[#171d3d] text-lime-400 px-2 py-0.5 rounded-md border border-lime-500/30 font-medium">
                          {group.items.length} Link
                        </span>
                      </div>

                      {/* Edit & Hapus Buttons for this Sub-Group */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setDefaultLinkLabel(group.groupLabel);
                            setShowAddInline(true);
                            setShowLinks(true);
                          }}
                          className="px-2.5 py-1 bg-[#161c38] hover:bg-[#1d264e] text-lime-300 border border-[#262f5f] hover:border-lime-400 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Tambah Link ke grup "${group.groupLabel}"`}
                        >
                          <Plus className="w-3 h-3 text-lime-400" />
                          <span>+ Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowLinks(true);
                            handleRenameSubGroup(group.groupLabel);
                          }}
                          className="px-2.5 py-1 bg-[#161c38] hover:bg-[#1d264e] text-slate-300 hover:text-lime-300 border border-[#262f5f] hover:border-lime-400 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Edit nama grup "${group.groupLabel}"`}
                        >
                          <Edit3 className="w-3 h-3 text-lime-400" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubGroup(group.groupLabel)}
                          className="px-2.5 py-1 bg-[#161c38] hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-[#262f5f] hover:border-rose-500/60 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title={`Hapus semua link di grup "${group.groupLabel}"`}
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Link Pills in this group - Hidden by default unless showLinks is true */}
                  {showLinks && (
                    <div className="space-y-1.5 animate-fadeIn">
                      {group.items.map((linkObj) => {
                        const { originalIndex, raw, label, rawUrl } = linkObj;
                        const formatted = formatUrl(rawUrl);
                        const domain = getCleanDomain(rawUrl);
                        const isSingleCopied = copiedId === `${item.id}-${originalIndex}`;

                        // Show label if it's different from the group header
                        const showPillLabel = label && label.toLowerCase() !== group.groupLabel.toLowerCase();

                        return (
                          <div
                            key={originalIndex}
                            className="bg-[#080a18] border border-[#191d3d] hover:border-lime-400/70 text-slate-200 px-3.5 py-2 rounded-xl flex items-center justify-between gap-3 text-xs font-mono-code transition-all group/link shadow-sm"
                          >
                            <div
                              className="flex items-center gap-2 truncate cursor-pointer flex-1 min-w-0"
                              onClick={(e) => handleOpenSingleLink(e, raw)}
                              title={formatted}
                            >
                              <LinkIcon className="w-3.5 h-3.5 text-lime-400 shrink-0" />
                              {showPillLabel ? (
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-white font-semibold text-xs uppercase tracking-wide truncate">
                                    {label}
                                  </span>
                                  <span className="text-slate-400 font-normal text-[11px] truncate">
                                    ({domain})
                                  </span>
                                </div>
                              ) : (
                                <span className="truncate text-lime-300 group-hover/link:text-white transition-colors">
                                  {formatted}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCopyLink(formatted);
                                }}
                                className="p-1 text-slate-400 hover:text-lime-300 rounded-md hover:bg-[#131738] transition-colors cursor-pointer"
                                title="Salin Link Ini"
                              >
                                {isSingleCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleOpenSingleLink(e, raw)}
                                className="p-1 text-slate-400 hover:text-lime-300 rounded-md hover:bg-[#131738] transition-colors cursor-pointer"
                                title="Buka Link Ini"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              {linksList.length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteSingleLink(e, originalIndex)}
                                  className="p-1 text-slate-500 hover:text-rose-400 rounded-md hover:bg-[#131738] transition-colors cursor-pointer"
                                  title="Hapus Link Ini"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Modal Popup Dialog for Adding Links (+ Tambah Link) */}
      {showAddInline && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setNewLinksText('');
            setShowAddInline(false);
          }}
        >
          <div
            className="bg-[#121427] border border-[#282b4c] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-left max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0e0f1e] px-6 py-4 border-b border-[#212444] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-lime-400" />
                <h2 className="text-sm sm:text-base font-extrabold text-lime-400 uppercase tracking-wide">
                  TAMBAH LINK KE BOX &quot;{item.title}&quot;
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewLinksText('');
                  setShowAddInline(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#1a1d36] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddLinkSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-sm">
              <div className="space-y-3 bg-[#0d0e1a] border border-[#1e2242] p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-lime-400 uppercase mb-1">
                    Nama / Label Link (Opsional)
                  </label>
                  <input
                    type="text"
                    value={defaultLinkLabel}
                    onChange={(e) => setDefaultLinkLabel(e.target.value)}
                    placeholder={`Contoh: ${item.title}`}
                    className="w-full bg-[#181a30] border border-[#2b2e50] focus:border-lime-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none mb-3 font-medium placeholder:text-slate-500"
                  />

                  <label className="block text-xs font-bold text-lime-400 uppercase mb-1 flex items-center justify-between">
                    <span>Daftar URL Link</span>
                    <span className="text-[10px] text-lime-300 font-normal">Tekan Enter untuk baris baru</span>
                  </label>
                  <div className="bg-[#181a30] border border-[#2b2e50] focus-within:border-lime-400 rounded-xl p-2.5">
                    <textarea
                      value={newLinksText}
                      onChange={(e) => setNewLinksText(e.target.value)}
                      rows={5}
                      required
                      autoFocus
                      placeholder={`${item.title} | https://bruneipools.com/live-draw.html\nhttps://engine2s2.engine4d.com/wap\nhttps://www.vegastogel.net/wap`}
                      className="w-full bg-transparent text-xs text-lime-300 font-mono-code outline-none leading-relaxed resize-y"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    💡 <i>Gunakan format <b>Nama Link | https://url.com</b> atau isi <b>Nama / Label Link</b> di atas agar semua URL otomatis menggunakan nama label tersebut di dalam Box ini.</i>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1e2242]">
                <button
                  type="button"
                  onClick={() => {
                    setNewLinksText('');
                    setShowAddInline(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1c1f3a] text-slate-300 hover:bg-[#252a4e] font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_18px_rgba(163,230,53,0.4)] hover:shadow-[0_0_25px_rgba(163,230,53,0.6)] cursor-pointer transition-all active:scale-95"
                >
                  Simpan Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

