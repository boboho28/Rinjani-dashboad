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
  ShieldCheck,
  ZapOff
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
  // --- LOGIC: SESSION PERSISTENCE ---
  const [selectedSession, setSelectedSession] = useState<string>(() => {
    return localStorage.getItem('rinjani_last_result_session') || 'SORE';
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    localStorage.setItem('rinjani_last_result_session', selectedSession);
  }, [selectedSession]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LOGIC: ALARM SYSTEM (RESTORED FULL) ---
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
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.4);
      };
      playBeep();
      alarmIntervalRef.current = setInterval(playBeep, 600);
    } catch (e) {}
  };

  const triggerAlarm = (alarmData: AlarmItem) => {
    setActiveAlarm(alarmData);
    if (!isMuted) startAlarmSound();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (activeAlarm && (e.key === 'Escape' || e.key === ' ')) {
        stopAlarmSound(); setActiveAlarm(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeAlarm]);

  useEffect(() => {
    if (!isAlarmEnabled) return;
    const now = currentTime;
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const dateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    pasaranList.forEach(item => {
      if (item.status === 'BELUM' && (!item.p1Prize || item.p1Prize === '-')) {
        const match = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const tSecs = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
          if (tSecs - nowSecs <= 0 && tSecs - nowSecs >= -3) {
            const key = `${item.id}-${dateStr}`;
            if (!triggeredAlarmsRef.current.has(key)) {
              triggeredAlarmsRef.current.add(key);
              triggerAlarm({ pasaranName: item.name, jamTutup: item.jamTutup, jamResult: item.jamResult, session: item.session });
            }
          }
        }
      }
    });
  }, [currentTime, pasaranList, isAlarmEnabled]);

  // --- LOGIC: TERMINAL & DATA (RESTORED FULL) ---
  const [resultStatusInput, setResultStatusInput] = useState('');
  const [p1TerminalInput, setP1TerminalInput] = useState('');
  const [p123TerminalInput, setP123TerminalInput] = useState('');
  const [isResultPopupOpen, setIsResultPopupOpen] = useState(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const calculateShio = (p1?: string) => {
    if (!p1 || p1 === '-') return { name: '-', emoji: '❓' };
    const clean = p1.replace(/\D/g, '');
    if (clean.length < 2) return { name: '-', emoji: '❓' };
    const last2 = parseInt(clean.slice(-2));
    if (last2 === 0) return { name: 'KELINCI', emoji: '🐇' };
    const shios = [
      { n: 'KAMBING', e: '🐐' }, { n: 'KUDA', e: '🐎' }, { n: 'ULAR', e: '🐍' },
      { n: 'NAGA', e: '🐉' }, { n: 'KELINCI', e: '🐇' }, { n: 'HARIMAU', e: '🐅' },
      { n: 'KERBAU', e: '🐂' }, { n: 'TIKUS', e: '🐀' }, { n: 'BABI', e: '🐖' },
      { n: 'ANJING', e: '🐕' }, { n: 'AYAM', e: '🐓' }, { n: 'MONYET', e: '🐒' }
    ];
    return shios[last2 % 12];
  };

  const generateAnnouncement = (item: PasaranItem) => {
    const res = (item.p1Prize && item.p1Prize !== '-') ? item.p1Prize : '-';
    const shio = calculateShio(res);
    const now = new Date();
    return `Hasil Pengeluaran ${item.name}\nHari Ini ${['MINGGU','SENIN','SELASA','RABU','KAMIS','JUMAT','SABTU'][now.getDay()]}, ${now.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][now.getMonth()]} ${now.getFullYear()}\nResult : ${res}\nSHIO : ${res !== '-' ? shio.name : '-'}\nSelamat Kepada Pemenang!`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PasaranItem | null>(null);
  const [form, setForm] = useState({ name: '', session: 'SORE', jamTutup: '15:00 WIB', jamResult: '16:15 WIB', linkUrl: '', p1: '-', p2: '-', p3: '-', status: 'BELUM' });

  const handleOpenAdd = () => { setEditItem(null); setForm({ name: '', session: 'SORE', jamTutup: '18:00 WIB', jamResult: '18:30 WIB', linkUrl: '', p1: '-', p2: '-', p3: '-', status: 'BELUM' }); setIsModalOpen(true); };
  const handleOpenEdit = (item: PasaranItem) => { setEditItem(item); setForm({ name: item.name, session: item.session as any, jamTutup: item.jamTutup, jamResult: item.jamResult, linkUrl: item.linkUrl || '', p1: item.p1Prize || '-', p2: item.p2Prize || '-', p3: item.p3Prize || '-', status: item.status as any }); setIsModalOpen(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return addToast('Nama wajib diisi', 'error');
    const data: PasaranItem = { id: editItem ? editItem.id : `p-${Date.now()}`, name: form.name.toUpperCase(), session: form.session as any, jamTutup: form.jamTutup, jamResult: form.jamResult, linkUrl: form.linkUrl, p1Prize: form.p1, p2Prize: form.p2, p3Prize: form.p3, status: form.status as any, isResultNow: false };
    setPasaranList(prev => editItem ? prev.map(p => p.id === editItem.id ? data : p) : [data, ...prev]);
    addToast('Data tersimpan', 'success'); setIsModalOpen(false);
  };

  const findTarget = (str: string) => {
    const upper = str.toUpperCase();
    return [...pasaranList].sort((a,b) => b.name.length - a.name.length).find(p => upper.includes(p.name));
  };

  const handleProcessLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultStatusInput.toUpperCase().includes('PERIODE')) return addToast('Gagal! Input harus mengandung kata "PERIODE"', 'error');
    const target = findTarget(resultStatusInput);
    if (!target) return addToast('Pasaran tidak dikenali', 'error');
    setPasaranList(prev => prev.map(p => p.id === target.id ? { ...p, status: 'DONE' } : p));
    addToast(`${target.name} DONE`, 'success'); setResultStatusInput('');
  };

  const handleProcessP1 = (e: React.FormEvent) => {
    e.preventDefault();
    const target = findTarget(p1TerminalInput) || pasaranList[0];
    const num = p1TerminalInput.match(/\d+/);
    if (num && target) {
      setPasaranList(prev => prev.map(p => p.id === target.id ? { ...p, p1Prize: num[0] } : p));
      addToast(`P1 ${target.name} OK`, 'success'); setP1TerminalInput('');
    }
  };

  const handleProcessP3 = (e: React.FormEvent) => {
    e.preventDefault();
    const target = findTarget(p123TerminalInput) || pasaranList[0];
    const nums = p123TerminalInput.match(/\d+/g);
    if (nums && target) {
      setPasaranList(prev => prev.map(p => p.id === target.id ? { ...p, p1Prize: nums[0], p2Prize: nums[1] || '-', p3Prize: nums[2] || '-' } : p));
      addToast(`P123 ${target.name} OK`, 'success'); setP123TerminalInput('');
    }
  };

  return (
    <div 
      className="min-h-screen p-3 sm:p-6 space-y-6 bg-cover bg-center bg-fixed font-sans selection:bg-purple-500 selection:text-white"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(10, 5, 25, 0.96), rgba(15, 10, 35, 0.98)), url('https://i.pinimg.com/736x/f3/30/39/f33039034dcce22a500a206f6e7ed286.jpg')` }}
    >
      {/* --- HEADER HUD: ULTRA NEON --- */}
      <div className="relative overflow-hidden bg-black/60 backdrop-blur-3xl border-2 border-purple-500/40 rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
        <div className="absolute top-0 right-0 p-4 opacity-20"><Activity size={100} className="text-purple-500 animate-pulse" /></div>
        
        <div className="relative flex flex-col xl:flex-row items-center gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-5 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-tr from-purple-600 to-fuchsia-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition duration-500"></div>
              <div className="relative w-20 h-20 bg-black border-2 border-purple-500/60 rounded-3xl flex items-center justify-center shadow-2xl">
                <Zap size={40} className="text-purple-400 fill-purple-400 animate-bounce" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-fuchsia-400 uppercase">
                RINJANI OS V2.0
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <p className="text-[10px] font-black text-purple-400/80 tracking-[0.3em] uppercase">Core Database Active</p>
              </div>
            </div>
          </div>

          {/* Controls Hub */}
          <div className="flex flex-wrap items-center justify-center gap-3 flex-1 px-8 py-4 bg-white/5 border-x border-white/10">
            <div className="flex items-center bg-black/50 border-2 border-purple-500/40 rounded-2xl px-5 py-3 hover:border-purple-400 transition-all shadow-[inset_0_0_15px_rgba(168,85,247,0.2)]">
              <Layers className="text-purple-500 w-5 h-5 mr-3" />
              <select 
                value={selectedSession} 
                onChange={e => setSelectedSession(e.target.value)}
                className="bg-transparent text-sm font-black text-white outline-none uppercase tracking-widest cursor-pointer"
              >
                <option value="SORE" className="bg-[#1a1030]">SESSION: SORE</option>
                <option value="PAGI" className="bg-[#1a1030]">SESSION: PAGI</option>
                <option value="MALAM" className="bg-[#1a1030]">SESSION: MALAM</option>
                <option value="ALL" className="bg-[#1a1030]">ALL PASARAN</option>
              </select>
            </div>

            <button onClick={() => setIsMuted(!isMuted)} className={`p-4 rounded-2xl border-2 transition-all duration-300 ${!isMuted ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>
              {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
            </button>

            <button onClick={() => setShowAlarmConfigModal(true)} className="px-6 py-4 bg-fuchsia-600/20 border-2 border-fuchsia-500/50 text-fuchsia-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-fuchsia-600 hover:text-white transition-all shadow-lg">
              <Bell size={18} className="inline mr-2" /> ALARM_CFG
            </button>

            <button onClick={() => { setPasaranList(prev => prev.map(p => (selectedSession === 'ALL' || p.session === selectedSession) ? { ...p, p1Prize: '-', p2Prize: '-', p3Prize: '-', status: 'BELUM' } : p)); addToast('Session Reset', 'info'); }} className="px-6 py-4 bg-amber-600/20 border-2 border-amber-500/50 text-amber-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-600 hover:text-white transition-all shadow-lg">
              <RotateCcw size={18} className="inline mr-2" /> RESET
            </button>
          </div>

          {/* Terminal Input HUD */}
          <div className="w-full xl:w-[450px] space-y-3">
            <form onSubmit={handleProcessLog} className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-purple-500/50"><Terminal size={14}/></div>
              <input 
                type="text" placeholder="CROSSCHECK LOG (E.G PERIODE : 686)" 
                value={resultStatusInput} onChange={e => setResultStatusInput(e.target.value)}
                className="w-full bg-black/80 border-2 border-purple-500/30 rounded-2xl pl-12 pr-24 py-3 text-[11px] font-black text-purple-300 uppercase outline-none focus:border-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all placeholder:text-purple-900"
              />
              <button type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] rounded-xl uppercase tracking-widest transition-all">DONE</button>
            </form>
            
            <div className="grid grid-cols-2 gap-2">
              <form onSubmit={handleProcessP1} className="relative">
                <input type="text" placeholder="P1 (E.G TOTO 5045)" value={p1TerminalInput} onChange={e => setP1TerminalInput(e.target.value)} className="w-full bg-black/80 border-2 border-cyan-500/30 rounded-2xl px-4 py-3 text-[11px] font-black text-cyan-300 uppercase outline-none focus:border-cyan-400 transition-all placeholder:text-cyan-900"/>
                <button type="submit" className="absolute right-2 top-2 bottom-2 px-3 bg-cyan-600 text-slate-950 font-black text-[10px] rounded-xl">P1</button>
              </form>
              <form onSubmit={handleProcessP3} className="relative">
                <input type="text" placeholder="P3 (E.G 11 22 33)" value={p123TerminalInput} onChange={e => setP123TerminalInput(e.target.value)} className="w-full bg-black/80 border-2 border-cyan-500/30 rounded-2xl px-4 py-3 text-[11px] font-black text-cyan-300 uppercase outline-none focus:border-cyan-400 transition-all placeholder:text-cyan-900"/>
                <button type="submit" className="absolute right-2 top-2 bottom-2 px-3 bg-cyan-600 text-slate-950 font-black text-[10px] rounded-xl">P3</button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN DATA TABLE: GLASSMORPISHM --- */}
      <div className="bg-black/40 backdrop-blur-2xl border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-6 flex justify-between items-center bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-3 bg-purple-600 rounded-full shadow-[0_0_15px_#a855f7]"></div>
            <h2 className="text-lg font-black text-white tracking-[0.4em] uppercase italic">System.Database_Entity</h2>
          </div>
          <button onClick={handleOpenAdd} className="px-8 py-3 bg-white text-slate-950 hover:bg-purple-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all transform active:scale-90 shadow-xl">
            <Plus size={18} className="inline mr-2" strokeWidth={3}/> ADD_PASARAN
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-[#150a2e]/80 text-[10px] font-black text-purple-400/60 uppercase tracking-[0.3em]">
              <tr>
                <th className="py-5 px-8">SHIFT</th>
                <th className="py-5 px-8">IDENTITY</th>
                <th className="py-5 px-8 text-center">T_OUT</th>
                <th className="py-5 px-8 text-center">T_RES</th>
                <th className="py-5 px-8 text-center">NET_LNK</th>
                <th className="py-5 px-8 text-center">REALTIME_STATUS</th>
                <th className="py-5 px-8 text-center text-purple-400">P1_PRIZE</th>
                <th className="py-5 px-8 text-center text-cyan-400">P2_PRIZE</th>
                <th className="py-5 px-8 text-center text-cyan-400">P3_PRIZE</th>
                <th className="py-5 px-8 text-right">OPSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pasaranList.filter(p => selectedSession === 'ALL' || p.session === selectedSession).sort((a,b) => a.jamTutup.localeCompare(b.jamTutup)).map(item => (
                <tr key={item.id} className="hover:bg-purple-500/10 transition-all group">
                  <td className="py-5 px-8">
                    <span className="px-3 py-1 bg-black border border-white/10 rounded-lg text-[9px] font-black text-slate-500 group-hover:text-purple-400">{item.session}</span>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white tracking-widest uppercase group-hover:text-purple-300">{item.name}</span>
                      <span className="text-[9px] font-black text-slate-600 uppercase mt-1">UUID: {item.id.slice(-8)}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-center font-black text-[11px] text-slate-300">{item.jamTutup}</td>
                  <td className="py-5 px-8 text-center font-black text-[11px] text-slate-300">{item.jamResult}</td>
                  <td className="py-5 px-8 text-center">
                    <button onClick={() => item.linkUrl?.split('\n').forEach(u => window.open(u.startsWith('http')?u:'https://'+u, '_blank'))} className="p-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 rounded-2xl text-slate-400 hover:text-purple-400 transition-all">
                      <ExternalLink size={16}/>
                    </button>
                  </td>
                  <td className="py-5 px-8 text-center">
                    {(() => {
                      if (item.status === 'DONE') return <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 text-[10px] font-black tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.2)]">DONE</div>;
                      if (item.status === 'LIBUR') return <div className="inline-block px-4 py-1 rounded-full bg-slate-800 border-2 border-slate-600 text-slate-400 text-[10px] font-black">LIBUR</div>;
                      const match = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
                      if (match) {
                        const t = parseInt(match[1])*3600 + parseInt(match[2])*60;
                        const n = currentTime.getHours()*3600 + currentTime.getMinutes()*60 + currentTime.getSeconds();
                        if (t - n > 0) return <div className="text-[10px] font-black text-purple-400 uppercase flex items-center justify-center gap-2 animate-pulse"><AlarmClock size={12}/> {Math.floor((t-n)/60)}M {((t-n)%60)}S</div>;
                      }
                      return <div className="inline-block px-4 py-1 rounded-full bg-fuchsia-600 text-white border-2 border-fuchsia-400 text-[10px] font-black animate-bounce shadow-[0_0_20px_#ff00ff]">RESULT NOW!</div>;
                    })()}
                  </td>
                  <td className="py-5 px-8 text-center">
                    <span className={`text-xl font-black tracking-[0.2em] ${item.p1Prize !== '-' ? 'text-purple-400 drop-shadow-[0_0_15px_#a855f7]' : 'text-slate-800'}`}>{item.p1Prize}</span>
                  </td>
                  <td className="py-5 px-8 text-center font-black text-cyan-400/50">{item.p2Prize}</td>
                  <td className="py-5 px-8 text-center font-black text-cyan-400/50">{item.p3Prize}</td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setPopupPasaran(item); setPopupText(generateAnnouncement(item)); setIsResultPopupOpen(true); }} className="p-3 bg-fuchsia-600/10 hover:bg-fuchsia-600 text-fuchsia-400 hover:text-white border-2 border-fuchsia-500/30 rounded-2xl transition-all"><Percent size={16}/></button>
                      <button onClick={() => handleOpenEdit(item)} className="p-3 bg-white/5 hover:bg-white text-slate-400 hover:text-slate-950 border-2 border-white/10 rounded-2xl transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => handleDeletePasaran(item.id, item.name)} className="p-3 bg-rose-900/20 hover:bg-rose-600 text-rose-500 hover:text-white border-2 border-rose-500/30 rounded-2xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ALARM POPUP HUD --- */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="relative w-full max-w-3xl text-center space-y-12">
            <div className="relative inline-block">
              <div className="absolute -inset-20 bg-purple-600/40 rounded-full blur-[100px] animate-pulse"></div>
              <div className="relative w-48 h-48 mx-auto rounded-[3rem] border-4 border-purple-500 bg-black flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.6)]">
                <AlarmClock size={100} className="text-white drop-shadow-[0_0_20px_#fff] animate-bounce" />
              </div>
            </div>
            <div className="space-y-6">
              <h2 className="text-6xl sm:text-8xl font-black text-white tracking-tighter uppercase italic drop-shadow-[0_0_40px_#a855f7]">{activeAlarm.pasaranName}</h2>
              <div className="inline-block px-12 py-4 bg-white text-slate-950 font-black text-2xl rounded-full shadow-2xl tracking-[0.3em]">RES_TIME: {activeAlarm.jamResult}</div>
            </div>
            <button onClick={() => { stopAlarmSound(); setActiveAlarm(null); }} className="relative group px-24 py-8 bg-purple-600 rounded-full transition-all active:scale-95 shadow-[0_0_50px_#a855f7]">
              <span className="text-2xl font-black text-white tracking-widest uppercase">Dismiss Interrupt</span>
            </button>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1a1030] border-4 border-purple-500/50 rounded-[3rem] w-full max-w-xl p-10 shadow-[0_0_100px_rgba(168,85,247,0.3)]">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4"><Zap className="text-purple-500 fill-purple-500" /> {editItem?'Configure identity':'New Registry'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={32}/></button>
            </div>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-1">Pasaran Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-black/50 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-black outline-none focus:border-purple-500 transition-all uppercase placeholder:text-slate-800"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Sesh Group</label>
                  <select value={form.session} onChange={e => setForm({...form, session: e.target.value as any})} className="w-full bg-black border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-black outline-none focus:border-purple-500"><option value="PAGI">PAGI</option><option value="SORE">SORE</option><option value="MALAM">MALAM</option></select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Status</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as any})} className="w-full bg-black border-2 border-white/10 rounded-2xl px-5 py-4 text-white font-black outline-none focus:border-purple-500"><option value="BELUM">BELUM</option><option value="DONE">DONE</option><option value="LIBUR">LIBUR</option></select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['p1','p2','p3'].map(p => (
                  <div key={p} className="space-y-2">
                    <label className="text-[10px] font-black text-cyan-500 uppercase ml-1 text-center block">{p.toUpperCase()}</label>
                    <input type="text" value={(form as any)[p]} onChange={e => setForm({...form, [p]: e.target.value})} className="w-full bg-cyan-950/20 border-2 border-cyan-500/30 rounded-2xl px-3 py-4 text-center font-black text-cyan-400 outline-none focus:border-cyan-500"/>
                  </div>
                ))}
              </div>
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-2xl bg-white/5 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Abort</button>
                <button type="submit" className="flex-[2] py-5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Submit Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESULT POPUP: SHIO HUD --- */}
      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#150a2e] border-4 border-purple-500 rounded-[3.5rem] w-full max-w-lg p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-10"><Percent size={200} className="text-purple-500" /></div>
            <div className="relative flex items-center gap-5 mb-10">
              <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center shadow-lg"><Sparkles className="text-white" /></div>
              <div><h3 className="text-2xl font-black text-white uppercase tracking-tighter">{popupPasaran.name}</h3><p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Calc. Shio Entity</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/50 border-2 border-white/5 rounded-3xl p-6 text-center">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Final_P1</span>
                <div className="text-5xl font-black text-purple-400 drop-shadow-[0_0_15px_#a855f7] tracking-tighter">{popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '----'}</div>
              </div>
              <div className="bg-black/50 border-2 border-white/5 rounded-3xl p-6 text-center flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Entity_Shio</span>
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{(popupPasaran.p1Prize && popupPasaran.p1Prize !== '-') ? calculateShio(popupPasaran.p1Prize).emoji : '❓'}</span>
                  <span className="text-2xl font-black text-white">{(popupPasaran.p1Prize && popupPasaran.p1Prize !== '-') ? calculateShio(popupPasaran.p1Prize).name : '----'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-10">
              <label className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] ml-1">Generated Output Teks</label>
              <textarea value={popupText} onChange={e => setPopupText(e.target.value)} rows={6} className="w-full bg-black/80 border-2 border-white/5 rounded-2xl p-6 text-xs font-mono text-cyan-300 leading-relaxed outline-none focus:border-purple-500 transition-all resize-none"/>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsResultPopupOpen(false)} className="flex-1 py-5 bg-white/5 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Exit</button>
              <button onClick={() => { navigator.clipboard.writeText(popupText); addToast('Copied', 'success'); setIsCopied(true); setTimeout(()=>setIsCopied(false),2000); }} className={`flex-[2] py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isCopied?'bg-emerald-500 text-slate-950':'bg-purple-600 text-white shadow-xl hover:scale-105'}`}>
                {isCopied ? <Check/> : <Copy/>} {isCopied ? 'Tersalin' : 'Copy Log Output'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ALARM CONFIG MODAL --- */}
      {showAlarmConfigModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1a1030] border-4 border-cyan-500/50 rounded-[3rem] w-full max-w-sm p-10 shadow-2xl">
            <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-4 mb-8"><AlarmClock className="text-cyan-400" /> System alert cfg</h3>
            <div className="space-y-6">
              <div className="p-5 bg-black/50 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase">Auto Popup</span>
                <input type="checkbox" checked={isAlarmEnabled} onChange={e => setIsAlarmEnabled(e.target.checked)} className="w-8 h-8 accent-cyan-500 cursor-pointer"/>
              </div>
              <div className="p-5 bg-black/50 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-xs font-black text-slate-300 uppercase">Audio Signal</span>
                <button onClick={() => setIsMuted(!isMuted)} className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${isMuted?'bg-rose-500/10 border-rose-500 text-rose-500':'bg-cyan-500/10 border-cyan-500 text-cyan-500'}`}>
                  {isMuted ? 'SIGNAL: MUTED' : 'SIGNAL: ACTIVE'}
                </button>
              </div>
              <button onClick={() => { setShowAlarmConfigModal(false); triggerAlarm({ pasaranName: 'TEST SYSTEM', jamTutup: '00:00', jamResult: '00:00', session: 'TEST' }); }} className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-cyan-900/40">Run Diagnostic Test</button>
              <button onClick={() => setShowAlarmConfigModal(false)} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase">Close Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
