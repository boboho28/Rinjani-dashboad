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

  // --- ALARM SYSTEM STATE & LOGIC ---
  const [activeAlarm, setActiveAlarm] = useState<AlarmItem | null>(null);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState<boolean>(true);
  const [showAlarmConfigModal, setShowAlarmConfigModal] = useState<boolean>(false);
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());

  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<any>(null);

  const stopAlarmSound = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const startAlarmSound = () => {
    if (isMuted) return;
    stopAlarmSound();
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const playBeepSeq = () => {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      };

      playBeepSeq();
      alarmIntervalRef.current = setInterval(playBeepSeq, 700);
    } catch (err) {
      console.warn('Audio alarm playback issue:', err);
    }
  };

  const handleDismissAlarm = () => {
    stopAlarmSound();
    setActiveAlarm(null);
  };

  const triggerAlarm = (alarmData: AlarmItem) => {
    setActiveAlarm(alarmData);
    if (!isMuted) startAlarmSound();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeAlarm && (e.key === 'Escape' || e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        handleDismissAlarm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAlarm]);

  useEffect(() => {
    if (!isAlarmEnabled) return;
    const now = currentTime;
    const nowTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const todayDateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    pasaranList.forEach((item) => {
      if (item.status === 'BELUM' && (!item.p1Prize || item.p1Prize === '-')) {
        const matchTutup = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
        if (matchTutup) {
          const tutupTotalSecs = parseInt(matchTutup[1], 10) * 3600 + parseInt(matchTutup[2], 10) * 60;
          const diffSecs = tutupTotalSecs - nowTotalSecs;
          if (diffSecs <= 0 && diffSecs >= -3) {
            const triggerKey = `${item.id}-${todayDateStr}-${item.jamTutup}`;
            if (!triggeredAlarmsRef.current.has(triggerKey)) {
              triggeredAlarmsRef.current.add(triggerKey);
              triggerAlarm({
                pasaranName: item.name,
                jamTutup: item.jamTutup,
                jamResult: item.jamResult,
                p1Prize: item.p1Prize && item.p1Prize !== '-' ? item.p1Prize : undefined,
                session: item.session,
                title: `RESULT ${item.name} ${item.jamTutup.replace(' WIB', '')}`,
              });
            }
          }
        }
      }
    });
  }, [currentTime, pasaranList, isAlarmEnabled]);

  // Terminal States
  const [resultStatusInput, setResultStatusInput] = useState<string>('');
  const [p1TerminalInput, setP1TerminalInput] = useState<string>('');
  const [p123TerminalInput, setP123TerminalInput] = useState<string>('');

  // Result Popup States
  const [isResultPopupOpen, setIsResultPopupOpen] = useState<boolean>(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const calculateShio = (p1Prize?: string): { name: string; emoji: string; formula: string; last2: string } => {
    if (!p1Prize || p1Prize === '-') return { name: '-', emoji: '❓', formula: 'Result P1 belum diinput', last2: '-' };
    const clean = p1Prize.replace(/\D/g, '');
    if (clean.length < 2) return { name: '-', emoji: '❓', formula: 'Result < 2 digit', last2: '-' };
    const last2 = clean.slice(-2);
    if (last2 === '00') return { name: 'KELINCI', emoji: '🐇', formula: '2D = 00 → KELINCI', last2 };
    const num = parseInt(last2, 10);
    const mod = num % 12;
    switch (mod) {
      case 1: return { name: 'KUDA', emoji: '🐎', formula: `${last2} mod 12 = 1 → KUDA`, last2 };
      case 2: return { name: 'ULAR', emoji: '🐍', formula: `${last2} mod 12 = 2 → ULAR`, last2 };
      case 3: return { name: 'NAGA', emoji: '🐉', formula: `${last2} mod 12 = 3 → NAGA`, last2 };
      case 4: return { name: 'KELINCI', emoji: '🐇', formula: `${last2} mod 12 = 4 → KELINCI`, last2 };
      case 5: return { name: 'HARIMAU', emoji: '🐅', formula: `${last2} mod 12 = 5 → HARIMAU`, last2 };
      case 6: return { name: 'KERBAU', emoji: '🐂', formula: `${last2} mod 12 = 6 → KERBAU`, last2 };
      case 7: return { name: 'TIKUS', emoji: '🐀', formula: `${last2} mod 12 = 7 → TIKUS`, last2 };
      case 8: return { name: 'BABI', emoji: '🐖', formula: `${last2} mod 12 = 8 → BABI`, last2 };
      case 9: return { name: 'ANJING', emoji: '🐕', formula: `${last2} mod 12 = 9 → ANJING`, last2 };
      case 10: return { name: 'AYAM', emoji: '🐓', formula: `${last2} mod 12 = 10 → AYAM`, last2 };
      case 11: return { name: 'MONYET', emoji: '🐒', formula: `${last2} mod 12 = 11 → MONYET`, last2 };
      case 0: return { name: 'KAMBING', emoji: '🐐', formula: `${last2} mod 12 = 0 → KAMBING`, last2 };
      default: return { name: '-', emoji: '❓', formula: '-', last2 };
    }
  };

  const generateResultAnnouncement = (item: PasaranItem): string => {
    const hasResult = item.p1Prize && item.p1Prize !== '-';
    const resultStr = hasResult ? item.p1Prize! : '-';
    const shioObj = calculateShio(resultStr);
    const now = new Date();
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `Hasil Pengeluaran ${item.name}\nHari Ini ${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}\nResult : ${resultStr}\nSHIO : ${hasResult ? shioObj.name : '-'}\nSelamat Kepada Pemenang, Salam JP Hanya di TogelUP`;
  };

  const handleOpenResultPopup = (item: PasaranItem) => {
    setPopupPasaran(item);
    setPopupText(generateResultAnnouncement(item));
    setIsCopied(false);
    setIsResultPopupOpen(true);
  };

  // CRUD States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<PasaranItem | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formSession, setFormSession] = useState<'PAGI' | 'SORE' | 'MALAM' | 'DINI HARI'>('SORE');
  const [formJamTutup, setFormJamTutup] = useState<string>('15:00 WIB');
  const [formJamResult, setFormJamResult] = useState<string>('16:15 WIB');
  const [formLinkUrl, setFormLinkUrl] = useState<string>('');
  const [formP1Prize, setFormP1Prize] = useState<string>('-');
  const [formP2Prize, setFormP2Prize] = useState<string>('-');
  const [formP3Prize, setFormP3Prize] = useState<string>('-');
  const [formStatus, setFormStatus] = useState<'BELUM' | 'DONE' | 'LIBUR'>('BELUM');

  const filteredList = pasaranList.filter((item) => {
    if (selectedSession === 'SEMUA' || selectedSession === 'ALL PASARAN') return true;
    return item.session === selectedSession;
  });

  const sortedFilteredList = [...filteredList].sort((a, b) => {
    const getTimeValue = (jamStr: string) => {
      const match = jamStr.match(/(\d{1,2}):(\d{2})/);
      return match ? parseInt(match[1], 10) * 60 + parseInt(match[2], 10) : 0;
    };
    return getTimeValue(a.jamTutup) - getTimeValue(b.jamTutup);
  });

  const handleOpenAddModal = () => {
    setEditItem(null); setFormName(''); setFormSession('SORE'); setFormJamTutup('18:00 WIB'); setFormJamResult('18:30 WIB');
    setFormLinkUrl(''); setFormP1Prize('-'); setFormP2Prize('-'); setFormP3Prize('-'); setFormStatus('BELUM');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PasaranItem) => {
    setEditItem(item); setFormName(item.name); setFormSession(item.session); setFormJamTutup(item.jamTutup);
    setFormJamResult(item.jamResult); setFormLinkUrl(item.linkUrl || ''); setFormP1Prize(item.p1Prize || '-');
    setFormP2Prize(item.p2Prize || '-'); setFormP3Prize(item.p3Prize || '-'); setFormStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSavePasaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return addToast('Nama pasaran kosong.', 'error');
    const data = {
      name: formName.trim().toUpperCase(), session: formSession, jamTutup: formJamTutup, jamResult: formJamResult,
      linkUrl: formLinkUrl, p1Prize: formP1Prize, p2Prize: formP2Prize, p3Prize: formP3Prize, status: formStatus, isResultNow: false
    };
    if (editItem) {
      setPasaranList(prev => prev.map(p => p.id === editItem.id ? { ...p, ...data } : p));
      addToast(`Updated: ${formName.toUpperCase()}`, 'success');
    } else {
      setPasaranList(prev => [{ ...data, id: `p-${Date.now()}` }, ...prev]);
      addToast(`Added: ${formName.toUpperCase()}`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDeletePasaran = (id: string, name: string) => {
    if (window.confirm(`Hapus ${name}?`)) {
      setPasaranList(prev => prev.filter(p => p.id !== id));
      addToast(`Deleted: ${name}`, 'info');
    }
  };

  const isJamPassed = (jamTutupStr: string): boolean => {
    const match = jamTutupStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const now = new Date();
    return (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) >= (parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60);
  };

  const findTargetPasaran = (inputStr: string): PasaranItem | undefined => {
    const sorted = [...pasaranList].sort((a, b) => b.name.length - a.name.length);
    let matched = sorted.find(p => inputStr.includes(p.name.toUpperCase()));
    if (!matched) matched = sorted.find(p => p.name.toUpperCase().split(' ').every(part => inputStr.includes(part)));
    return matched || pasaranList.find(p => p.status === 'BELUM' && isJamPassed(p.jamTutup)) || pasaranList[0];
  };

  const handleResetSession = () => {
    setPasaranList(prev => prev.map(item => (selectedSession === 'ALL PASARAN' || selectedSession === 'SEMUA' || item.session === selectedSession) ? { ...item, p1Prize: '-', p2Prize: '-', p3Prize: '-', status: 'BELUM', isResultNow: false } : item));
    addToast(`Reset ${selectedSession} Success!`, 'success');
  };

  const handleProcessResultStatusInput = (e: React.FormEvent) => {
    e.preventDefault();
    const rawStr = resultStatusInput.trim().toUpperCase();
    if (!rawStr) return addToast('Input Kosong.', 'error');
    if (!rawStr.includes("PERIODE")) return addToast('Gagal! Input harus ada kata "PERIODE"', 'error');
    const matched = findTargetPasaran(rawStr);
    if (!matched) return addToast('Pasaran tidak ditemukan.', 'error');
    setPasaranList(prev => prev.map(p => p.id === matched.id ? { ...p, status: 'DONE', isResultNow: false } : p));
    addToast(`VALIDATED: ${matched.name} DONE`, 'success');
    setResultStatusInput('');
  };

  const handleProcessP1Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const rawStr = p1TerminalInput.trim().toUpperCase();
    const matched = findTargetPasaran(rawStr);
    const nums = rawStr.match(/\d+/g);
    if (!matched || !nums) return addToast('Data tidak valid.', 'error');
    setPasaranList(prev => prev.map(p => p.id === matched.id ? { ...p, p1Prize: nums[0] } : p));
    addToast(`P1 SET: ${matched.name} (${nums[0]})`, 'success');
    setP1TerminalInput('');
  };

  const handleProcessP123Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    let clean = p123TerminalInput.trim().toUpperCase().replace(/(PRIZE|P)\s*[123]:?/gi, ' ');
    const matched = findTargetPasaran(clean);
    const nums = clean.match(/\d+/g);
    if (!matched || !nums) return addToast('Data tidak valid.', 'error');
    setPasaranList(prev => prev.map(p => p.id === matched.id ? { ...p, p1Prize: nums[0] || '-', p2Prize: nums[1] || '-', p3Prize: nums[2] || '-' } : p));
    addToast(`P123 SET: ${matched.name}`, 'success');
    setP123TerminalInput('');
  };

  const renderResultStatusBadge = (item: PasaranItem) => {
    if (item.status === 'DONE') return <div className="inline-block font-black text-[10px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">SUDAH RESULT</div>;
    if (item.status === 'LIBUR') return <div className="inline-block font-black text-[10px] px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">LIBUR</div>;
    const match = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
    if (!match) return <div className="text-slate-500">-</div>;
    const diff = (parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60) - (currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds());
    if (diff > 0) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return <div className="inline-block font-mono font-bold text-[10px] px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">⏳ {pad(Math.floor(diff / 3600))}:{pad(Math.floor((diff % 3600) / 60))}:{pad(diff % 60)}</div>;
    }
    return <div className="inline-block font-black text-[10px] px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/60 shadow-[0_0_15px_rgba(225,29,72,0.4)] animate-pulse">RESULT NOW!</div>;
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700">
      
      {/* --- NEW HEADER TOOLBAR --- */}
      <div className="sticky top-[100px] z-40 bg-[#0b0f1a]/80 backdrop-blur-xl border-2 border-[#ccff00]/40 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(204,255,0,0.1)] flex flex-col xl:flex-row gap-6 items-stretch">
        
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-[#ccff00] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <select 
                value={selectedSession} 
                onChange={(e) => setSelectedSession(e.target.value)}
                className="relative bg-[#151128] border-2 border-[#ccff00]/50 rounded-2xl px-4 py-2 text-xs font-black text-[#ccff00] outline-none cursor-pointer hover:border-[#ccff00] transition-all uppercase tracking-tighter"
              >
                <option value="SORE">SESI SORE</option><option value="PAGI">SESI PAGI</option><option value="MALAM">SESI MALAM</option><option value="ALL PASARAN">ALL PASARAN</option>
              </select>
            </div>

            <button onClick={() => setIsMuted(!isMuted)} className={`p-2.5 rounded-2xl border-2 transition-all active:scale-90 ${isMuted ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' : 'bg-[#ccff00]/10 border-[#ccff00]/50 text-[#ccff00]'}`}>
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button onClick={() => setShowAlarmConfigModal(true)} className="bg-rose-600 hover:bg-rose-500 text-white font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-[0_10px_20px_rgba(225,29,72,0.3)] active:scale-95 transition-all">
              <Bell className="w-4 h-4 fill-white" /> ALARM CONFIG
            </button>

            <button onClick={handleOpenAddModal} className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-[0_10px_25px_rgba(204,255,0,0.4)] active:scale-95 transition-all">
              <Plus className="w-4 h-4 stroke-[4]" /> ADD PASARAN
            </button>

            <button onClick={handleResetSession} className="bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-[0_10px_20px_rgba(245,158,11,0.3)] active:scale-95 transition-all">
              <RotateCcw className="w-4 h-4 stroke-[3]" /> RESET SESI
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#ccff00] p-2.5 rounded-2xl shadow-[0_0_15px_rgba(204,255,0,0.5)]">
              <Zap className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-brand font-black text-[#ccff00] tracking-tighter uppercase italic drop-shadow-[0_0_10px_rgba(204,255,0,0.5)]">Shortcut Result</h1>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ccff00] animate-ping"></div>
                <p className="text-[10px] font-mono font-bold text-[#ccff00]/60 tracking-widest uppercase">Pusat Kendali Otomatisasi Result Rinjani</p>
              </div>
            </div>
          </div>
        </div>

        {/* TERMINAL UI */}
        <div className="w-full xl:w-[500px] relative">
          <div className="absolute -top-3 left-6 z-10 bg-[#ccff00] text-slate-950 px-3 py-0.5 rounded-lg text-[10px] font-brand font-black uppercase tracking-widest shadow-lg">Command Terminal</div>
          <div className="bg-[#070914] border-2 border-[#ccff00]/50 rounded-[32px] p-4 pt-6 flex flex-col gap-3 shadow-inner">
            <form onSubmit={handleProcessResultStatusInput} className="flex gap-2">
              <input value={resultStatusInput} onChange={e => setResultStatusInput(e.target.value)} placeholder="LOG STATUS (PERIODE...)" className="bg-[#121428] flex-1 rounded-xl px-4 py-2 text-xs font-mono font-bold text-[#ccff00] outline-none border border-white/5 focus:border-[#ccff00]/50 transition-all" />
              <button className="bg-[#ccff00] hover:bg-white text-slate-950 font-black px-4 rounded-xl text-[10px] transition-all">DONE</button>
            </form>
            <form onSubmit={handleProcessP1Terminal} className="flex gap-2">
              <input value={p1TerminalInput} onChange={e => setP1TerminalInput(e.target.value)} placeholder="P1 INPUT (NAME + NUM)" className="bg-[#121428] flex-1 rounded-xl px-4 py-2 text-xs font-mono font-bold text-cyan-400 outline-none border border-white/5 focus:border-cyan-400/50 transition-all" />
              <button className="bg-cyan-400 hover:bg-white text-slate-950 font-black px-4 rounded-xl text-[10px] transition-all">P1</button>
            </form>
            <form onSubmit={handleProcessP123Terminal} className="flex gap-2">
              <textarea value={p123TerminalInput} onChange={e => setP123TerminalInput(e.target.value)} rows={1} placeholder="P123 INPUT" className="bg-[#121428] flex-1 rounded-xl px-4 py-2 text-xs font-mono font-bold text-amber-400 outline-none border border-white/5 focus:border-amber-400/50 transition-all resize-none" />
              <button className="bg-amber-400 hover:bg-white text-slate-950 font-black px-4 rounded-xl text-[10px] transition-all">P123</button>
            </form>
          </div>
        </div>
      </div>

      {/* --- NEW TABLE UI --- */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#ccff00]/20 to-transparent rounded-[40px] blur-xl opacity-50"></div>
        <div className="relative bg-[#0b0f1a] border border-[#ccff00]/20 rounded-[35px] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto max-h-[70vh] custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#121325]/80 backdrop-blur-md border-b-2 border-[#ccff00]/30">
                  <th className="p-5 text-left text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">Sesh</th>
                  <th className="p-5 text-left text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">Pasaran</th>
                  <th className="p-5 text-center text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">Tutup</th>
                  <th className="p-5 text-center text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">Result</th>
                  <th className="p-5 text-center text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">Live</th>
                  <th className="p-5 text-center text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">Indicator</th>
                  <th className="p-5 text-center text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">P1</th>
                  <th className="p-5 text-center text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">P2</th>
                  <th className="p-5 text-center text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">P3</th>
                  <th className="p-5 text-center text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">Status</th>
                  <th className="p-5 text-right text-[11px] font-brand font-black text-[#ccff00] uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {sortedFilteredList.map((item) => (
                  <tr key={item.id} className={`group/row transition-all duration-300 ${item.status === 'DONE' ? 'bg-[#ccff00]/5' : 'hover:bg-white/[0.03]'}`}>
                    <td className="p-4 px-5">
                      <span className="bg-[#ccff00]/10 text-[#ccff00] text-[9px] font-black px-2 py-0.5 rounded-md border border-[#ccff00]/30">{item.session}</span>
                    </td>
                    <td className="p-4 px-5">
                      <div className="font-brand font-black text-white text-sm tracking-tighter uppercase group-hover/row:text-[#ccff00] transition-colors">{item.name}</div>
                    </td>
                    <td className="p-4 text-center text-slate-400 font-bold">{item.jamTutup}</td>
                    <td className="p-4 text-center text-slate-400 font-bold">{item.jamResult}</td>
                    <td className="p-4 text-center">
                      <button onClick={() => window.open(item.linkUrl, '_blank')} className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:border-[#ccff00] text-slate-400 hover:text-[#ccff00] transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="p-4 text-center">{renderResultStatusBadge(item)}</td>
                    <td className="p-4 text-center font-black text-[#ccff00] text-sm drop-shadow-[0_0_8px_rgba(204,255,0,0.4)]">{item.p1Prize}</td>
                    <td className="p-4 text-center text-slate-400 font-bold">{item.p2Prize}</td>
                    <td className="p-4 text-center text-slate-400 font-bold">{item.p3Prize}</td>
                    <td className="p-4 text-center">
                      <div className={`inline-block px-4 py-1 rounded-xl text-[10px] font-black shadow-lg ${item.status === 'BELUM' ? 'bg-rose-600 text-white shadow-rose-900/20' : 'bg-[#ccff00] text-slate-950 shadow-[#ccff00]/10'}`}>{item.status}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenResultPopup(item)} className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"><Percent className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenEditModal(item)} className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeletePasaran(item.id, item.name)} className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RESULT MODAL NEW LOOK */}
      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="relative w-full max-w-lg bg-[#0b0e1b] border-2 border-[#ccff00] rounded-[40px] p-8 shadow-[0_0_100px_rgba(204,255,0,0.2)]">
            <button onClick={() => setIsResultPopupOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-[#ccff00] p-4 rounded-3xl shadow-[0_0_20px_rgba(204,255,0,0.4)]"><Sparkles className="w-8 h-8 text-slate-950" /></div>
              <div>
                <h2 className="text-2xl font-brand font-black text-[#ccff00] uppercase tracking-tighter italic">Result & Shio Analysis</h2>
                <p className="text-slate-500 font-mono text-xs font-bold uppercase tracking-widest">{popupPasaran.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#12162a] border-2 border-[#ccff00]/20 rounded-3xl p-6 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Result P1</span>
                <div className="text-5xl font-mono font-black text-[#ccff00] mt-2 tracking-tighter">{popupPasaran.p1Prize && popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '-'}</div>
              </div>
              <div className="bg-[#12162a] border-2 border-cyan-400/20 rounded-3xl p-6 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shio Detected</span>
                {(() => {
                  const res = popupPasaran.p1Prize && popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '-';
                  const shio = calculateShio(res);
                  return (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-4xl">{res !== '-' ? shio.emoji : '❓'}</span>
                      <span className="text-2xl font-brand font-black text-white italic uppercase">{res !== '-' ? shio.name : '-'}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#ccff00] font-brand font-black uppercase text-xs italic"><FileText className="w-4 h-4" /> Teks Rekapan Generated</div>
              <textarea value={popupText} readOnly className="w-full bg-[#05060a] border-2 border-white/5 rounded-3xl p-6 text-sm font-mono text-[#ccff00] leading-relaxed outline-none" rows={6} />
              <button onClick={() => { navigator.clipboard.writeText(popupText); setIsCopied(true); addToast('Copied!', 'success'); setTimeout(() => setIsCopied(false), 2000); }} className={`w-full py-4 rounded-3xl font-brand font-black text-lg transition-all flex items-center justify-center gap-3 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-[#ccff00] text-slate-950 hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] active:scale-95'}`}>
                {isCopied ? <><Check className="w-6 h-6 stroke-[4]" /> TERKOPY!</> : <><Copy className="w-6 h-6 stroke-[3]" /> SALIN REKAPAN</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL NEW LOOK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#0d1222] border-2 border-[#ccff00]/40 rounded-[40px] w-full max-w-xl p-8 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
              <h3 className="text-2xl font-brand font-black text-[#ccff00] uppercase italic tracking-tighter">{editItem ? 'Edit Pasaran' : 'Add New Pasaran'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors font-bold text-2xl">✕</button>
            </div>
            <form onSubmit={handleSavePasaran} className="grid grid-cols-2 gap-5 text-[10px] font-brand font-black uppercase tracking-widest text-slate-500">
              <div className="col-span-2">
                <label className="block mb-2 ml-2">Nama Pasaran</label>
                <input required value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-[#141b2d] border-2 border-white/5 focus:border-[#ccff00]/50 rounded-2xl px-5 py-3 text-white text-sm outline-none transition-all" />
              </div>
              <div>
                <label className="block mb-2 ml-2">Sesi</label>
                <select value={formSession} onChange={e => setFormSession(e.target.value as any)} className="w-full bg-[#141b2d] border-2 border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
                  <option value="SORE">SORE</option><option value="PAGI">PAGI</option><option value="MALAM">MALAM</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 ml-2">Status</label>
                <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} className="w-full bg-[#141b2d] border-2 border-white/5 rounded-2xl px-5 py-3 text-white outline-none">
                  <option value="BELUM">BELUM</option><option value="DONE">DONE</option><option value="LIBUR">LIBUR</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 ml-2">Jam Tutup</label>
                <input value={formJamTutup} onChange={e => setFormJamTutup(e.target.value)} className="w-full bg-[#141b2d] border-2 border-white/5 rounded-2xl px-5 py-3 text-white outline-none" />
              </div>
              <div>
                <label className="block mb-2 ml-2">Jam Result</label>
                <input value={formJamResult} onChange={e => setFormJamResult(e.target.value)} className="w-full bg-[#141b2d] border-2 border-white/5 rounded-2xl px-5 py-3 text-white outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block mb-2 ml-2">Official Website Link</label>
                <input value={formLinkUrl} onChange={e => setFormLinkUrl(e.target.value)} className="w-full bg-[#141b2d] border-2 border-white/5 rounded-2xl px-5 py-3 text-cyan-400 outline-none" />
              </div>
              <div className="col-span-2 grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                <div><label className="block mb-2 ml-2">P1</label><input value={formP1Prize} onChange={e => setFormP1Prize(e.target.value)} className="w-full bg-[#141b2d] border-2 border-[#ccff00]/30 rounded-2xl py-3 text-center text-[#ccff00] font-mono font-black text-lg outline-none" /></div>
                <div><label className="block mb-2 ml-2">P2</label><input value={formP2Prize} onChange={e => setFormP2Prize(e.target.value)} className="w-full bg-[#141b2d] border-2 border-white/5 rounded-2xl py-3 text-center text-white font-mono font-black text-lg outline-none" /></div>
                <div><label className="block mb-2 ml-2">P3</label><input value={formP3Prize} onChange={e => setFormP3Prize(e.target.value)} className="w-full bg-[#141b2d] border-2 border-white/5 rounded-2xl py-3 text-center text-white font-mono font-black text-lg outline-none" /></div>
              </div>
              <div className="col-span-2 flex gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-[24px] font-brand font-black uppercase text-xs active:scale-95 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] py-4 bg-[#ccff00] text-slate-950 rounded-[24px] font-brand font-black uppercase text-xs shadow-[0_15px_30px_rgba(204,255,0,0.3)] active:scale-95 transition-all">Save Pasaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALARM POPUP (MODAL) */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-gradient-to-b from-[#141a0d] to-black border-4 border-[#ccff00] rounded-[60px] p-16 text-center shadow-[0_0_150px_rgba(204,255,0,0.4)] animate-pulse-slow">
            <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#ccff00] text-slate-950 px-6 py-2 rounded-2xl font-brand font-black uppercase tracking-[0.2em] shadow-xl">
              <AlarmClock className="w-6 h-6 animate-bounce" /> Rinjani System Alert
            </div>
            <div className="space-y-6 pt-8">
              <h2 className="text-7xl font-brand font-black text-white italic uppercase tracking-tighter leading-none">{activeAlarm.pasaranName}</h2>
              <div className="text-4xl font-brand font-black text-[#ccff00] tracking-widest uppercase italic shadow-sm">JAM RESULT {activeAlarm.jamResult}</div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden max-w-md mx-auto relative"><div className="absolute inset-0 bg-[#ccff00] animate-progress"></div></div>
              <button onClick={handleDismissAlarm} className="mt-10 bg-[#ccff00] hover:bg-white text-slate-950 font-brand font-black text-3xl px-20 py-6 rounded-[35px] shadow-[0_20px_60px_rgba(204,255,0,0.5)] transition-all active:scale-90 uppercase italic">Acknowledge</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIG MODAL */}
      {showAlarmConfigModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/40 rounded-[40px] w-full max-w-md p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-[#ccff00] p-3 rounded-2xl"><AlarmClock className="w-6 h-6 text-slate-950" /></div>
                <h3 className="text-xl font-brand font-black text-[#ccff00] uppercase italic">System Alarm</h3>
              </div>
              <button onClick={() => setShowAlarmConfigModal(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-white/5 p-6 rounded-[28px] border border-white/5">
                <div><div className="text-white font-brand font-black uppercase text-xs italic">Auto Popup</div><div className="text-slate-500 font-mono text-[9px] font-bold uppercase mt-1">Trigger on result time</div></div>
                <input type="checkbox" checked={isAlarmEnabled} onChange={(e) => setIsAlarmEnabled(e.target.checked)} className="w-8 h-8 accent-[#ccff00] cursor-pointer" />
              </div>
              <div className="flex items-center justify-between bg-white/5 p-6 rounded-[28px] border border-white/5">
                <div><div className="text-white font-brand font-black uppercase text-xs italic">Sirine Audio</div><div className="text-slate-500 font-mono text-[9px] font-bold uppercase mt-1">{isMuted ? 'Muted' : 'Operational'}</div></div>
                <button onClick={() => setIsMuted(!isMuted)} className={`px-6 py-2 rounded-2xl font-brand font-black text-[10px] uppercase transition-all ${isMuted ? 'bg-rose-500/20 text-rose-500' : 'bg-[#ccff00]/20 text-[#ccff00]'}`}>{isMuted ? 'MUTE' : 'UNMUTE'}</button>
              </div>
              <button onClick={() => { setShowAlarmConfigModal(false); triggerAlarm({ pasaranName: 'TESTING SYSTEM', jamTutup: '00:00', jamResult: '00:00', session: 'SORE', title: 'SYSTEM CHECK OK' }); }} className="w-full bg-[#ccff00] hover:bg-white text-slate-950 font-brand font-black py-5 rounded-[28px] shadow-lg active:scale-95 transition-all uppercase italic">TEST SIRENE POPUP</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
