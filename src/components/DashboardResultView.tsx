import React, { useState, useEffect, useRef } from 'react';
import { PasaranItem } from '../types';
import {
  Plus,
  BarChart2,
  Bell,
  Volume2,
  VolumeX,
  ExternalLink,
  Edit2,
  Trash2,
  Check,
  ChevronDown,
  Terminal,
  Search,
  Sparkles,
  Percent,
  X,
  Zap,
  RotateCcw,
  AlarmClock,
  Play,
  Copy,
  FileText,
} from 'lucide-react';

export interface AlarmItem {
  pasaranName: string;
  jamTutup: string;
  jamResult: string;
  p1Prize?: string;
  session: string;
  title?: string;
}

interface DashboardResultViewProps {
  pasaranList: PasaranItem[];
  setPasaranList: React.Dispatch<React.SetStateAction<PasaranItem[]>>;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const DashboardResultView: React.FC<DashboardResultViewProps> = ({
  pasaranList,
  setPasaranList,
  addToast,
}) => {
  // --- SESSION PERSISTENCE ---
  const [selectedSession, setSelectedSession] = useState<string>(() => {
    return localStorage.getItem('rinjani_last_result_session') || 'SORE';
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    localStorage.setItem('rinjani_last_result_session', selectedSession);
  }, [selectedSession]);

  // Live 1-second clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- ALARM SYSTEM LOGIC ---
  const [activeAlarm, setActiveAlarm] = useState<AlarmItem | null>(null);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState<boolean>(true);
  const [showAlarmConfigModal, setShowAlarmConfigModal] = useState<boolean>(false);
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);

  const stopAlarmSound = () => {
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const startAlarmSound = () => {
    if (isMuted) return;
    stopAlarmSound();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      const playBeep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      };
      playBeep();
      alarmIntervalRef.current = setInterval(playBeep, 700);
    } catch (err) {}
  };

  const handleDismissAlarm = () => {
    stopAlarmSound();
    setActiveAlarm(null);
  };

  useEffect(() => {
    if (!isAlarmEnabled) return;
    const nowTotalSecs = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
    const todayDateStr = `${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-${currentTime.getDate()}`;

    pasaranList.forEach((item) => {
      if (item.status === 'BELUM') {
        const matchTutup = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
        if (matchTutup) {
          const tutupTotalSecs = parseInt(matchTutup[1]) * 3600 + parseInt(matchTutup[2]) * 60;
          const diff = tutupTotalSecs - nowTotalSecs;
          if (diff <= 0 && diff >= -3) {
            const key = `${item.id}-${todayDateStr}`;
            if (!triggeredAlarmsRef.current.has(key)) {
              triggeredAlarmsRef.current.add(key);
              setActiveAlarm({
                pasaranName: item.name,
                jamTutup: item.jamTutup,
                jamResult: item.jamResult,
                p1Prize: item.p1Prize,
                session: item.session,
                title: `RESULT ${item.name}`
              });
              if (!isMuted) startAlarmSound();
            }
          }
        }
      }
    });
  }, [currentTime, pasaranList, isAlarmEnabled]);

  // --- MODAL & FORM STATES ---
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<PasaranItem | null>(null);

  const [formName, setFormName] = useState<string>('');
  const [formSession, setFormSession] = useState<'PAGI' | 'SORE' | 'MALAM' | 'DINI HARI'>('SORE');
  const [formJamTutup, setFormJamTutup] = useState<string>('');
  const [formJamResult, setFormJamResult] = useState<string>('');
  const [formLinkUrl, setFormLinkUrl] = useState<string>('');
  const [formP1Prize, setFormP1Prize] = useState<string>('-');
  const [formP2Prize, setFormP2Prize] = useState<string>('-');
  const [formP3Prize, setFormP3Prize] = useState<string>('-');
  const [formStatus, setFormStatus] = useState<'BELUM' | 'DONE' | 'LIBUR'>('BELUM');

  // --- REKAPAN SHIO LOGIC ---
  const [isResultPopupOpen, setIsResultPopupOpen] = useState<boolean>(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // --- TERMINAL INPUT STATES ---
  const [resultStatusInput, setResultStatusInput] = useState<string>('');
  const [p1TerminalInput, setP1TerminalInput] = useState<string>('');
  const [p123TerminalInput, setP123TerminalInput] = useState<string>('');

  // --- FUNCTIONS ---

  const handleOpenAddModal = () => {
    setEditItem(null);
    setFormName('');
    setFormSession('SORE');
    setFormJamTutup(''); // DIBUAT KOSONG TOTAL
    setFormJamResult(''); // DIBUAT KOSONG TOTAL
    setFormLinkUrl('');   // DIBUAT KOSONG TOTAL
    setFormP1Prize('-');
    setFormP2Prize('-');
    setFormP3Prize('-');
    setFormStatus('BELUM');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PasaranItem) => {
    setEditItem(item);
    setFormName(item.name);
    setFormSession(item.session);
    setFormJamTutup(item.jamTutup);
    setFormJamResult(item.jamResult);
    setFormLinkUrl(item.linkUrl || '');
    setFormP1Prize(item.p1Prize || '-');
    setFormP2Prize(item.p2Prize || '-');
    setFormP3Prize(item.p3Prize || '-');
    setFormStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSavePasaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return addToast("Nama pasaran wajib diisi", "error");

    const pasaranData: any = {
      name: formName.toUpperCase(),
      session: formSession,
      jamTutup: formJamTutup || '00:00 WIB',
      jamResult: formJamResult || '00:00 WIB',
      linkUrl: formLinkUrl,
      p1Prize: formP1Prize,
      p2Prize: formP2Prize,
      p3Prize: formP3Prize,
      status: formStatus,
      isResultNow: false
    };

    if (editItem) {
      setPasaranList(prev => prev.map(p => p.id === editItem.id ? { ...p, ...pasaranData } : p));
      addToast(`Pasaran ${formName} diperbarui`, "success");
    } else {
      const newItem = { ...pasaranData, id: 'p-' + Date.now() };
      setPasaranList(prev => [newItem, ...prev]);
      addToast(`Pasaran ${formName} ditambahkan`, "success");
    }
    setIsModalOpen(false);
  };

  const handleDeletePasaran = (id: string) => {
    if (window.confirm("Hapus pasaran ini?")) {
      setPasaranList(prev => prev.filter(p => p.id !== id));
      addToast("Pasaran dihapus", "info");
    }
  };

  const filteredList = pasaranList.filter(item => {
    if (selectedSession === 'ALL PASARAN' || selectedSession === 'SEMUA') return true;
    return item.session === selectedSession;
  });

  const getUrls = (url?: string) => url ? url.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0) : [];

  const calculateShio = (p1Prize?: string): { name: string; emoji: string } => {
    if (!p1Prize || p1Prize === '-') return { name: '-', emoji: '❓' };
    const last2 = p1Prize.replace(/\D/g, '').slice(-2);
    if (!last2) return { name: '-', emoji: '❓' };
    const num = parseInt(last2, 10);
    const mod = num % 12;
    const shios: any = {
      1: { name: 'KUDA', emoji: '🐎' }, 2: { name: 'ULAR', emoji: '🐍' }, 3: { name: 'NAGA', emoji: '🐉' },
      4: { name: 'KELINCI', emoji: '🐇' }, 5: { name: 'HARIMAU', emoji: '🐅' }, 6: { name: 'KERBAU', emoji: '🐂' },
      7: { name: 'TIKUS', emoji: '🐀' }, 8: { name: 'BABI', emoji: '🐖' }, 9: { name: 'ANJING', emoji: '🐕' },
      10: { name: 'AYAM', emoji: '🐓' }, 11: { name: 'MONYET', emoji: '🐒' }, 0: { name: 'KAMBING', emoji: '🐐' }
    };
    return shios[mod] || { name: '-', emoji: '❓' };
  };

  return (
    <div className="space-y-5 font-sans">
      
      {/* HEADER TOOLBAR */}
      <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-[102px] z-30 shadow-2xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-[#151128] border-2 border-[#ccff00]/60 rounded-2xl px-3 py-1.5 shadow-[0_0_12px_rgba(204,255,0,0.2)]">
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="bg-transparent outline-none cursor-pointer font-mono-code font-extrabold text-[#ccff00] uppercase text-sm"
            >
              <option value="SORE">SESI SORE</option>
              <option value="PAGI">SESI PAGI</option>
              <option value="MALAM">SESI MALAM</option>
              <option value="ALL PASARAN">ALL PASARAN</option>
            </select>
          </div>

          <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-[#181a2c] border-2 border-[#ccff00]/50 text-[#ccff00] rounded-2xl">
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button onClick={handleOpenAddModal} className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 font-black px-4 py-2 rounded-2xl text-sm flex items-center gap-1.5 shadow-lg">
            <Plus className="w-4 h-4 stroke-[3]" /> <span>ADD PASARAN</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#ccff00] animate-pulse" />
            <h1 className="text-xl font-black text-[#ccff00] font-brand tracking-widest uppercase">SHORTCUT RESULT</h1>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#080b14] border border-[#ccff00]/30 rounded-2xl p-4 shadow-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b-2 border-[#ccff00]/40 text-[11px] font-mono-code uppercase text-[#ccff00]">
              <th className="py-3 px-3">SESH</th>
              <th className="py-3 px-3">NAMA PASARAN</th>
              <th className="py-3 px-3 text-center">JAM TUTUP</th>
              <th className="py-3 px-3 text-center">JAM RESULT</th>
              <th className="py-3 px-3 text-center">LINK</th>
              <th className="py-3 px-3 text-center">P1</th>
              <th className="py-3 px-3 text-center">STATUS</th>
              <th className="py-3 px-3 text-right">OPSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ccff00]/10 text-xs font-mono-code">
            {filteredList.map((item) => (
              <tr key={item.id} className="hover:bg-[#ccff00]/5 transition-all group">
                <td className="py-2.5 px-3 uppercase">{item.session}</td>
                <td className="py-2.5 px-3 font-black text-[#ccff00]">{item.name}</td>
                <td className="py-2.5 px-3 text-center">{item.jamTutup}</td>
                <td className="py-2.5 px-3 text-center">{item.jamResult}</td>
                <td className="py-2.5 px-3 text-center">
                  <button onClick={() => getUrls(item.linkUrl).forEach(u => window.open(u, '_blank'))} className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] rounded-lg">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
                <td className="py-2.5 px-3 text-center font-black text-[#ccff00]">{item.p1Prize}</td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`px-2 py-1 rounded-lg font-black text-[10px] ${item.status === 'DONE' ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={() => handleOpenEditModal(item)} className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeletePasaran(item.id)} className="p-1.5 bg-rose-950 text-rose-400 border border-rose-500/40 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL ADD/EDIT PASARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1222] border-2 border-[#ccff00]/60 rounded-3xl w-full max-w-lg p-6 shadow-[0_0_40px_rgba(204,255,0,0.3)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#ccff00]/30 pb-3">
              <h3 className="text-lg font-black text-[#ccff00] font-brand uppercase">{editItem ? 'EDIT PASARAN' : 'TAMBAH PASARAN BARU'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X /></button>
            </div>

            <form onSubmit={handleSavePasaran} className="space-y-4 text-xs font-mono-code">
              <div>
                <label className="block text-slate-400 font-bold mb-1">NAMA PASARAN</label>
                <input 
                    type="text" 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="Contoh: TOTOMACAU SORE" 
                    className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none" 
                    required 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">SESI SHIFT</label>
                  <select value={formSession} onChange={(e) => setFormSession(e.target.value as any)} className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none">
                    <option value="SORE">SORE</option>
                    <option value="PAGI">PAGI</option>
                    <option value="MALAM">MALAM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">STATUS AKSI</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none">
                    <option value="BELUM">BELUM</option>
                    <option value="DONE">DONE</option>
                    <option value="LIBUR">LIBUR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">JAM TUTUP</label>
                  <input 
                    type="text" 
                    value={formJamTutup} 
                    onChange={(e) => setFormJamTutup(e.target.value)} 
                    placeholder="Contoh: 15:00 WIB"
                    className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">JAM RESULT</label>
                  <input 
                    type="text" 
                    value={formJamResult} 
                    onChange={(e) => setFormJamResult(e.target.value)} 
                    placeholder="Contoh: 16:15 WIB"
                    className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">LINK LIVE DRAW (Multi-Link)</label>
                <textarea 
                    rows={2} 
                    value={formLinkUrl} 
                    onChange={(e) => setFormLinkUrl(e.target.value)} 
                    placeholder="Masukkan Link Live Draw Pasaran" 
                    className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none resize-none" 
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-slate-400 font-bold mb-1">PRIZE P1</label><input type="text" value={formP1Prize} onChange={(e) => setFormP1Prize(e.target.value)} className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-2 py-2 text-center text-[#ccff00] outline-none" /></div>
                <div><label className="block text-slate-400 font-bold mb-1">PRIZE P2</label><input type="text" value={formP2Prize} onChange={(e) => setFormP2Prize(e.target.value)} className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-2 py-2 text-center text-slate-300 outline-none" /></div>
                <div><label className="block text-slate-400 font-bold mb-1">PRIZE P3</label><input type="text" value={formP3Prize} onChange={(e) => setFormP3Prize(e.target.value)} className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-2 py-2 text-center text-slate-300 outline-none" /></div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[#ccff00]/20">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold">Batal</button>
                <button type="submit" className="px-6 py-2 bg-[#ccff00] text-black rounded-xl font-black uppercase shadow-lg shadow-lime-900/40">SIMPAN PASARAN</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALARM POPUP */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#141a0d] to-[#05060a] border-4 border-[#ccff00] rounded-3xl p-10 text-center space-y-6 shadow-[0_0_60px_rgba(204,255,0,0.5)]">
            <h2 className="text-5xl font-brand font-black text-white uppercase">{activeAlarm.title}</h2>
            <div className="text-2xl font-black text-[#ccff00]">JAM RESULT {activeAlarm.jamResult}</div>
            <button onClick={handleDismissAlarm} className="bg-[#ccff00] text-black text-2xl font-black px-12 py-4 rounded-2xl shadow-2xl scale-110">OK / TUTUP</button>
          </div>
        </div>
      )}

    </div>
  );
};
