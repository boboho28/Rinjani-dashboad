import React from 'react';
import { X, Download, Copy, ExternalLink, Check } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string;
  categoryName?: string;
  notes?: string;
  onCopyImage?: (url: string) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  title,
  imageUrl,
  categoryName,
  notes,
  onCopyImage,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = () => {
    if (onCopyImage) {
      onCopyImage(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-[#101224] border border-[#272b4d] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0b0c18] px-5 py-3.5 border-b border-[#202340] flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-code font-black px-2 py-0.5 rounded bg-lime-400/20 text-lime-300 border border-lime-500/40 uppercase">
                {categoryName || 'GAMBAR'}
              </span>
              <h2 className="text-sm sm:text-base font-black text-lime-400 uppercase tracking-wide truncate">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                copied
                  ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                  : 'bg-[#1a1d38] text-lime-400 hover:bg-lime-400 hover:text-slate-950 border border-lime-500/40'
              }`}
              title="Salin Link / Data Gambar"
            >
              {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Salin Gambar'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a1d38] text-slate-200 hover:text-lime-400 border border-[#2a2e54] hover:border-lime-400/50 transition-all"
              title="Unduh Gambar ke Perangkat"
            >
              <Download className="w-3.5 h-3.5 text-lime-400" />
              <span className="hidden sm:inline">Unduh</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-[#1c1f3d] hover:bg-[#282d56] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: Main Full Resolution Image Viewer */}
        <div className="flex-1 bg-[#060710] p-4 flex items-center justify-center overflow-auto min-h-[250px] relative group">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-[#202342]"
          />
        </div>

        {/* Footer Notes if available */}
        {notes && (
          <div className="bg-[#0b0c18] border-t border-[#202340] px-5 py-3 text-xs text-slate-300 font-sans">
            <span className="text-[10px] font-mono-code font-bold uppercase text-slate-400 block mb-0.5">Catatan Gambar:</span>
            <p className="leading-relaxed whitespace-pre-wrap">{notes}</p>
          </div>
        )}

      </div>
    </div>
  );
};
