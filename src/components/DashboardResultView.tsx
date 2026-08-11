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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- ALARM SYSTEM ---
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

  const handleDismissAlarm = () => { stopAlarmSound(); setActiveAlarm(null); };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeAlarm && (e.key === 'Escape' || e.key === ' ' || e.code === 'Space')) {
        handleDismissAlarm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlarm]);

  useEffect(() => {
    if (!isAlarmEnabled) return;
    const nowTotalSecs = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
    const todayDateStr = `${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-${currentTime.getDate()}`;

    pasaranList.forEach((item) => {
      if (item.status === 'BELUM' && (!item.p1Prize || item.p1Prize === '-')) {
        const matchTutup = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
        if (matchTutup) {
          const tutupTotalSecs = parseInt(matchTutup[1], 10) * 3600 + parseInt(matchTutup[2], 10) * 60;
          const diffSecs = tutupTotalSecs - nowTotalSecs;
          if (diffSecs <= 0 && diffSecs >= -3) {
            const key = `${item.id}-${todayDateStr}-${item.jamTutup}`;
            if (!triggeredAlarmsRef.current.has(key)) {
              triggeredAlarmsRef.current.add(key);
              setActiveAlarm({
                pasaranName: item.name, jamTutup: item.jamTutup, jamResult: item.jamResult,
                session: item.session, title: `RESULT ${item.name} ${item.jamTutup}`
              });
              if (!isMuted) startAlarmSound();
            }
          }
        }
      }
    });
  }, [currentTime, pasaranList]);

  // --- TERMINAL & RESULT LOGIC ---
  const [resultStatusInput, setResultStatusInput] = useState<string>('');
  const [p1TerminalInput, setP1TerminalInput] = useState<string>('');
  const [p123TerminalInput, setP123TerminalInput] = useState<string>('');
  const [isResultPopupOpen, setIsResultPopupOpen] = useState<boolean>(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const calculateShio = (p1Prize?: string): { name: string; emoji: string } => {
    if (!p1Prize || p1Prize === '-' || p1Prize.length < 2) return { name: '-', emoji: '❓' };
    const num = parseInt(p1Prize.slice(-2), 10);
    const mod = num % 12;
    const shios = [
      { name: 'KAMBING', emoji: '🐐' }, { name: 'KUDA', emoji: '🐎' }, { name: 'ULAR', emoji: '🐍' },
      { name: 'NAGA', emoji: '🐉' }, { name: 'KELINCI', emoji: '🐇' }, { name: 'HARIMAU', emoji: '🐅' },
      { name: 'KERBAU', emoji: '🐂' }, { name: 'TIKUS', emoji: '🐀' }, { name: 'BABI', emoji: '🐖' },
      { name: 'ANJING', emoji: '🐕' }, { name: 'AYAM', emoji: '🐓' }, { name: 'MONYET', emoji: '🐒' }
    ];
    return shios[mod] || { name: '-', emoji: '❓' };
  };

  const generateResultAnnouncement = (item: PasaranItem): string => {
    const hasResult = item.p1Prize && item.p1Prize !== '-';
    const res = hasResult ? item.p1Prize : '-';
    const shio = calculateShio(res);
    const now = new Date();
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `Hasil Pengeluaran ${item.name}\nHari Ini ${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}\nResult : ${res}\nSHIO : ${hasResult ? shio.name : '-'}\nSelamat Kepada Pemenang, Salam JP Hanya di TogelUP`;
  };

  const handleOpenResultPopup = (item: PasaranItem) => {
    setPopupPasaran(item);
    setPopupText(generateResultAnnouncement(item));
    setIsCopied(false);
    setIsResultPopupOpen(true);
  };

  // --- CRUD FUNCTIONS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PasaranItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formSession, setFormSession] = useState<'PAGI'|'SORE'|'MALAM'>('SORE');
  const [formJamTutup, setFormJamTutup] = useState('');
  const [formJamResult, setFormJamResult] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formP1Prize, setFormP1Prize] = useState('-');
  const [formP2Prize, setFormP2Prize] = useState('-');
  const [formP3Prize, setFormP3Prize] = useState('-');
  const [formStatus, setFormStatus] = useState<'BELUM'|'DONE'|'LIBUR'>('BELUM');

  const handleOpenAddModal = () => {
    setEditItem(null); setFormName(''); setFormSession('SORE'); setFormJamTutup('00:00 WIB');
    setFormJamResult('00:00 WIB'); setFormLinkUrl(''); setFormP1Prize('-'); setFormP2Prize('-');
    setFormP3Prize('-'); setFormStatus('BELUM'); setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PasaranItem) => {
    setEditItem(item); setFormName(item.name); setFormSession(item.session as any);
    setFormJamTutup(item.jamTutup); setFormJamResult(item.jamResult); setFormLinkUrl(item.linkUrl || '');
    setFormP1Prize(item.p1Prize || '-'); setFormP2Prize(item.p2Prize || '-'); setFormP3Prize(item.p3Prize || '-');
    setFormStatus(item.status); setIsModalOpen(true);
  };

  const handleSavePasaran = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      name: formName.toUpperCase(), session: formSession, jamTutup: formJamTutup, jamResult: formJamResult,
      linkUrl: formLinkUrl, p1Prize: formP1Prize, p2Prize: formP2Prize, p3Prize: formP3Prize, status: formStatus 
    };
    if (editItem) setPasaranList(prev => prev.map(p => p.id === editItem.id ? { ...p, ...data } : p));
    else setPasaranList(prev => [{ ...data, id: `p-${Date.now()}`, isResultNow: false }, ...prev]);
    setIsModalOpen(false);
    addToast('Pasaran Berhasil Disimpan', 'success');
  };

  const handleDeletePasaran = (id: string, name: string) => {
    if (window.confirm(`Hapus ${name}?`)) {
      setPasaranList(prev => prev.filter(p => p.id !== id));
      addToast(`${name} Terhapus`, 'info');
    }
  };

  const handleResetSession = () => {
    setPasaranList(prev => prev.map(p => (selectedSession === 'ALL PASARAN' || p.session === selectedSession) ? { ...p, p1Prize: '-', p2Prize: '-', p3Prize: '-', status: 'BELUM' } : p));
    addToast(`Reset Sesi ${selectedSession} Berhasil`, 'success');
  };

  // --- TERMINAL PROCESS ---
  const findTarget = (input: string) => {
    const sorted = [...pasaranList].sort((a, b) => b.name.length - a.name.length);
    return sorted.find(p => input.includes(p.name.toUpperCase())) || pasaranList[0];
  };

  const handleProcessResultStatusInput = (e: React.FormEvent) => {
    e.preventDefault();
    const val = resultStatusInput.trim().toUpperCase();
    if (!val.includes("PERIODE")) return addToast('Gagal! Input harus ada kata "PERIODE"', 'error');
    const target = findTarget(val);
    setPasaranList(prev => prev.map(p => p.id === target.id ? { ...p, status: 'DONE' } : p));
    addToast(`${target.name} DONE`, 'success'); setResultStatusInput('');
  };

  const handleProcessP1Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = p1TerminalInput.trim().toUpperCase();
    const target = findTarget(val);
    const num = val.match(/\d+/g);
    if (num) {
      setPasaranList(prev => prev.map(p => p.id === target.id ? { ...p, p1Prize: num[0] } : p));
      addToast(`P1 ${target.name} Updated`, 'success'); setP1TerminalInput('');
    }
  };

  const handleProcessP123Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = p123TerminalInput.trim().toUpperCase().replace(/(PRIZE|P)\s*[123]:?/gi, ' ');
    const target = findTarget(val);
    const nums = val.match(/\d+/g);
    if (nums) {
      setPasaranList(prev => prev.map(p => p.id === target.id ? { ...p, p1Prize: nums[0] || '-', p2Prize: nums[1] || '-', p3Prize: nums[2] || '-' } : p));
      addToast(`P123 ${target.name} Updated`, 'success'); setP123TerminalInput('');
    }
  };

  // --- SORTING ---
  const sortedList = [...pasaranList]
    .filter(p => selectedSession === 'ALL PASARAN' || selectedSession === 'SEMUA' || p.session === selectedSession)
    .sort((a, b) => {
      const parseTime = (s: string) => { const m = s.match(/(\d+):(\d+)/); return m ? parseInt(m[1])*60 + parseInt(m[2]) : 0; };
      return parseTime(a.jamTutup) - parseTime(b.jamTutup);
    });

  const getStatusBadge = (item: PasaranItem) => {
    if (item.status === 'DONE') return <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-[0_0_10px_rgba(16,185,129,0.4)]">SUDAH RESULT</span>;
    if (item.status === 'LIBUR') return <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-[10px] font-black">LIBUR</span>;
    const match = item.jamTutup.match(/(\d+):(\d+)/);
    if (match) {
      const tutup = parseInt(match[1])*3600 + parseInt(match[2])*60;
      const now = currentTime.getHours()*3600 + currentTime.getMinutes()*60 + currentTime.getSeconds();
      if (tutup - now > 0) {
        const diff = tutup - now;
        const h = Math.floor(diff/3600), m = Math.floor((diff%3600)/60), s = diff%60;
        return <span className="bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-tighter">⏳ TUTUP: {h > 0 ? h+':' : ''}{m < 10 ? '0'+m : m}:{s < 10 ? '0'+s : s}</span>;
      }
    }
    return <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.5)]">RESULT NOW!</span>;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER PANEL */}
      <div className="bg-[#0f111a] border-2 border-[#ccff00]/60 rounded-[30px] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.4)] flex flex-col xl:flex-row gap-6 sticky top-[102px] z-30">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2.5">
            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="bg-[#1a1d2e] border-2 border-[#ccff00]/40 rounded-xl px-4 py-2 text-xs font-black text-[#ccff00] outline-none cursor-pointer hover:border-[#ccff00] uppercase transition-all">
              <option value="SORE">SESI SORE</option><option value="PAGI">SESI PAGI</option><option value="MALAM">SESI MALAM</option><option value="ALL PASARAN">ALL PASARAN</option>
            </select>
            <button onClick={() => setIsMuted(!isMuted)} className={`p-2.5 rounded-xl border-2 transition-all ${isMuted ? 'bg-rose-500/10 border-rose-500/40 text-rose-500' : 'bg-[#ccff00]/10 border-[#ccff00]/40 text-[#ccff00]'}`}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button onClick={() => setShowAlarmConfigModal(true)} className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2 rounded-xl text-[11px] flex items-center gap-2 shadow-lg transition-all active:scale-95 uppercase"><Bell size={14} /> ALARM CFG</button>
            <button onClick={handleOpenAddModal} className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 font-black px-4 py-2 rounded-xl text-[11px] flex items-center gap-2 shadow-lg transition-all active:scale-95 uppercase"><Plus size={16} strokeWidth={3} /> ADD PASARAN</button>
            <button onClick={handleResetSession} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-[11px] flex items-center gap-2 shadow-lg transition-all active:scale-95 uppercase"><RotateCcw size={14} /> RESET SESI</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#ccff00] p-2 rounded-xl shadow-[0_0_15px_rgba(204,255,0,0.4)]"><Zap size={24} className="text-slate-950 fill-current animate-pulse" /></div>
            <div>
              <h1 className="text-2xl font-black text-[#ccff00] uppercase tracking-tighter italic leading-none">Shortcut Result</h1>
              <p className="text-[9px] font-mono font-bold text-[#ccff00]/60 tracking-widest uppercase">Rinjani Data System • Real-Time Terminal</p>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[480px] bg-black/40 border-2 border-[#ccff00]/30 rounded-[24px] p-4 relative">
          <div className="absolute -top-3 left-6 bg-[#ccff00] text-slate-950 px-3 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest">Terminal Prize</div>
          <div className="space-y-2">
            <form onSubmit={handleProcessResultStatusInput} className="flex gap-2">
              <input value={resultStatusInput} onChange={e => setResultStatusInput(e.target.value)} placeholder="LOG STATUS (PERIODE...)" className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-[#ccff00] outline-none focus:border-[#ccff00]/50" />
              <button className="bg-[#ccff00] text-slate-950 font-black px-3 rounded-lg text-[10px] hover:bg-white transition-colors">DONE</button>
            </form>
            <form onSubmit={handleProcessP1Terminal} className="flex gap-2">
              <input value={p1TerminalInput} onChange={e => setP1TerminalInput(e.target.value)} placeholder="P1: NAMA + RESULT" className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-cyan-400 outline-none focus:border-cyan-400/50" />
              <button className="bg-cyan-500 text-white font-black px-3 rounded-lg text-[10px] hover:bg-white hover:text-slate-950 transition-colors">P1</button>
            </form>
            <form onSubmit={handleProcessP123Terminal} className="flex gap-2">
              <textarea value={p123TerminalInput} onChange={e => setP123TerminalInput(e.target.value)} rows={1} placeholder="P123 DATA..." className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-amber-400 outline-none focus:border-amber-400/50 resize-none" />
              <button className="bg-amber-500 text-slate-950 font-black px-3 rounded-lg text-[10px] hover:bg-white transition-colors">P123</button>
            </form>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-[#0b0c14] border border-[#ccff00]/20 rounded-[25px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[65vh] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10 bg-[#161826] shadow-xl">
              <tr className="border-b-2 border-[#ccff00]/30 text-[10px] font-black text-[#ccff00] uppercase tracking-widest">
                <th className="p-4">Sesh</th><th className="p-4">Pasaran</th><th className="p-4 text-center">Tutup</th>
                <th className="p-4 text-center">Result</th><th className="p-4 text-center">Link</th>
                <th className="p-4 text-center">Result Status</th><th className="p-4 text-center">P1</th>
                <th className="p-4 text-center">P2</th><th className="p-4 text-center">P3</th>
                <th className="p-4 text-center">Status</th><th className="p-4 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {sortedList.map(item => (
                <tr key={item.id} className={`hover:bg-[#ccff00]/5 transition-colors group ${item.status === 'DONE' ? 'bg-[#ccff00]/5' : ''}`}>
                  <td className="p-4"><span className="bg-black/40 border border-white/10 px-2 py-0.5 rounded text-[9px] font-black text-slate-400">{item.session}</span></td>
                  <td className="p-4 font-black text-white text-[13px] group-hover:text-[#ccff00] transition-colors">{item.name}</td>
                  <td className="p-4 text-center text-slate-400 font-bold">{item.jamTutup}</td>
                  <td className="p-4 text-center text-slate-400 font-bold">{item.jamResult}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => item.linkUrl && window.open(item.linkUrl, '_blank')} className="p-2 bg-slate-800/50 border border-white/5 rounded-lg text-slate-400 hover:text-[#ccff00] hover:border-[#ccff00] transition-all"><ExternalLink size={14} /></button>
                  </td>
                  <td className="p-4 text-center">{getStatusBadge(item)}</td>
                  <td className="p-4 text-center font-black text-[#ccff00] text-sm drop-shadow-[0_0_5px_rgba(204,255,0,0.5)]">{item.p1Prize}</td>
                  <td className="p-4 text-center text-slate-500 font-bold">{item.p2Prize}</td>
                  <td className="p-4 text-center text-slate-500 font-bold">{item.p3Prize}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-md ${item.status === 'BELUM' ? 'bg-rose-600 text-white' : item.status === 'DONE' ? 'bg-[#ccff00] text-slate-950' : 'bg-slate-700 text-slate-300'}`}>{item.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenResultPopup(item)} className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30 hover:bg-indigo-500 hover:text-white transition-all"><Percent size={14} /></button>
                      <button onClick={() => handleOpenEditModal(item)} className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30 hover:bg-cyan-500 hover:text-white transition-all"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeletePasaran(item.id, item.name)} className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESULT MODAL */}
      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border-2 border-[#ccff00] rounded-[30px] w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-[#ccff00] p-2 rounded-xl"><Sparkles size={20} className="text-slate-950" /></div>
                <h2 className="font-black text-[#ccff00] uppercase tracking-tighter">Result & Shio Analysis</h2>
              </div>
              <button onClick={() => setIsResultPopupOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Result P1</p>
                <div className="text-4xl font-black text-[#ccff00] tracking-tighter font-mono">{popupPasaran.p1Prize && popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '-'}</div>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-center">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Shio</p>
                {(() => {
                  const res = popupPasaran.p1Prize && popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '-';
                  const shio = calculateShio(res);
                  return (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-3xl">{res !== '-' ? shio.emoji : '❓'}</span>
                      <span className="text-xl font-black text-white uppercase italic">{res !== '-' ? shio.name : '-'}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#ccff00] uppercase tracking-widest flex items-center gap-2"><FileText size={12} /> Teks Rekapan</label>
              <textarea value={popupText} readOnly className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs font-mono text-[#ccff00] leading-relaxed outline-none" rows={6} />
              <button onClick={() => { navigator.clipboard.writeText(popupText); setIsCopied(true); addToast('Tersalin!', 'success'); setTimeout(() => setIsCopied(false), 2000); }} className={`w-full py-3.5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-[#ccff00] text-slate-950 hover:bg-white active:scale-95'}`}>
                {isCopied ? <><Check size={18} strokeWidth={3} /> TERKOPY!</> : <><Copy size={18} strokeWidth={2.5} /> SALIN TEKS</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161826] border-2 border-[#ccff00]/30 rounded-[30px] w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
              <h3 className="text-xl font-black text-[#ccff00] uppercase tracking-tighter italic">{editItem ? 'Edit Pasaran' : 'Add Pasaran'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSavePasaran} className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Nama Pasaran</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#ccff00]/50 transition-all uppercase font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Sesi</label>
                <select value={formSession} onChange={e => setFormSession(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                  <option value="SORE">SORE</option><option value="PAGI">PAGI</option><option value="MALAM">MALAM</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Status</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none">
                  <option value="BELUM">BELUM</option><option value="DONE">DONE</option><option value="LIBUR">LIBUR</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Jam Tutup</label>
                <input value={formJamTutup} onChange={e => setFormJamTutup(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Jam Result</label>
                <input value={formJamResult} onChange={e => setFormJamResult(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none" />
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                <div><label className="text-center block text-[10px] font-black text-slate-500 mb-1">P1</label><input value={formP1Prize} onChange={e => setFormP1Prize(e.target.value)} className="w-full bg-black/40 border border-[#ccff00]/40 rounded-xl py-2 text-center text-[#ccff00] font-black outline-none" /></div>
                <div><label className="text-center block text-[10px] font-black text-slate-500 mb-1">P2</label><input value={formP2Prize} onChange={e => setFormP2Prize(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 text-center text-white font-black outline-none" /></div>
                <div><label className="text-center block text-[10px] font-black text-slate-500 mb-1">P3</label><input value={formP3Prize} onChange={e => setFormP3Prize(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 text-center text-white font-black outline-none" /></div>
              </div>
              <div className="col-span-2 flex gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-800 text-slate-400 rounded-xl font-black uppercase text-xs active:scale-95 transition-all">Batal</button>
                <button type="submit" className="flex-[2] py-3 bg-[#ccff00] text-slate-950 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all">Simpan Pasaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALARM POPUP */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#1a1d2e] to-black border-4 border-[#ccff00] rounded-[50px] p-10 text-center shadow-[0_0_80px_rgba(204,255,0,0.3)] space-y-6 max-w-2xl w-full">
            <div className="flex items-center justify-center gap-3 bg-[#ccff00] text-slate-950 px-6 py-2 rounded-2xl font-black uppercase tracking-widest text-sm mx-auto w-fit shadow-xl"><AlarmClock size={20} className="animate-bounce" /> Rinjani System Alert</div>
            <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">{activeAlarm.pasaranName}</h2>
            <div className="text-3xl font-black text-[#ccff00] uppercase tracking-widest italic">JAM RESULT {activeAlarm.jamResult}</div>
            <button onClick={handleDismissAlarm} className="bg-[#ccff00] text-slate-950 font-black text-3xl px-16 py-5 rounded-[25px] shadow-[0_15px_40px_rgba(204,255,0,0.4)] hover:bg-white transition-all active:scale-90 uppercase italic">Konfirmasi</button>
          </div>
        </div>
      )}

      {/* ALARM CONFIG MODAL */}
      {showAlarmConfigModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161826] border-2 border-[#ccff00]/30 rounded-[30px] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-[#ccff00] uppercase italic">Alarm Config</h3>
              <button onClick={() => setShowAlarmConfigModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-white/5">
                <div><div className="text-white font-black uppercase text-xs italic">Auto Popup</div><div className="text-slate-500 text-[10px] font-bold uppercase mt-1">Muncul saat jam result</div></div>
                <input type="checkbox" checked={isAlarmEnabled} onChange={e => setIsAlarmEnabled(e.target.checked)} className="w-7 h-7 accent-[#ccff00] cursor-pointer" />
              </div>
              <div className="flex items-center justify-between bg-black/40 p-5 rounded-2xl border border-white/5">
                <div><div className="text-white font-black uppercase text-xs italic">Sirine Audio</div><div className="text-slate-500 text-[10px] font-bold uppercase mt-1">{isMuted ? 'Muted' : 'Aktif'}</div></div>
                <button onClick={() => setIsMuted(!isMuted)} className={`px-5 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${isMuted ? 'bg-rose-500/20 text-rose-500' : 'bg-[#ccff00]/20 text-[#ccff00]'}`}>{isMuted ? 'MUTE' : 'UNMUTE'}</button>
              </div>
              <button onClick={() => { setShowAlarmConfigModal(false); if (!isMuted) startAlarmSound(); setActiveAlarm({ pasaranName: 'TEST ALARM', jamTutup: '00:00', jamResult: '00:00', session: 'SORE', title: 'SYSTEM CHECK' }); }} className="w-full bg-[#ccff00] text-slate-950 font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase italic">Test Alarm System</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
