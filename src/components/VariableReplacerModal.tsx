import React, { useState, useEffect } from 'react';
import { TemplateItem } from '../types';
import { X, Copy, Check, Sparkles } from 'lucide-react';

interface VariableReplacerModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateItem | null;
  onCopy: (text: string) => void;
}

export const VariableReplacerModal: React.FC<VariableReplacerModalProps> = ({
  isOpen,
  onClose,
  template,
  onCopy,
}) => {
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [variables, setVariables] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (template) {
      const matches = template.ket.match(/\{([a-zA-Z0-9_]+)\}/g);
      if (matches) {
        const uniqueVars = Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, ''))));
        setVariables(uniqueVars);
        const initialVals: Record<string, string> = {};
        uniqueVars.forEach((v: string) => {
          initialVals[v] = '';
        });
        setVarValues(initialVals);
      } else {
        setVariables([]);
      }
    }
  }, [template]);

  if (!isOpen || !template) return null;

  // Compute final generated text
  let previewText = template.ket;
  variables.forEach((v) => {
    const val = varValues[v] || `{${v}}`;
    previewText = previewText.replaceAll(`{${v}}`, val);
  });

  const handleCopy = () => {
    onCopy(previewText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#131422] border border-[#2b2e47] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#0e0f1a] px-6 py-4 border-b border-[#212338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-lime-400" />
            <h2 className="text-sm font-black text-lime-400">
              ISI PARAMETER VARIABEL TEMPLATE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#1c1e30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <p className="text-slate-300">
            Ketikkan nilai untuk variabel di bawah ini agar teks siap dipakai secara otomatis:
          </p>

          {/* Dynamic Input Fields */}
          <div className="space-y-3 bg-[#181a2b] border border-[#262842] p-4 rounded-xl">
            {variables.map((v) => (
              <div key={v}>
                <label className="block text-[11px] font-bold text-lime-400 uppercase mb-1">
                  Parameter: <span className="font-mono text-lime-300 font-bold">{`{${v}}`}</span>
                </label>
                <input
                  type="text"
                  value={varValues[v] || ''}
                  onChange={(e) =>
                    setVarValues((prev) => ({ ...prev, [v]: e.target.value }))
                  }
                  placeholder={`Isi nilai untuk ${v}...`}
                  className="w-full bg-[#10111d] border border-[#2e3152] focus:border-lime-400 rounded-xl px-3 py-2 text-slate-100 text-xs outline-none"
                />
              </div>
            ))}
          </div>

          {/* Live Preview Box */}
          <div>
            <label className="block font-bold text-slate-400 uppercase mb-1">
              Pratinjau Hasil Teks Siap Disalin:
            </label>
            <div className="bg-[#0e0f1a] border border-[#23253b] rounded-xl p-3.5 text-lime-200 font-sans leading-relaxed whitespace-pre-wrap">
              {previewText}
            </div>
          </div>
        </div>

        {/* Footer Copy Button */}
        <div className="bg-[#0e0f1a] px-6 py-3 border-t border-[#212338] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c1e30] hover:bg-[#282a45] text-slate-300 text-xs font-bold transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all ${
              copied
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-950/40'
                : 'bg-gradient-to-r from-lime-400 via-lime-500 to-emerald-400 hover:from-lime-300 text-slate-950 shadow-lime-950/40'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>BERHASIL DISALIN!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>SALIN HASIL SEKARANG</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
