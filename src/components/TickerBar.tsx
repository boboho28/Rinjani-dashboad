import React, { useState } from 'react';
import { Bell, Edit2, Check, RotateCcw, X, Volume2 } from 'lucide-react';

interface TickerBarProps {
  tickerText: string;
  setTickerText: (text: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({ tickerText, setTickerText }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempText, setTempText] = useState(tickerText);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempText.trim()) return;
    setTickerText(tempText.trim());
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="bg-[#0e0f1a] border-b border-[#1c1e30] py-2 px-4 overflow-hidden sticky top-[65px] z-30 shadow-md">
        <div className="w-full flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-lime-400/15 text-lime-400 border border-lime-400/50 text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 animate-pulse">
            <Bell className="w-3 h-3" />
            <span>ANNOUNCEMENT</span>
          </div>

          <div className="overflow-hidden whitespace-nowrap text-lime-400 font-black tracking-wider flex-1 text-sm">
            <p className="animate-marquee">
              {tickerText} &nbsp;&nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp;&nbsp; {tickerText}
            </p>
          </div>

          <button
            onClick={() => { setTempText(tickerText); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 bg-[#131728] border border-[#232942] px-2.5 py-1 rounded-lg text-[11px] text-slate-300 hover:text-lime-400 transition-all cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Ubah Teks</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111f] border-2 border-lime-400/60 rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold">Ubah Teks Berjalan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <textarea
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                className="w-full bg-black border border-slate-700 rounded-xl p-3 text-lime-400 outline-none focus:border-lime-400"
                rows={3}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400">Batal</button>
                <button type="submit" className="bg-lime-400 text-black px-4 py-2 rounded-xl font-black">SIMPAN KE DATABASE</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
