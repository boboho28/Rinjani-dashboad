import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    if (!isAlarmEnabled) return;

    const now = currentTime;
    const nowTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const todayDateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    pasaranList.forEach((item) => {
      if (item.status === 'BELUM') {
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
                session: item.session,
                title: `RESULT ${item.name} ${item.jamTutup.replace(' WIB', '')}`,
              });
            }
          }
        }
      }
    });
  }, [currentTime, pasaranList, isAlarmEnabled]);

  // --- TERMINAL LOGIC (DIPERBAIKI UNTUK FILTER NAMA PASARAN) ---
  const [resultStatusInput, setResultStatusInput] = useState<string>('');
  const [p1TerminalInput, setP1TerminalInput] = useState<string>('');
  const [p123TerminalInput, setP123TerminalInput] = useState<string>('');

  const [isResultPopupOpen, setIsResultPopupOpen] = useState<boolean>(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const findTargetPasaran = (inputStr: string): PasaranItem | undefined => {
    if (!pasaranList || pasaranList.length === 0) return undefined;
    const upperInput = inputStr.toUpperCase().trim();
    // Sort pasaran by name length to ensure longer names (BANGKOK 0130) match before shorter names (BANGKOK)
    const sortedPasaran = [...pasaranList].sort((a, b) => b.name.length - a.name.length);
    return sortedPasaran.find((p) => upperInput.includes(p.name.toUpperCase()));
  };

  const handleProcessP1Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = p1TerminalInput.toUpperCase().trim();
    const matched = findTargetPasaran(raw);

    if (!matched) {
      addToast('Pasaran tidak ditemukan dalam input.', 'error');
      return;
    }

    // PENGATURAN PENTING: Membuang nama pasaran dari teks agar angka di nama pasaran (0130) tidak terambil
    const textRemainder = raw.replace(matched.name.toUpperCase(), "").trim();
    const numbersFound = textRemainder.match(/\d+/g);

    if (!numbersFound) {
      addToast(`Angka result untuk ${matched.name} tidak ditemukan.`, 'error');
      return;
    }

    const val = numbersFound[0];

    setPasaranList((prev) =>
      prev.map((item) =>
        item.id === matched.id ? { ...item, p1Prize: val } : item
      )
    );

    addToast(`✅ P1 ${matched.name}: ${val} berhasil di-input!`, 'success');
    setP1TerminalInput('');
  };

  const handleProcessP123Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = p123TerminalInput.toUpperCase().trim();
    const matched = findTargetPasaran(raw);

    if (!matched) {
      addToast('Pasaran tidak ditemukan.', 'error');
      return;
    }

    // Membuang nama pasaran dari teks
    const remainder = raw.replace(matched.name.toUpperCase(), "").trim();
    
    // Mencari angka setelah kata kunci PRIZE 1, 2, atau 3
    const extractPrize = (num: number) => {
      const regex = new RegExp(`PRIZE\\s*${num}\\s*[:\\-]?\\s*(\\d+)`, "i");
      const m = remainder.match(regex);
      return m ? m[1] : null;
    };

    const p1 = extractPrize(1);
    const p2 = extractPrize(2);
    const p3 = extractPrize(3);

    if (!p1) {
      addToast('Gagal mengambil PRIZE 1. Pastikan format: PRIZE 1: XXXX', 'error');
      return;
    }

    setPasaranList((prev) =>
      prev.map((item) =>
        item.id === matched.id
          ? { ...item, p1Prize: p1, p2Prize: p2 || '-', p3Prize: p3 || '-' }
          : item
      )
    );

    addToast(`✅ P123 ${matched.name} berhasil di-input!`, 'success');
    setP123TerminalInput('');
  };

  const handleProcessResultStatusInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultStatusInput.trim()) return;
    const raw = resultStatusInput.toUpperCase();
    const matched = findTargetPasaran(raw);

    if (!matched) {
      addToast('Nama pasaran tidak ditemukan.', 'error');
      return;
    }

    setPasaranList((prev) =>
      prev.map((item) =>
        item.id === matched.id ? { ...item, status: 'DONE' as any } : item
      )
    );

    addToast(`✅ ${matched.name} diubah menjadi DONE.`, 'success');
    setResultStatusInput('');
  };

  // --- SHIO LOGIC ---
  const calculateShio = (p1Prize?: string) => {
    if (!p1Prize || p1Prize === '-') return { name: '-', emoji: '❓' };
    const clean = p1Prize.replace(/\D/g, '');
    if (clean.length < 2) return { name: '-', emoji: '❓' };
    const last2 = clean.slice(-2);
    if (last2 === '00') return { name: 'KELINCI', emoji: '🐇' };
    const num = parseInt(last2, 10);
    const mod = num % 12;
    const map: any = { 1:['KUDA','🐎'], 2:['ULAR','🐍'], 3:['NAGA','🐉'], 4:['KELINCI','🐇'], 5:['HARIMAU','🐅'], 6:['KERBAU','🐂'], 7:['TIKUS','🐀'], 8:['BABI','🐖'], 9:['ANJING','🐕'], 10:['AYAM','🐓'], 11:['MONYET','🐒'], 0:['KAMBING','🐐'] };
    return { name: map[mod][0], emoji: map[mod][1] };
  };

  // --- CRUD FUNCTIONS ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PasaranItem | null>(null);
  const [form, setForm] = useState({ name: '', session: 'SORE', tutup: '18:00 WIB', result: '18:30 WIB', links: '', p1: '-', p2: '-', p3: '-', status: 'BELUM' });

  const handleOpenAddModal = () => {
    setEditItem(null);
    setForm({ name: '', session: 'SORE', tutup: '18:00 WIB', result: '18:30 WIB', links: '', p1: '-', p2: '-', p3: '-', status: 'BELUM' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PasaranItem) => {
    setEditItem(item);
    setForm({ name: item.name, session: item.session, tutup: item.jamTutup, result: item.jamResult, links: item.linkUrl || '', p1: item.p1Prize, p2: item.p2Prize || '-', p3: item.p3Prize || '-', status: item.status });
    setIsModalOpen(true);
  };

  const handleSavePasaran = (e: React.FormEvent) => {
    e.preventDefault();
    const data: PasaranItem = {
      id: editItem ? editItem.id : `p-${Date.now()}`,
      name: form.name.toUpperCase(),
      session: form.session as any,
      jamTutup: form.tutup,
      jamResult: form.result,
      linkUrl: form.links,
      p1Prize: form.p1,
      p2Prize: form.p2,
      p3Prize: form.p3,
      status: form.status as any,
      isResultNow: false
    };

    if (editItem) {
      setPasaranList((prev) => prev.map(p => p.id === editItem.id ? data : p));
    } else {
      setPasaranList((prev) => [data, ...prev]);
    }
    setIsModalOpen(false);
    addToast('Pasaran berhasil disimpan.', 'success');
  };

  // --- RENDER LOGIC ---
  const sortedFilteredList = useMemo(() => {
    let list = pasaranList;
    if (selectedSession !== 'ALL PASARAN') {
      list = list.filter(p => p.session === selectedSession);
    }
    return [...list].sort((a, b) => a.jamTutup.localeCompare(b.jamTutup));
  }, [pasaranList, selectedSession]);

  const renderResultStatusBadge = (item: PasaranItem) => {
    if (item.status === 'DONE') return <div className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-3 py-1 rounded-full uppercase">SUDAH RESULT</div>;
    if (item.status === 'LIBUR') return <div className="bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase">PASARAN LIBUR</div>;
    
    const match = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
    if (!match) return <div className="text-[10px] font-black text-cyan-400">BELUM RESULT</div>;
    
    const nowSecs = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();
    const tutupSecs = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
    const diff = tutupSecs - nowSecs;

    if (diff > 0) {
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      return <div className="bg-cyan-950/80 text-cyan-300 border border-cyan-400/60 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">⏳ TUTUP: {m.toString().padStart(2,'0')}:{s.toString().padStart(2,'0')}</div>;
    }
    return <div className="bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-500/60 text-[10px] font-black px-3 py-1 rounded-full uppercase animate-pulse">RESULT NOW!</div>;
  };

  return (
    <div className="space-y-5 font-sans text-slate-100">
      
      <style>{`
        .digital-clock-container {
          background: #000;
          padding: 2px 10px;
          font-size: 24px;
          font-family: 'Courier New', Courier, monospace;
          color: #fff;
          font-weight: bold;
          border-radius: 8px;
          border: 1px solid #333;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: inline-block;
          line-height: 1.2;
        }
        .digital-clock-container::after {
          content: ""; display: block; height: 3px; width: 50%; background: #ff0000; margin-top: 2px;
        }
        .cyber-3d-text {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 900;
          font-style: italic;
          letter-spacing: 0.05em;
          color: #fff;
          text-shadow: 1.5px 1.5px 0 #9333ea, 3px 3px 0 #4c1d95, 0 0 18px #22d3ee;
          display: inline-block;
        }
      `}</style>

      {/* HEADER TOOLBAR */}
      <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sticky top-[100px] z-30 bg-[#0b0f1a]">
        
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-[#151128] border-2 border-[#ccff00]/60 rounded-xl px-3 py-1.5 text-xs font-black text-[#ccff00]">
              <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="bg-transparent outline-none uppercase cursor-pointer">
                <option value="SORE" className="bg-[#121325]">SESI SORE</option>
                <option value="PAGI" className="bg-[#121325]">SESI PAGI</option>
                <option value="MALAM" className="bg-[#121325]">SESI MALAM</option>
                <option value="ALL PASARAN" className="bg-[#121325]">ALL PASARAN</option>
              </select>
            </div>
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-[#181a2c] border-2 border-[#ccff00]/50 text-[#ccff00] rounded-xl transition-all">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={() => setShowAlarmConfigModal(true)} className="bg-rose-600 text-white font-black px-4 py-2 rounded-xl text-xs uppercase shadow-lg hover:bg-rose-500 transition-all"><Bell className="w-4 h-4 inline mr-1" /> ALARM CFG</button>
            <button onClick={handleOpenAddModal} className="bg-[#ccff00] text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase shadow-lg hover:bg-[#e5ff80] transition-all"><Plus className="w-4 h-4 inline mr-1" /> ADD PASARAN</button>
            <button onClick={() => { if(window.confirm("Reset semua status & result di sesi ini?")) setPasaranList(prev => prev.map(p => (selectedSession==='ALL PASARAN' || p.session===selectedSession) ? {...p, p1Prize:'-', p2Prize:'-', p3Prize:'-', status:'BELUM'} : p)); }} className="bg-orange-600 text-white font-black px-4 py-2 rounded-xl text-xs uppercase shadow-lg hover:bg-orange-500 transition-all"><RotateCcw className="w-4 h-4 inline mr-1" /> RESET SESI</button>
          </div>
          <div className="flex items-center gap-2">
             <Zap className="w-5 h-5 text-[#ccff00] animate-pulse" />
             <h1 className="text-xl font-black text-[#ccff00] font-brand tracking-widest uppercase">SHORTCUT RESULT</h1>
          </div>
        </div>

        {/* TERMINAL PANEL */}
        <div className="w-full lg:w-[520px] border-2 border-[#ccff00]/80 bg-[#070410] rounded-2xl p-3 space-y-2 shadow-2xl relative">
          <div className="absolute -top-3 left-4 bg-[#ccff00] text-black text-[9px] font-black px-2 py-0.5 rounded uppercase">TERMINAL PRIZE</div>
          <form onSubmit={handleProcessResultStatusInput} className="flex gap-2">
             <input type="text" placeholder="CROSSCHECK LOG / STATUS" value={resultStatusInput} onChange={(e)=>setResultStatusInput(e.target.value)} className="bg-black border border-[#ccff00]/40 rounded-lg px-3 py-1.5 text-xs text-[#ccff00] flex-1 outline-none font-bold placeholder-slate-700" />
             <button type="submit" className="bg-[#ccff00] text-black font-black px-4 py-1.5 rounded-lg text-[10px] hover:bg-[#e5ff80] transition-all">DONE</button>
          </form>
          <form onSubmit={handleProcessP1Terminal} className="flex gap-2">
             <input type="text" placeholder="P1 (e.g. BANGKOK 0130 5215)" value={p1TerminalInput} onChange={(e)=>setP1TerminalInput(e.target.value)} className="bg-black border border-[#ccff00]/40 rounded-lg px-3 py-1.5 text-xs text-[#ccff00] flex-1 outline-none font-bold placeholder-slate-700" />
             <button type="submit" className="bg-[#ccff00] text-black font-black px-4 py-1.5 rounded-lg text-[10px] hover:bg-[#e5ff80] transition-all">P1</button>
          </form>
          <form onSubmit={handleProcessP123Terminal} className="flex gap-2">
             <textarea placeholder="P123 (Format PRIZE 1: XXXX)" value={p123TerminalInput} onChange={(e)=>setP123TerminalInput(e.target.value)} className="bg-black border border-[#ccff00]/40 rounded-lg px-3 py-1.5 text-xs text-[#ccff00] flex-1 outline-none font-bold resize-none h-14 placeholder-slate-700" />
             <button type="submit" className="bg-[#ccff00] text-black font-black px-4 h-14 rounded-lg text-[10px] hover:bg-[#e5ff80] transition-all">P123</button>
          </form>
        </div>
      </div>

      {/* RESULT TABLE */}
      <div className="bg-[#080b14] border border-[#ccff00]/30 rounded-2xl overflow-x-auto shadow-2xl custom-scrollbar max-h-[calc(100vh-350px)]">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead className="sticky top-0 z-20 bg-[#0d1222] shadow-lg">
            <tr className="border-b-2 border-[#ccff00]/40 text-[11px] font-black text-[#ccff00] uppercase tracking-wider">
              <th className="p-4">SESH</th>
              <th className="p-4">NAMA PASARAN</th>
              <th className="p-4 text-center">JAM TUTUP</th>
              <th className="p-4 text-center">JAM RESULT</th>
              <th className="p-4 text-center">P1</th>
              <th className="p-4 text-center">P2</th>
              <th className="p-4 text-center">P3</th>
              <th className="p-4 text-center">STATUS</th>
              <th className="p-4 text-right">OPSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ccff00]/10">
            {sortedFilteredList.map((item) => (
              <tr key={item.id} className={`hover:bg-[#ccff00]/5 transition-all ${item.status==='DONE' ? 'bg-[#ccff00]/5' : ''}`}>
                <td className="p-4">
                  <div className="bg-purple-900/30 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] font-black w-fit uppercase">{item.session}</div>
                </td>
                <td className="p-4">
                  <span className="font-brand font-black italic uppercase text-[15px] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]">{item.name}</span>
                </td>
                <td className="p-4 text-center">
                  <div className="digital-clock-container">{item.jamTutup.replace(' WIB','')}</div>
                </td>
                <td className="p-4 text-center">
                  <div className="digital-clock-container">{item.jamResult.replace(' WIB','')}</div>
                </td>
                <td className="p-4 text-center">
                  <span className="cyber-3d-text text-[24px]">{item.p1Prize}</span>
                </td>
                <td className="p-4 text-center">
                  <span className="cyber-3d-text text-[22px]">{item.p2Prize || '-'}</span>
                </td>
                <td className="p-4 text-center">
                  <span className="cyber-3d-text text-[22px]">{item.p3Prize || '-'}</span>
                </td>
                <td className="p-4 text-center">
                  {renderResultStatusBadge(item)}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={()=>handleOpenResultPopup(item)} className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] rounded-lg hover:bg-[#ccff00] hover:text-black transition-all" title="Hasil Result & Shio"><Percent className="w-3.5 h-3.5" /></button>
                    <button onClick={()=>handleOpenEditModal(item)} className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] rounded-lg hover:bg-[#ccff00] hover:text-black transition-all" title="Edit Pasaran"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={()=>{ if(window.confirm("Hapus pasaran ini?")) setPasaranList(prev => prev.filter(p=>p.id!==item.id)); }} className="p-1.5 bg-rose-950/80 border border-rose-500/40 text-rose-400 rounded-lg hover:bg-rose-600 hover:text-white transition-all" title="Hapus Pasaran"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedFilteredList.length === 0 && (
              <tr>
                 <td colSpan={9} className="p-20 text-center text-slate-500 font-bold uppercase italic">Tidak ada pasaran yang ditampilkan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1222] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
             <h2 className="text-[#ccff00] font-black uppercase tracking-widest border-b border-[#ccff00]/20 pb-2">{editItem ? "EDIT PASARAN" : "TAMBAH PASARAN"}</h2>
             <form onSubmit={handleSavePasaran} className="space-y-4">
                <div>
                   <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">NAMA PASARAN</label>
                   <input required type="text" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none" placeholder="e.g. BANGKOK 0130" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">JAM TUTUP</label>
                      <input type="text" value={form.tutup} onChange={(e)=>setForm({...form, tutup: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none" />
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">JAM RESULT</label>
                      <input type="text" value={form.result} onChange={(e)=>setForm({...form, result: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none" />
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                   <div><label className="text-[10px] block text-slate-400 uppercase">P1</label><input type="text" value={form.p1} onChange={(e)=>setForm({...form, p1: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl p-2 text-[#ccff00] text-center font-black" /></div>
                   <div><label className="text-[10px] block text-slate-400 uppercase">P2</label><input type="text" value={form.p2} onChange={(e)=>setForm({...form, p2: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl p-2 text-[#ccff00] text-center" /></div>
                   <div><label className="text-[10px] block text-slate-400 uppercase">P3</label><input type="text" value={form.p3} onChange={(e)=>setForm({...form, p3: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl p-2 text-[#ccff00] text-center" /></div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 text-slate-400 font-bold text-xs hover:text-white transition-all uppercase">BATAL</button>
                   <button type="submit" className="bg-[#ccff00] text-black font-black px-6 py-2 rounded-xl text-xs shadow-lg uppercase hover:bg-[#e5ff80] transition-all">SIMPAN PASARAN</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* ALARM POPUP */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-[#0b0f1a] border-4 border-[#ccff00] rounded-[40px] p-10 text-center space-y-6 shadow-[0_0_60px_rgba(204,255,0,0.6)] animate-bounce">
            <div className="text-7xl animate-pulse">⏰</div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">PASARAN SUDAH TUTUP!</h1>
            <div className="text-7xl font-black text-[#ccff00] drop-shadow-[0_0_20px_#ccff00] font-brand italic uppercase">{activeAlarm.pasaranName}</div>
            <p className="text-2xl text-slate-400 font-bold uppercase tracking-widest">JAM TUTUP: {activeAlarm.jamTutup}</p>
            <button onClick={handleDismissAlarm} className="bg-[#ccff00] text-black font-black px-16 py-5 rounded-full text-2xl shadow-[0_0_30px_#ccff00] hover:scale-110 transition-all uppercase font-brand">OK SAYA MENGERTI</button>
          </div>
        </div>
      )}

      {/* RESULT/SHIO MODAL */}
      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e1b] border-2 border-[#ccff00]/70 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
             <div className="flex justify-between items-center border-b border-[#ccff00]/20 pb-3">
                <h3 className="text-[#ccff00] font-black uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-4 h-4" /> HASIL RESULT & SHIO</h3>
                <button onClick={()=>setIsResultPopupOpen(false)}><X className="text-slate-400 hover:text-white transition-all" /></button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/60 p-4 rounded-xl border border-[#ccff00]/30 text-center">
                   <span className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">RESULT P1</span>
                   <span className="cyber-3d-text text-4xl">{popupPasaran.p1Prize}</span>
                </div>
                <div className="bg-black/60 p-4 rounded-xl border border-[#ccff00]/30 text-center">
                   <span className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">SHIO</span>
                   <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-4xl">{calculateShio(popupPasaran.p1Prize).emoji}</span>
                      <span className="text-xl font-black text-white uppercase">{calculateShio(popupPasaran.p1Prize).name}</span>
                   </div>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3 h-3" /> TEKS REKAPAN OTOMATIS</label>
                <textarea readOnly value={popupText} rows={6} className="w-full bg-black border border-slate-800 p-3 rounded-xl text-xs text-cyan-300 font-mono leading-relaxed" />
             </div>
             <div className="flex justify-end gap-3 pt-2">
                <button onClick={()=>{ navigator.clipboard.writeText(popupText); addToast('Rekapan disalin ke Clipboard!','success'); setIsCopied(true); setTimeout(()=>setIsCopied(false),2000); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase ${isCopied ? 'bg-emerald-500 text-slate-950' : 'bg-[#ccff00] text-slate-950 shadow-lg'}`}>
                   {isCopied ? <><Check className="w-4 h-4" /> TERSALIN!</> : <><Copy className="w-4 h-4" /> SALIN REKAPAN</>}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ALARM CONFIG MODAL */}
      {showAlarmConfigModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-[#ccff00]">
                 <h3 className="font-black uppercase flex items-center gap-2"><AlarmClock className="w-5 h-5" /> ALARM SETTINGS</h3>
                 <button onClick={()=>setShowAlarmConfigModal(false)}><X /></button>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-slate-800">
                 <span className="text-xs font-bold text-white uppercase">AKTIFKAN POPUP ALARM</span>
                 <input type="checkbox" checked={isAlarmEnabled} onChange={(e)=>setIsAlarmEnabled(e.target.checked)} className="w-5 h-5 accent-[#ccff00] cursor-pointer" />
              </div>
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-slate-800">
                 <span className="text-xs font-bold text-white uppercase">BUNYI SIRINE</span>
                 <button onClick={()=>setIsMuted(!isMuted)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase border transition-all ${isMuted ? 'bg-rose-950 text-rose-400 border-rose-900' : 'bg-emerald-950 text-emerald-400 border-emerald-900'}`}>
                    {isMuted ? 'NONAKTIF' : 'AKTIF'}
                 </button>
              </div>
              <button onClick={()=>{ triggerAlarm({pasaranName:'UJI COBA ALARM', jamTutup:'00:00', jamResult:'00:00', session:'SORE'}); }} className="w-full bg-[#ccff00] text-black font-black py-3 rounded-xl text-xs uppercase hover:bg-[#e5ff80] shadow-lg">TEST POPUP ALARM</button>
           </div>
        </div>
      )}
    </div>
  );
};
