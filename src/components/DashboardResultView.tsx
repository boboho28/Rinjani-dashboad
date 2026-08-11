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
  Activity,
  Cpu,
  Layers,
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
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
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
    if (!isMuted) {
      startAlarmSound();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeAlarm) {
        if (e.key === 'Escape' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          handleDismissAlarm();
        }
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
          const hoursTutup = parseInt(matchTutup[1], 10);
          const minsTutup = parseInt(matchTutup[2], 10);
          const tutupTotalSecs = hoursTutup * 3600 + minsTutup * 60;
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

  const [resultStatusInput, setResultStatusInput] = useState<string>('');
  const [p1TerminalInput, setP1TerminalInput] = useState<string>('');
  const [p123TerminalInput, setP123TerminalInput] = useState<string>('');

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
  const [formIsResultNow, setFormIsResultNow] = useState<boolean>(true);

  const filteredList = pasaranList.filter((item) => {
    if (selectedSession === 'SEMUA' || selectedSession === 'ALL PASARAN') return true;
    return item.session === selectedSession;
  });

  const sortedFilteredList = [...filteredList].sort((a, b) => {
    const getTimeValue = (jamStr: string) => {
      const match = jamStr.match(/(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    };
    return getTimeValue(a.jamTutup) - getTimeValue(b.jamTutup);
  });

  const handleOpenAddModal = () => {
    setEditItem(null);
    setFormName('');
    setFormSession('SORE');
    setFormJamTutup('18:00 WIB');
    setFormJamResult('18:30 WIB');
    setFormLinkUrl('');
    setFormP1Prize('-');
    setFormP2Prize('-');
    setFormP3Prize('-');
    setFormStatus('BELUM');
    setFormIsResultNow(true);
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
    setFormIsResultNow(item.isResultNow);
    setIsModalOpen(true);
  };

  const handleSavePasaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      addToast('Nama pasaran tidak boleh kosong.', 'error');
      return;
    }
    if (editItem) {
      setPasaranList((prev) => prev.map((p) => p.id === editItem.id ? { ...p, name: formName.trim().toUpperCase(), session: formSession, jamTutup: formJamTutup, jamResult: formJamResult, linkUrl: formLinkUrl, p1Prize: formP1Prize || '-', p2Prize: formP2Prize || '-', p3Prize: formP3Prize || '-', status: formStatus, isResultNow: formIsResultNow } : p));
      addToast(`Pasaran ${formName.toUpperCase()} berhasil diperbarui.`, 'success');
    } else {
      const newItem: PasaranItem = { id: `p-${Date.now()}`, name: formName.trim().toUpperCase(), session: formSession, jamTutup: formJamTutup, jamResult: formJamResult, linkUrl: formLinkUrl, p1Prize: formP1Prize || '-', p2Prize: formP2Prize || '-', p3Prize: formP3Prize || '-', status: formStatus, isResultNow: formIsResultNow };
      setPasaranList((prev) => [newItem, ...prev]);
      addToast(`Pasaran ${formName.toUpperCase()} berhasil ditambahkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDeletePasaran = (id: string, name: string) => {
    if (window.confirm(`Hapus pasaran ${name}?`)) {
      setPasaranList((prev) => prev.filter((p) => p.id !== id));
      addToast(`Pasaran ${name} telah dihapus.`, 'info');
    }
  };

  const isJamPassed = (jamTutupStr: string): boolean => {
    const match = jamTutupStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const now = new Date();
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const tutupSecs = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60;
    return nowSecs >= tutupSecs;
  };

  const findTargetPasaran = (inputStr: string): PasaranItem | undefined => {
    if (!pasaranList || pasaranList.length === 0) return undefined;
    const sortedPasaran = [...pasaranList].sort((a, b) => b.name.length - a.name.length);
    let matched = sortedPasaran.find((p) => inputStr.includes(p.name.toUpperCase()));
    if (!matched) matched = sortedPasaran.find((p) => p.name.toUpperCase().split(' ').every((part) => inputStr.includes(part)));
    if (matched) return matched;
    const resultNowItem = pasaranList.find((p) => p.isResultNow || (p.status === 'BELUM' && isJamPassed(p.jamTutup)));
    if (resultNowItem) return resultNowItem;
    return pasaranList.find((p) => (selectedSession === 'SEMUA' || p.session === selectedSession) && p.status === 'BELUM') || pasaranList[0];
  };

  const handleResetSession = () => {
    setPasaranList((prev) => prev.map((item) => (selectedSession === 'ALL PASARAN' || selectedSession === 'SEMUA' || item.session === selectedSession) ? { ...item, p1Prize: '-', p2Prize: '-', p3Prize: '-', status: 'BELUM', isResultNow: false } : item));
    addToast(`🔄 Data untuk sesi ${selectedSession} di-reset!`, 'success');
  };

  const getUrlsFromItem = (item: PasaranItem): string[] => {
    if (!item.linkUrl) return [];
    return item.linkUrl.split(/[\n,]+/).map((s) => s.trim()).filter((s) => s.length > 0);
  };

  const handleOpenAllLinks = (item: PasaranItem) => {
    getUrlsFromItem(item).forEach((url) => {
      window.open(/^https?:\/\//i.test(url) ? url : 'https://' + url, '_blank');
    });
  };

  const renderResultStatusBadge = (item: PasaranItem) => {
    if (item.status === 'DONE') return <div className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]">DONE</div>;
    if (item.status === 'LIBUR') return <div className="text-[9px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/50">LIBUR</div>;
    const matchTutup = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
    if (!matchTutup) return <div className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/50">PENDING</div>;
    const nowTotalSecs = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
    const tutupTotalSecs = parseInt(matchTutup[1], 10) * 3600 + parseInt(matchTutup[2], 10) * 60;
    let diffSecs = tutupTotalSecs - nowTotalSecs;
    if (diffSecs > 0) {
      const h = Math.floor(diffSecs / 3600), m = Math.floor((diffSecs % 3600) / 60), s = diffSecs % 60;
      return <div className="text-[9px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50 font-mono">⏳ {h > 0 ? `${h}:` : ''}{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</div>;
    }
    return <div className="text-[9px] px-2 py-0.5 rounded-full bg-fuchsia-600 text-white border border-fuchsia-400 animate-pulse font-black shadow-[0_0_12px_#ff00ff]">RESULT NOW!</div>;
  };

  const handleProcessResultStatusInput = (e: React.FormEvent) => {
    e.preventDefault();
    const rawStr = resultStatusInput.trim().toUpperCase();
    if (!rawStr || !rawStr.includes("PERIODE")) {
      addToast('Input Gagal! Harus ada kata "PERIODE"', 'error');
      return;
    }
    const matchedItem = findTargetPasaran(rawStr);
    if (!matchedItem) return addToast(`Pasaran tidak ditemukan.`, 'error');
    setPasaranList((prev) => prev.map((item) => item.id === matchedItem.id ? { ...item, status: 'DONE', isResultNow: false } : item));
    addToast(`✅ ${matchedItem.name} DONE!`, 'success');
    setResultStatusInput('');
  };

  const handleProcessP1Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const rawStr = p1TerminalInput.trim().toUpperCase();
    const matchedItem = findTargetPasaran(rawStr);
    if (!matchedItem) return;
    const numbers = rawStr.match(/\d+/g) || [];
    if (numbers.length === 0) return;
    setPasaranList((prev) => prev.map((item) => item.id === matchedItem.id ? { ...item, p1Prize: numbers[0] } : item));
    addToast(`✅ P1 ${matchedItem.name} (${numbers[0]}) OK!`, 'success');
    setP1TerminalInput('');
  };

  const handleProcessP123Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    let cleanStr = p123TerminalInput.trim().toUpperCase().replace(/PRIZE\s*[123]:?/gi, ' ').replace(/P[123]:?/gi, ' ');
    const matchedItem = findTargetPasaran(cleanStr);
    if (!matchedItem) return;
    const numbers = cleanStr.match(/\d+/g) || [];
    setPasaranList((prev) => prev.map((item) => item.id === matchedItem.id ? { ...item, p1Prize: numbers[0] || '-', p2Prize: numbers[1] || '-', p3Prize: numbers[2] || '-' } : item));
    addToast(`✅ P123 ${matchedItem.name} OK!`, 'success');
    setP123TerminalInput('');
  };

  return (
    <div 
      className="min-h-screen p-4 sm:p-6 space-y-6 bg-cover bg-center bg-fixed font-sans selection:bg-fuchsia-500 selection:text-white"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(13, 10, 28, 0.92), rgba(13, 10, 28, 0.95)), url('https://i.pinimg.com/736x/f3/30/39/f33039034dcce22a500a206f6e7ed286.jpg')` }}
    >
      {/* 1. FUTURISTIC HEADER HUD */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-[#0d0a1c]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col xl:flex-row gap-6 items-center shadow-2xl overflow-hidden">
          
          {/* Left: System Branding */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative">
               <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(192,38,211,0.5)]">
                  <Activity className="w-8 h-8 text-white animate-pulse" />
               </div>
               <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-cyan-500 flex items-center justify-center border-2 border-[#0d0a1c] shadow-lg">
                  <Cpu className="w-3 h-3 text-slate-950" />
               </div>
            </div>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-white to-cyan-400 uppercase">
                RINJANI OS v2.0
              </h1>
              <p className="text-[10px] font-mono text-fuchsia-400/80 font-bold tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-ping"></span>
                CORE DASHBOARD // SYSTEM ACTIVE
              </p>
            </div>
          </div>

          {/* Center: Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 flex-1 px-4 border-l border-r border-white/5">
            <div className="flex items-center bg-black/40 border border-fuchsia-500/30 rounded-2xl px-4 py-2 hover:border-fuchsia-500 transition-all shadow-inner">
               <Layers className="w-4 h-4 text-fuchsia-500 mr-3" />
               <select
                 value={selectedSession}
                 onChange={(e) => setSelectedSession(e.target.value)}
                 className="bg-transparent text-xs font-black text-fuchsia-300 outline-none cursor-pointer uppercase tracking-widest"
               >
                 <option value="SORE" className="bg-[#1a162e]">SESSION: SORE</option>
                 <option value="PAGI" className="bg-[#1a162e]">SESSION: PAGI</option>
                 <option value="MALAM" className="bg-[#1a162e]">SESSION: MALAM</option>
                 <option value="ALL PASARAN" className="bg-[#1a162e]">SESSION: ALL</option>
               </select>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-2xl border transition-all duration-300 ${!isMuted ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400 shadow-[0_0_15px_rgba(192,38,211,0.3)]' : 'bg-slate-800/40 border-slate-600 text-slate-500'}`}
              >
                {isMuted ? <VolumeX size={18}/> : <Volume2 size={18}/>}
              </button>
              
              <button 
                onClick={() => setShowAlarmConfigModal(true)}
                className="group flex items-center gap-2 px-5 py-3 bg-cyan-600/10 border border-cyan-500/50 text-cyan-400 rounded-2xl hover:bg-cyan-600/20 transition-all font-black text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.1)]"
              >
                <Bell size={16} className="group-hover:rotate-12 transition-transform"/>
                <span className="hidden sm:inline">ALARM CFG</span>
              </button>

              <button 
                onClick={handleResetSession}
                className="flex items-center gap-2 px-5 py-3 bg-amber-600/10 border border-amber-500/50 text-amber-400 rounded-2xl hover:bg-amber-600/20 transition-all font-black text-xs uppercase tracking-widest"
              >
                <RotateCcw size={16}/>
                <span className="hidden sm:inline">RESET</span>
              </button>
            </div>
          </div>

          {/* Right: Terminal Mini HUD */}
          <div className="w-full xl:w-96 space-y-2">
             <form onSubmit={handleProcessResultStatusInput} className="flex gap-2 group">
                <div className="relative flex-1">
                   <div className="absolute inset-y-0 left-3 flex items-center text-fuchsia-500/50">
                      <Terminal size={12}/>
                   </div>
                   <input
                     type="text"
                     placeholder="CROSSCHECK LOG (PERIODE...)"
                     value={resultStatusInput}
                     onChange={(e) => setResultStatusInput(e.target.value)}
                     className="w-full bg-black/60 border border-fuchsia-500/30 rounded-xl pl-9 pr-3 py-2 text-[10px] font-mono text-fuchsia-300 outline-none focus:border-fuchsia-500 focus:shadow-[0_0_10px_rgba(192,38,211,0.2)] transition-all uppercase placeholder:text-slate-600"
                   />
                </div>
                <button type="submit" className="px-3 bg-fuchsia-600 text-white rounded-xl text-[10px] font-black hover:bg-fuchsia-500 transition-all active:scale-95 shadow-lg shadow-fuchsia-900/40">DONE</button>
             </form>

             <div className="grid grid-cols-2 gap-2">
                <form onSubmit={handleProcessP1Terminal} className="flex gap-1.5">
                   <input
                     type="text"
                     placeholder="P1 (e.g 5045)"
                     value={p1TerminalInput}
                     onChange={(e) => setP1TerminalInput(e.target.value)}
                     className="flex-1 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2 text-[10px] font-mono text-cyan-300 outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                   />
                   <button type="submit" className="w-10 bg-cyan-600 text-slate-950 rounded-xl font-black text-[10px] hover:bg-cyan-400 transition-all shadow-cyan-900/40">P1</button>
                </form>
                <form onSubmit={handleProcessP123Terminal} className="flex gap-1.5">
                   <input
                     type="text"
                     placeholder="P123 (e.g 11 22 33)"
                     value={p123TerminalInput}
                     onChange={(e) => setP123TerminalInput(e.target.value)}
                     className="flex-1 bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-2 text-[10px] font-mono text-cyan-300 outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                   />
                   <button type="submit" className="w-10 bg-cyan-600 text-slate-950 rounded-xl font-black text-[10px] hover:bg-cyan-400 transition-all shadow-cyan-900/40">P3</button>
                </form>
             </div>
          </div>
        </div>
      </div>

      {/* 2. DATA GRID / LOG TABLE */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-b from-cyan-500/20 to-transparent rounded-3xl blur opacity-10"></div>
        <div className="relative bg-[#0d0a1c]/60 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          
          <div className="p-5 flex justify-between items-center border-b border-white/5 bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-fuchsia-600 rounded-full shadow-[0_0_10px_#ff00ff]"></div>
              <h2 className="text-sm font-black text-white tracking-[0.3em] uppercase">SYSTEM.DATABASE_ENTITY</h2>
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-fuchsia-400 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-fuchsia-500/20"
            >
              <Plus size={16} strokeWidth={3}/>
              ADD_PASARAN
            </button>
          </div>

          <div className="overflow-x-auto custom-scrollbar-cyber">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-[#1a162e]/50 text-[10px] text-fuchsia-400/60 font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="py-4 px-6 border-b border-white/5">SHIFT</th>
                  <th className="py-4 px-6 border-b border-white/5">IDENTITY</th>
                  <th className="py-4 px-6 border-b border-white/5 text-center">TIME_OUT</th>
                  <th className="py-4 px-6 border-b border-white/5 text-center">TIME_RES</th>
                  <th className="py-4 px-6 border-b border-white/5 text-center">NET_LNK</th>
                  <th className="py-4 px-6 border-b border-white/5 text-center">REALTIME_STATUS</th>
                  <th className="py-4 px-6 border-b border-white/5 text-center text-fuchsia-400">P1_PRIZE</th>
                  <th className="py-4 px-6 border-b border-white/5 text-center text-cyan-400">P2_PRIZE</th>
                  <th className="py-4 px-6 border-b border-white/5 text-center text-cyan-400">P3_PRIZE</th>
                  <th className="py-4 px-6 border-b border-white/5 text-center">OPSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedFilteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-fuchsia-500/5 transition-colors group">
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-[9px] font-black text-slate-400 group-hover:text-fuchsia-400 transition-colors">
                        {item.session}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white tracking-wider group-hover:text-fuchsia-400 transition-colors uppercase">
                          {item.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">UID: {item.id.slice(-8)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-mono text-[11px] text-slate-300">{item.jamTutup}</td>
                    <td className="py-4 px-6 text-center font-mono text-[11px] text-slate-300">{item.jamResult}</td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => handleOpenAllLinks(item)}
                        className="p-2.5 rounded-xl bg-slate-800/40 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/50 transition-all"
                      >
                        <ExternalLink size={14}/>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">{renderResultStatusBadge(item)}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className={`text-sm font-black tracking-widest ${item.p1Prize !== '-' ? 'text-fuchsia-400 drop-shadow-[0_0_8px_#ff00ff]' : 'text-slate-700'}`}>
                         {item.p1Prize}
                       </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className={`text-xs font-bold text-cyan-400/60 ${item.p2Prize !== '-' ? 'text-cyan-300' : 'text-slate-700'}`}>
                         {item.p2Prize}
                       </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className={`text-xs font-bold text-cyan-400/60 ${item.p3Prize !== '-' ? 'text-cyan-300' : 'text-slate-700'}`}>
                         {item.p3Prize}
                       </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => handleOpenResultPopup(item)}
                           className="p-2 rounded-xl bg-fuchsia-600/10 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-600 hover:text-white transition-all shadow-lg shadow-fuchsia-900/10"
                         >
                           <Percent size={14}/>
                         </button>
                         <button 
                           onClick={() => handleOpenEditModal(item)}
                           className="p-2 rounded-xl bg-slate-800/60 text-slate-300 border border-white/10 hover:bg-white hover:text-slate-900 transition-all"
                         >
                           <Edit2 size={14}/>
                         </button>
                         <button 
                           onClick={() => handleDeletePasaran(item.id, item.name)}
                           className="p-2 rounded-xl bg-rose-900/20 text-rose-500 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all"
                         >
                           <Trash2 size={14}/>
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. NEON MODALS SECTION */}
      
      {/* MODAL: ADD/EDIT PASARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#141b2d] border-2 border-fuchsia-500/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(192,38,211,0.3)] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                 <Zap className="text-fuchsia-500 w-6 h-6 fill-fuchsia-500" />
                 {editItem ? 'Configure Pasaran' : 'New Identity'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
            </div>

            <form onSubmit={handleSavePasaran} className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-fuchsia-500 tracking-widest uppercase ml-1">Identity Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-5 py-3.5 text-sm font-bold text-white outline-none focus:border-fuchsia-500 transition-all uppercase"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Sesh Group</label>
                    <select
                      value={formSession}
                      onChange={(e) => setFormSession(e.target.value as any)}
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-300 outline-none focus:border-fuchsia-500"
                    >
                      <option value="SORE">SORE</option>
                      <option value="PAGI">PAGI</option>
                      <option value="MALAM">MALAM</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Operation Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-300 outline-none focus:border-fuchsia-500"
                    >
                      <option value="BELUM">BELUM</option>
                      <option value="DONE">DONE</option>
                      <option value="LIBUR">LIBUR</option>
                    </select>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-fuchsia-400 tracking-widest uppercase ml-1">P1 PRIZE</label>
                    <input type="text" value={formP1Prize} onChange={(e) => setFormP1Prize(e.target.value)} className="w-full bg-fuchsia-600/10 border-2 border-fuchsia-500/30 rounded-2xl px-3 py-3 text-center text-lg font-black text-fuchsia-400 outline-none focus:border-fuchsia-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-cyan-400 tracking-widest uppercase ml-1">P2 PRIZE</label>
                    <input type="text" value={formP2Prize} onChange={(e) => setFormP2Prize(e.target.value)} className="w-full bg-cyan-600/10 border-2 border-cyan-500/30 rounded-2xl px-3 py-3 text-center text-lg font-black text-cyan-400 outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-cyan-400 tracking-widest uppercase ml-1">P3 PRIZE</label>
                    <input type="text" value={formP3Prize} onChange={(e) => setFormP3Prize(e.target.value)} className="w-full bg-cyan-600/10 border-2 border-cyan-500/30 rounded-2xl px-3 py-3 text-center text-lg font-black text-cyan-400 outline-none focus:border-cyan-500" />
                  </div>
               </div>

               <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl border-2 border-white/5 text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" className="flex-[1.5] py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-fuchsia-900/40 hover:scale-[1.02] active:scale-95 transition-all">Upload Data</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ACTIVE ALARM HUD */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="relative w-full max-w-2xl text-center space-y-10 animate-pulse-slow">
              <div className="relative inline-block">
                 <div className="absolute -inset-10 bg-fuchsia-600/30 rounded-full blur-[80px]"></div>
                 <div className="relative w-40 h-40 mx-auto rounded-full border-[6px] border-fuchsia-500 flex items-center justify-center shadow-[0_0_50px_rgba(192,38,211,0.5)]">
                    <AlarmClock size={80} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"/>
                 </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_30px_#ff00ff]">
                  {activeAlarm.pasaranName}
                </h2>
                <div className="inline-block px-10 py-3 bg-fuchsia-600 text-white font-black text-2xl rounded-full shadow-2xl tracking-widest">
                  TIME_RES: {activeAlarm.jamResult}
                </div>
              </div>

              <button 
                onClick={handleDismissAlarm}
                className="group relative px-20 py-6 bg-white rounded-full overflow-hidden transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.4)]"
              >
                <span className="relative z-10 text-slate-950 text-2xl font-black tracking-widest uppercase">DISMISS_ALARM</span>
                <div className="absolute inset-0 bg-fuchsia-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
              
              <p className="text-xs font-mono text-fuchsia-500 font-bold uppercase tracking-[0.5em]">SYSTEM INTERRUPT: WAITING FOR ACTION...</p>
           </div>
        </div>
      )}

      {/* MODAL: RESULT PREVIEW & SHIO */}
      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#0d0a1c] border-2 border-white/10 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-600 flex items-center justify-center shadow-lg shadow-fuchsia-900/40">
                    <Sparkles className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase">{popupPasaran.name}</h3>
                    <p className="text-[10px] font-mono text-fuchsia-400 font-bold tracking-widest uppercase">Calculation Engine</p>
                  </div>
               </div>
               <button onClick={() => setIsResultPopupOpen(false)} className="text-slate-500 hover:text-white"><X size={24}/></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-black/40 border border-white/5 rounded-2xl p-5 text-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">FINAL_P1</span>
                  <div className="text-4xl font-black text-fuchsia-500 drop-shadow-[0_0_10px_#ff00ff] tracking-tighter">
                    {popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '----'}
                  </div>
               </div>
               <div className="bg-black/40 border border-white/5 rounded-2xl p-5 text-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">ENTITY_SHIO</span>
                  {(() => {
                    const res = popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '-';
                    const shio = calculateShio(res);
                    return (
                      <div className="flex items-center justify-center gap-3">
                         <span className="text-3xl">{res !== '-' ? shio.emoji : '❓'}</span>
                         <span className="text-2xl font-black text-white">{res !== '-' ? shio.name : '----'}</span>
                      </div>
                    );
                  })()}
               </div>
            </div>

            <div className="space-y-2 mb-8">
               <label className="text-[10px] font-black text-fuchsia-500 uppercase tracking-widest ml-1">Generated Output Teks</label>
               <textarea
                 value={popupText}
                 onChange={(e) => setPopupText(e.target.value)}
                 rows={6}
                 className="w-full bg-black/60 border-2 border-white/5 rounded-2xl p-5 text-xs font-mono text-cyan-300 leading-relaxed outline-none focus:border-fuchsia-500 transition-all resize-none"
               />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsResultPopupOpen(false)}
                className="flex-1 py-4 bg-slate-800/60 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(popupText);
                  addToast('✅ Data Copied to Clipboard!', 'success');
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className={`flex-[2] py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${isCopied ? 'bg-emerald-500 text-slate-950' : 'bg-fuchsia-600 text-white shadow-fuchsia-900/40 hover:scale-[1.02]'}`}
              >
                {isCopied ? <Check size={18}/> : <Copy size={18}/>}
                {isCopied ? 'TRANSFER_COMPLETE' : 'COPY_OUTPUT_LOG'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ALARM CONFIG */}
      {showAlarmConfigModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="w-full max-w-sm bg-[#141b2d] border-2 border-cyan-500/50 rounded-3xl p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)]">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                   <AlarmClock className="text-cyan-400 w-5 h-5" />
                   System Alert CFG
                 </h3>
                 <button onClick={() => setShowAlarmConfigModal(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                 <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase">Auto-Popup</span>
                    <input 
                      type="checkbox" 
                      checked={isAlarmEnabled} 
                      onChange={(e) => setIsAlarmEnabled(e.target.checked)}
                      className="w-6 h-6 accent-cyan-500 rounded-lg cursor-pointer"
                    />
                 </div>
                 <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase">Audio Signal</span>
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className={`px-4 py-2 rounded-xl font-black text-[10px] border transition-all ${isMuted ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-cyan-500/10 border-cyan-500 text-cyan-500'}`}
                    >
                      {isMuted ? 'SIGNAL: OFF' : 'SIGNAL: ON'}
                    </button>
                 </div>
                 <button 
                   onClick={() => {
                     setShowAlarmConfigModal(false);
                     triggerAlarm({ pasaranName: 'DIAGNOSTIC TEST', jamTutup: '00:00', jamResult: '00:00', session: 'TEST', title: 'SYSTEM ALARM TEST OK' });
                   }}
                   className="w-full py-4 bg-cyan-600 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-cyan-900/40 hover:bg-cyan-400 transition-all"
                 >
                   Run Diagnostic Alarm
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
