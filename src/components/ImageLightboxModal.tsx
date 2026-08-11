import React from 'react';
import { X, Download, Copy, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-xl animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative bg-[#101224] border border-[#272b4d] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] z-10">
        
        <div className="bg-[#0b0c18] px-5 py-4 border-b border-[#202340] flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono-code font-black px-2 py-0.5 rounded bg-lime-400/20 text-lime-300 border border-lime-500/40 uppercase">
                {categoryName || 'GAMBAR'}
              </span>
              <h2 className="text-sm sm:text-lg font-black text-lime-400 uppercase tracking-wide truncate">{title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                copied ? 'bg-emerald-400 text-slate-950' : 'bg-[#1a1d38] text-lime-400 border border-lime-500/40'
              }`}
            >
              {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span className="hidden md:inline">{copied ? 'TERSALIN!' : 'SALIN GAMBAR'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-[#1a1d38] text-slate-200 hover:text-lime-400 border border-[#2a2e54]"
            >
              <Download className="w-4 h-4 text-lime-400" /><span className="hidden md:inline">UNDUH</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl bg-[#1c1f3d] hover:bg-red-500 transition-colors"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div className="flex-1 bg-[#060710] p-4 flex items-center justify-center overflow-auto min-h-[300px]">
          <img
            src={imageUrl}
            alt={title}
            style={{ imageRendering: 'auto', maxHeight: '78vh' }}
            className="w-auto max-w-full object-contain rounded shadow-2xl border border-[#1e213b]"
          />
        </div>

        {notes && (
          <div className="bg-[#0b0c18] border-t border-[#202340] px-6 py-4 text-xs sm:text-sm text-slate-300">
            <span className="text-[10px] font-mono-code font-bold uppercase text-lime-500 block mb-1">Catatan :</span>
            <p className="leading-relaxed whitespace-pre-wrap">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
