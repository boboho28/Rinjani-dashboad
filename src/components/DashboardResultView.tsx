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

  // --- ALARM SYSTEM ---
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
      try { audioCtxRef.current.close(); } catch (e) {}
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
      const playBeep = () => {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      };
      playBeep();
      alarmIntervalRef.current = setInterval(playBeep, 700);
    } catch (err) {}
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
    if (!isAlarmEnabled) return;
    const now = currentTime;
    const nowTotal = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    pasaranList.forEach((item) => {
      if (item.status === 'BELUM') {
        const match = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const tutup = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
          if (tutup - nowTotal <= 0 && tutup - nowTotal >= -3) {
            const key = `${item.id}-${today}-${item.jamTutup}`;
            if (!triggeredAlarmsRef.current.has(key)) {
              triggeredAlarmsRef.current.add(key);
              triggerAlarm({
                pasaranName: item.name,
                jamTutup: item.jamTutup,
                jamResult: item.jamResult,
                session: item.session,
              });
            }
          }
        }
      }
    });
  }, [currentTime, pasaranList, isAlarmEnabled]);

  // --- TERMINAL LOGIC (FIXED EXTRACTION) ---
  const [resultStatusInput, setResultStatusInput] = useState('');
  const [p1TerminalInput, setP1TerminalInput] = useState('');
  const [p123TerminalInput, setP123TerminalInput] = useState('');

  const [isResultPopupOpen, setIsResultPopupOpen] = useState(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const findTargetPasaran = (inputStr: string): PasaranItem | undefined => {
    if (!pasaranList || pasaranList.length === 0) return undefined;
    const upperInput = inputStr.toUpperCase().trim();
    // Cari nama pasaran yang paling panjang dulu agar presisi (BANGKOK 0130 vs BANGKOK)
    const sorted = [...pasaranList].sort((a, b) => b.name.length - a.name.length);
    return sorted.find((p) => upperInput.includes(p.name.toUpperCase()));
  };

  const handleProcessP1Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = p1TerminalInput.toUpperCase().trim();
    const matched = findTargetPasaran(raw);

    if (!matched) {
      addToast('Pasaran tidak ditemukan.', 'error');
      return;
    }

    // LOGIKA PERBAIKAN: Hapus nama pasaran secara eksplisit dari string input
    // Jadi jika input "BANGKOK 0130 5250", sisanya adalah " 5250"
    const textRemainder = raw.replace(matched.name.toUpperCase(), "").trim();
    const numbersFound = textRemainder.match(/\d+/g);

    if (!numbersFound) {
      addToast(`Angka result sesudah nama pasaran tidak ditemukan.`, 'error');
      return;
    }

    const val = numbersFound[0];
    setPasaranList((prev) => prev.map((p) => p.id === matched.id ? { ...p, p1Prize: val } : p));
    addToast(`✅ P1 ${matched.name}: ${val} Berhasil!`, 'success');
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

    // Buang nama pasaran dari teks agar angka di nama pasaran tidak mengganggu
    const remainder = raw.replace(matched.name.toUpperCase(), "").trim();
    
    const extractPrize = (num: number) => {
      // Cari angka setelah kata kunci PRIZE X atau P X
      const regex = new RegExp(`(?:PRIZE|P)\\s*${num}\\s*[:\\-]?\\s*(\\d+)`, "i");
      const m = remainder.match(regex);
      return m ? m[1] : null;
    };

    const p1 = extractPrize(1);
    const p2 = extractPrize(2);
    const p3 = extractPrize(3);

    if (!p1) {
      addToast('Format salah! Gunakan: PRIZE 1: XXXX', 'error');
      return;
    }

    setPasaranList((prev) =>
      prev.map((p) =>
        p.id === matched.id ? { ...p, p1Prize: p1, p2Prize: p2 || '-', p3Prize: p3 || '-' } : p
      )
    );
    addToast(`✅ P123 ${matched.name} Berhasil!`, 'success');
    setP123TerminalInput('');
  };

  const handleProcessResultStatusInput = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = findTargetPasaran(resultStatusInput);
    if (!matched) return;
    setPasaranList((prev) => prev.map((p) => p.id === matched.id ? { ...p, status: 'DONE' as any } : p));
    addToast(`✅ ${matched.name} Status DONE.`, 'success');
    setResultStatusInput('');
  };

  // --- SHIO & REKAPAN ---
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

  const handleOpenResultPopup = (item: PasaranItem) => {
    setPopupPasaran(item);
    const shio = calculateShio(item.p1Prize);
    const now = new Date();
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const text = `Hasil Pengeluaran ${item.name}\nHari Ini ${days[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${months[now.getMonth()]} ${now.getFullYear()}\nResult : ${item.p1Prize}\nSHIO : ${shio.name}\nSelamat Kepada Pemenang, Salam JP Hanya di TogelUP`;
    setPopupText(text);
    setIsResultPopupOpen(true);
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
    if (editItem) setPasaranList(pasaranList.map(p => p.id === editItem.id ? data : p));
    else setPasaranList([data, ...pasaranList]);
    setIsModalOpen(false);
    addToast('Data pasaran disimpan.', 'success');
  };

  // --- RENDER ---
  const sortedFilteredList = useMemo(() => {
    let list = pasaranList;
    if (selectedSession !== 'ALL PASARAN') list = list.filter(p => p.session === selectedSession);
    return [...list].sort((a, b) => a.jamTutup.localeCompare(b.jamTutup));
  }, [pasaranList, selectedSession]);

  const renderStatus = (item: PasaranItem) => {
    if (item.status === 'DONE') return <div className="bg-[#ccff00] text-black border border-[#ccff00] text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-[0_0_10px_rgba(204,255,0,0.4)]">DONE</div>;
    if (item.status === 'LIBUR') return <div className="bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-black px-3 py-1 rounded-full uppercase">LIBUR</div>;
    return <div className="bg-rose-600 text-white border border-rose-400 text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-[0_0_10px_rgba(225,29,72,0.4)]">BELUM</div>;
  };

  return (
    <div className="space-y-5 font-sans text-slate-100">
      
      <style>{`
        .digital-clock-container {
          background: #000; padding: 2px 10px; font-size: 24px;
          font-family: 'Courier New', Courier, monospace; color: #fff; font-weight: bold;
          border-radius: 8px; border: 1px solid #333; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: inline-block; line-height: 1.2;
        }
        .digital-clock-container::after {
          content: ""; display: block; height: 3px; width: 50%; background: #ff0000; margin-top: 2px;
        }
        .cyber-3d-text {
          font-family: 'JetBrains Mono', monospace; font-weight: 900; font-style: italic;
          letter-spacing: 0.05em; color: #fff;
          text-shadow: 1.5px 1.5px 0 #9333ea, 3px 3px 0 #4c1d95, 0 0 18px #22d3ee;
          display: inline-block;
        }
      `}</style>

      {/* TOOLBAR */}
      <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-[100px] z-30">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="bg-[#151128] border-2 border-[#ccff00]/60 rounded-xl px-3 py-1.5 text-xs font-black text-[#ccff00]">
            <select value={selectedSession} onChange={(e)=>setSelectedSession(e.target.value)} className="bg-transparent outline-none uppercase cursor-pointer">
              <option value="SORE">SESI SORE</option><option value="PAGI">SESI PAGI</option><option value="MALAM">SESI MALAM</option><option value="ALL PASARAN">ALL PASARAN</option>
            </select>
          </div>
          <button onClick={()=>setIsMuted(!isMuted)} className="p-2 bg-[#181a2c] border-2 border-[#ccff00]/50 text-[#ccff00] rounded-xl">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button onClick={()=>setShowAlarmConfigModal(true)} className="bg-rose-600 text-white font-black px-4 py-2 rounded-xl text-xs uppercase shadow-lg"><Bell className="w-4 h-4 inline mr-1" /> ALARM CFG</button>
          <button onClick={handleOpenAddModal} className="bg-[#ccff00] text-slate-950 font-black px-4 py-2 rounded-xl text-xs uppercase shadow-lg"><Plus className="w-4 h-4 inline mr-1" /> ADD PASARAN</button>
          <button onClick={()=>{ if(window.confirm("Reset semua data?")) setPasaranList(prev => prev.map(p => (selectedSession==='ALL PASARAN' || p.session===selectedSession) ? {...p, p1Prize:'-', p2Prize:'-', p3Prize:'-', status:'BELUM'} : p)); }} className="bg-orange-600 text-white font-black px-4 py-2 rounded-xl text-xs uppercase shadow-lg"><RotateCcw className="w-4 h-4 inline mr-1" /> RESET SESI</button>
        </div>

        {/* TERMINAL */}
        <div className="w-full lg:w-[520px] border-2 border-[#ccff00]/80 bg-[#070410] rounded-2xl p-3 space-y-2 shadow-2xl relative">
          <div className="absolute -top-3 left-4 bg-[#ccff00] text-black text-[9px] font-black px-2 py-0.5 rounded uppercase">TERMINAL PRIZE</div>
          <form onSubmit={handleProcessResultStatusInput} className="flex gap-2">
             <input type="text" placeholder="CROSSCHECK LOG / STATUS" value={resultStatusInput} onChange={(e)=>setResultStatusInput(e.target.value)} className="bg-black border border-[#ccff00]/40 rounded-lg px-3 py-1.5 text-xs text-[#ccff00] flex-1 outline-none font-bold" />
             <button type="submit" className="bg-[#ccff00] text-black font-black px-4 py-1.5 rounded-lg text-[10px]">DONE</button>
          </form>
          <form onSubmit={handleProcessP1Terminal} className="flex gap-2">
             <input type="text" placeholder="P1 (e.g. BANGKOK 0130 5215)" value={p1TerminalInput} onChange={(e)=>setP1TerminalInput(e.target.value)} className="bg-black border border-[#ccff00]/40 rounded-lg px-3 py-1.5 text-xs text-[#ccff00] flex-1 outline-none font-bold" />
             <button type="submit" className="bg-[#ccff00] text-black font-black px-4 py-1.5 rounded-lg text-[10px]">P1</button>
          </form>
          <form onSubmit={handleProcessP123Terminal} className="flex gap-2">
             <textarea placeholder="P123 (Format PRIZE 1: XXXX)" value={p123TerminalInput} onChange={(e)=>setP123TerminalInput(e.target.value)} className="bg-black border border-[#ccff00]/40 rounded-lg px-3 py-1.5 text-xs text-[#ccff00] flex-1 outline-none font-bold resize-none h-14" />
             <button type="submit" className="bg-[#ccff00] text-black font-black px-4 h-14 rounded-lg text-[10px]">P123</button>
          </form>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#080b14] border border-[#ccff00]/30 rounded-2xl overflow-x-auto shadow-2xl">
        <table className="w-full text-left min-w-[1100px]">
          <thead className="sticky top-0 z-20 bg-[#0d1222] shadow-lg">
            <tr className="border-b-2 border-[#ccff00]/40 text-[11px] font-black text-[#ccff00] uppercase tracking-wider">
              <th className="p-4">SESH</th><th className="p-4">NAMA PASARAN</th>
              <th className="p-4 text-center">JAM TUTUP</th><th className="p-4 text-center">JAM RESULT</th>
              <th className="p-4 text-center">P1</th><th className="p-4 text-center">P2</th><th className="p-4 text-center">P3</th>
              <th className="p-4 text-center">STATUS</th><th className="p-4 text-right">OPSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ccff00]/10">
            {sortedFilteredList.map((item) => (
              <tr key={item.id} className="hover:bg-[#ccff00]/5 transition-all">
                <td className="p-4"><div className="bg-purple-900/30 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded text-[10px] font-black w-fit uppercase">{item.session}</div></td>
                <td className="p-4"><span className="font-brand font-black italic uppercase text-[15px] text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]">{item.name}</span></td>
                <td className="p-4 text-center"><div className="digital-clock-container">{item.jamTutup.replace(' WIB','')}</div></td>
                <td className="p-4 text-center"><div className="digital-clock-container">{item.jamResult.replace(' WIB','')}</div></td>
                <td className="p-4 text-center"><span className="cyber-3d-text text-[24px]">{item.p1Prize}</span></td>
                <td className="p-4 text-center"><span className="cyber-3d-text text-[22px]">{item.p2Prize || '-'}</span></td>
                <td className="p-4 text-center"><span className="cyber-3d-text text-[22px]">{item.p3Prize || '-'}</span></td>
                <td className="p-4 text-center">{renderStatus(item)}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={()=>handleOpenResultPopup(item)} className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] rounded-lg hover:bg-[#ccff00] hover:text-black transition-all"><Percent className="w-3.5 h-3.5" /></button>
                    <button onClick={()=>handleOpenEditModal(item)} className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] rounded-lg hover:bg-[#ccff00] hover:text-black transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={()=>{ if(window.confirm("Hapus?")) setPasaranList(prev=>prev.filter(p=>p.id!==item.id)); }} className="p-1.5 bg-rose-950/80 border border-rose-500/40 text-rose-400 rounded-lg hover:bg-rose-600 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALS (CRUD, ALARM, RESULT) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1222] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
             <h2 className="text-[#ccff00] font-black uppercase tracking-widest border-b border-[#ccff00]/20 pb-2">{editItem ? "EDIT" : "TAMBAH"} PASARAN</h2>
             <form onSubmit={handleSavePasaran} className="space-y-4">
                <div><label className="text-[10px] font-bold text-slate-400 block mb-1">NAMA PASARAN</label>
                <input required type="text" value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none" /></div>
                <div className="grid grid-cols-2 gap-4">
                   <div><label className="text-[10px] font-bold text-slate-400 block mb-1">JAM TUTUP</label><input type="text" value={form.tutup} onChange={(e)=>setForm({...form, tutup: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none" /></div>
                   <div><label className="text-[10px] font-bold text-slate-400 block mb-1">JAM RESULT</label><input type="text" value={form.result} onChange={(e)=>setForm({...form, result: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                   {['p1','p2','p3'].map(k => <div key={k}><label className="text-[10px] block text-slate-400 uppercase">{k}</label><input type="text" value={(form as any)[k]} onChange={(e)=>setForm({...form, [k]: e.target.value})} className="w-full bg-black border border-[#ccff00]/40 rounded-xl p-2 text-[#ccff00] text-center font-black" /></div>)}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 text-slate-400 font-bold text-xs uppercase">BATAL</button>
                   <button className="bg-[#ccff00] text-black font-black px-6 py-2 rounded-xl text-xs shadow-lg uppercase">SIMPAN PASARAN</button>
                </div>
             </form>
          </div>
        </div>
      )}

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

      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e1b] border-2 border-[#ccff00]/70 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
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
             <textarea readOnly value={popupText} rows={6} className="w-full bg-black border border-slate-800 p-3 rounded-xl text-xs text-cyan-300 font-mono" />
             <div className="flex justify-end gap-3 pt-2">
                <button onClick={()=>{ navigator.clipboard.writeText(popupText); addToast('Rekapan disalin!','success'); setIsCopied(true); setTimeout(()=>setIsCopied(false),2000); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase ${isCopied ? 'bg-emerald-500 text-slate-950' : 'bg-[#ccff00] text-slate-950 shadow-lg'}`}>
                   {isCopied ? <><Check className="w-4 h-4" /> TERSALIN!</> : <><Copy className="w-4 h-4" /> SALIN REKAPAN</>}
                </button>
             </div>
          </div>
        </div>
      )}

      {showAlarmConfigModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-5">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 text-[#ccff00]">
                 <h3 className="font-black uppercase flex items-center gap-2"><AlarmClock className="w-5 h-5" /> ALARM SETTINGS</h3>
                 <button onClick={()=>setShowAlarmConfigModal(false)}><X /></button>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-slate-800">
                 <span className="text-xs font-bold text-white uppercase">AKTIFKAN POPUP ALARM</span>
                 <input type="checkbox" checked={isAlarmEnabled} onChange={(e)=>setIsAlarmEnabled(e.target.checked)} className="w-5 h-5 accent-[#ccff00]" />
              </div>
              <button onClick={()=>{ triggerAlarm({pasaranName:'UJI COBA ALARM', jamTutup:'00:00', jamResult:'00:00', session:'SORE'}); }} className="w-full bg-[#ccff00] text-black font-black py-3 rounded-xl text-xs uppercase shadow-lg">TEST POPUP ALARM</button>
           </div>
        </div>
      )}
    </div>
  );
};
