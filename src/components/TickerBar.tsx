import React, { useState, useEffect } from 'react';
import { Bell, Edit2, Check, RotateCcw, X, Volume2 } from 'lucide-react';

const DEFAULT_TICKER_TEXT = "Have a nice day, have a good work, keep up the spirit !! RINJANI SYSTEM - DASHBOARD PENYIMPANAN DATA & KATA-KATA TERPADU";

export const TickerBar: React.FC<{ isWideMode?: boolean }> = () => {
  const [tickerText, setTickerText] = useState<string>(() => {
    return localStorage.getItem('rinjani_ticker_text') || DEFAULT_TICKER_TEXT;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempText, setTempText] = useState(tickerText);

  useEffect(() => {
    localStorage.setItem('rinjani_ticker_text', tickerText);
  }, [tickerText]);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tempText.trim()) return;
    setTickerText(tempText.trim());
    setIsModalOpen(false);
  };

  const handleReset = () => {
    setTempText(DEFAULT_TICKER_TEXT);
    setTickerText(DEFAULT_TICKER_TEXT);
    setIsModalOpen(false);
  };

  return (
    <>
      <div id="ticker-container" className="bg-[#0e0f1a] border-b border-[#1c1e30] py-2 px-4 overflow-hidden text-xs text-slate-300 sticky top-[61px] sm:top-[65px] z-30 shadow-md">
        <div className="w-full mx-auto flex items-center gap-3 px-2">
          
          {/* Left Announcement Tag */}
          <div className="flex items-center gap-1.5 bg-[#ccff00]/15 text-[#ccff00] border border-[#ccff00]/50 text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(204,255,0,0.2)] uppercase tracking-wider font-heading">
            <Bell className="w-3 h-3 text-[#ccff00] animate-bounce" />
            <span>ANNOUNCEMENT</span>
          </div>

          {/* Full Width Running Text */}
          <div className="overflow-hidden whitespace-nowrap text-[#ccff00] font-black tracking-wider flex-1 text-xs sm:text-sm font-heading relative">
            <p className="animate-marquee drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">
              {tickerText} &nbsp;&nbsp;&nbsp;&nbsp; ★ &nbsp;&nbsp;&nbsp;&nbsp; {tickerText}
            </p>
          </div>

          {/* Edit Running Text Button */}
          <button
            onClick={() => {
              setTempText(tickerText);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[#131728] hover:bg-[#1a2038] text-slate-300 hover:text-[#ccff00] border border-[#232942] hover:border-[#ccff00]/50 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 shadow-sm"
            title="Edit Teks Berjalan"
          >
            <Edit2 className="w-3 h-3 text-[#ccff00]" />
            <span className="hidden sm:inline">Ubah Teks</span>
          </button>

        </div>
      </div>

      {/* EDIT TICKER TEXT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e111f] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-[0_0_40px_rgba(204,255,0,0.2)] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1f253d] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00]">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-heading">Pengaturan Teks Berjalan</h3>
                  <p className="text-xs text-slate-400">Ubah teks pengumuman running text dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono-code">
                  Teks Running Text Baru
                </label>
                <textarea
                  value={tempText}
                  onChange={(e) => setTempText(e.target.value)}
                  rows={3}
                  className="w-full bg-[#080a14] border border-[#252c48] focus:border-[#ccff00] rounded-xl p-3 text-sm text-[#ccff00] placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#ccff00] transition-all font-heading"
                  placeholder="Masukkan teks berjalan disini..."
                  autoFocus
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono-code">Contoh Teks Cepat:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTempText("Have a nice day, have a good work, keep up the spirit !! RINJANI SYSTEM - DASHBOARD PENYIMPANAN DATA & KATA-KATA TERPADU")}
                    className="text-[11px] bg-[#161a2e] hover:bg-[#202744] text-slate-300 border border-[#252c4a] px-2.5 py-1 rounded-lg transition-all"
                  >
                    Standard Rinjani
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempText("Selamat Datang di RINJANI SYSTEM - Selalu Cek Update Pasaran & Rekapan Terbaru!")}
                    className="text-[11px] bg-[#161a2e] hover:bg-[#202744] text-slate-300 border border-[#252c4a] px-2.5 py-1 rounded-lg transition-all"
                  >
                    Selamat Datang
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempText("PENGUMUMAN: Pastikan Selalu Memeriksa Hasil Pasaran Secara Berkala dan Melakukan Backup Data!")}
                    className="text-[11px] bg-[#161a2e] hover:bg-[#202744] text-slate-300 border border-[#252c4a] px-2.5 py-1 rounded-lg transition-all"
                  >
                    Pengumuman Penting
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#1f253d] gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-2 rounded-xl border border-transparent hover:border-rose-900/50 hover:bg-rose-950/20 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Default
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#141829] hover:bg-[#1f253f] border border-[#283050] rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-[#ccff00] hover:bg-[#b8e600] rounded-xl shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all font-heading"
                  >
                    <Check className="w-4 h-4" />
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
};


