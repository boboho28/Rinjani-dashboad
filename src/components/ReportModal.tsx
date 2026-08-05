import React, { useState } from 'react';
import { ReportItem, TemplateItem } from '../types';
import { X, AlertTriangle, Send, History } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateItem | null;
  reports: ReportItem[];
  onAddReport: (templateId: string, templateTitle: string, note: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  template,
  reports,
  onAddReport,
}) => {
  const [note, setNote] = useState('');

  if (!isOpen || !template) return null;

  const templateReports = reports.filter((r) => r.templateId === template.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    onAddReport(template.id, template.title, note.trim());
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#131422] border border-[#2b2e47] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#0e0f1a] px-6 py-4 border-b border-[#212338] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-lime-400" />
            <h2 className="text-sm font-black text-lime-400">
              LAPORAN & LOG: {template.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-[#1c1e30] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Add Report Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block font-bold text-lime-400 uppercase">
              Kirim Laporan / Catatan Kendala Operasional
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tuliskan catatan kendala (contoh: 'Template ini perlu diperbarui karena bank offline berubah jam...')"
              rows={3}
              required
              className="w-full bg-[#181a2b] border border-[#2c2f4a] focus:border-lime-400 rounded-xl p-3 text-slate-100 outline-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition-all"
              >
                <Send className="w-3.5 h-3.5 text-slate-950" />
                <span>Kirim Report</span>
              </button>
            </div>
          </form>

          {/* Existing Log Entries */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase mb-2 border-t border-[#202238] pt-4">
              <History className="w-4 h-4 text-lime-400" />
              <span>Riwayat Laporan Terkait ({templateReports.length})</span>
            </div>

            {templateReports.length === 0 ? (
              <p className="text-slate-500 italic py-2">Belum ada laporan kendala untuk template ini.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {templateReports.map((r) => (
                  <div key={r.id} className="bg-[#181a2b] border border-[#24263f] p-3 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-bold text-lime-400">{r.user}</span>
                      <span>{new Date(r.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-slate-200 text-xs leading-snug">{r.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#0e0f1a] px-6 py-3 border-t border-[#212338] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c1e30] hover:bg-[#282a45] text-slate-300 text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
