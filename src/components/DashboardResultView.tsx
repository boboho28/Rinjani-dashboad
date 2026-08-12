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

// --- SUB-COMPONENT UNTUK TOMBOL TRUCK (CSS ANIMATION VERSION - NO BUILD ERROR) ---
const TruckStatusButton: React.FC<{ label: string; isDone: boolean }> = ({ label, isDone }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDone, setShowDone] = useState(isDone);

  useEffect(() => {
    if (isDone && !showDone) {
      setIsAnimating(true);
      // Durasi total animasi disesuaikan dengan CSS (3 detik)
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowDone(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (!isDone) {
      setShowDone(false);
      setIsAnimating(false);
    }
  }, [isDone, showDone]);

  // Warna dinamis
  const getColors = () => {
    if (label.includes('LIBUR')) return { bg: '#d97706', base: '#92400e' };
    if (label.includes('TUTUP')) return { bg: '#06b6d4', base: '#0e7490' };
    if (showDone) return { bg: '#ccff00', base: '#84cc16' };
    return { bg: '#20D8F9', base: '#0D6E9D' };
  };

  const theme = getColors();

  return (
    <div className="flex justify-center">
      <button 
        className={`dl-button ${isAnimating ? 'animating' : ''} ${showDone ? 'done' : ''}`}
        style={{ 
          '--c-background': theme.bg, 
          '--c-base': theme.base,
          '--c-color': showDone ? '#000' : '#000',
          transform: 'scale(0.55)', 
          margin: '-12px 0' 
        } as any}
      >
        <span className="default">{label}</span>
        <span className="success">
          DONE
          <svg viewBox="0 0 12 10">
            <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
          </svg>
        </span>
        <div className="truck-wrapper">
          <div className="truck">
            <div className="wheel"></div>
            <div className="back">
              <div className="shadow"></div>
              <div className="logo">
                <svg width="40" height="45" viewBox="0 0 40 45" fill="none">
                  <path d="M21.8383 5.61481C20.7936 4.64191 19.1997 4.6419 18.155 5.61481L14.178 9.31858C13.6251 9.83349 13.6251 10.7252 14.178 11.2401L18.155 14.9439C19.1997 15.9168 20.7936 15.9168 21.8383 14.9439L25.8153 11.2402C26.3682 10.7252 26.3682 9.8335 25.8153 9.31858L21.8383 5.61481Z" fill="#20D8F9"/>
                  <path d="M15.5918 8.0018L18.1549 10.3888C19.1996 11.3617 20.7935 11.3617 21.8382 10.3888L24.4013 8.0018L21.8382 5.61481C20.7935 4.64191 19.1996 4.6419 18.1549 5.61481L15.5918 8.0018Z" fill="white"/>
                  <path d="M21.8383 1.15366C20.7936 0.180755 19.1997 0.180753 18.155 1.15366L14.178 4.85742C13.6251 5.37234 13.6251 6.26408 14.178 6.779L18.155 10.4828C19.1997 11.4557 20.7936 11.4557 21.8383 10.4828L25.8153 6.779C26.3682 6.26408 26.3682 5.37234 25.8153 4.85743L21.8383 1.15366Z" fill="white"/>
                </svg>
              </div>
              <div className="box"></div>
            </div>
            <div className="front"></div>
            <div className="light"></div>
          </div>
        </div>
      </button>
    </div>
  );
};

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
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- ALARM SYSTEM ---
  const [activeAlarm, setActiveAlarm] = useState<AlarmItem | null>(null);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState<boolean>(true);
  const [showAlarmConfigModal, setShowAlarmConfigModal] = useState<boolean>(false);
  const triggeredAlarmsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<any>(null);
  const alarmIntervalRef = useRef<any>(null);

  const stopAlarmSound = () => {
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} }
    audioCtxRef.current = null; alarmIntervalRef.current = null;
  };

  const startAlarmSound = () => {
    if (isMuted) return;
    stopAlarmSound();
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass(); audioCtxRef.current = ctx;
      const playBeep = () => {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.35);
      };
      playBeep(); alarmIntervalRef.current = setInterval(playBeep, 700);
    } catch (err) {}
  };

  const handleDismissAlarm = () => { stopAlarmSound(); setActiveAlarm(null); };
  const triggerAlarm = (data: AlarmItem) => { setActiveAlarm(data); if (!isMuted) startAlarmSound(); };

  useEffect(() => {
    if (!isAlarmEnabled) return;
    const now = currentTime;
    const nowTotalSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const todayDateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    pasaranList.forEach((item) => {
      if (item.status === 'BELUM' && (!item.p1Prize || item.p1Prize === '-')) {
        const match = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const tTotal = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60;
          if (tTotal - nowTotalSecs <= 0 && tTotal - nowTotalSecs >= -3) {
            const key = `${item.id}-${todayDateStr}-${item.jamTutup}`;
            if (!triggeredAlarmsRef.current.has(key)) {
              triggeredAlarmsRef.current.add(key);
              triggerAlarm({ pasaranName: item.name, jamTutup: item.jamTutup, jamResult: item.jamResult, p1Prize: item.p1Prize, session: item.session, title: `RESULT ${item.name} ${item.jamTutup}` });
            }
          }
        }
      }
    });
  }, [currentTime, pasaranList, isAlarmEnabled]);

  // --- TERMINAL ---
  const [resultStatusInput, setResultStatusInput] = useState('');
  const [p1TerminalInput, setP1TerminalInput] = useState('');
  const [p123TerminalInput, setP123TerminalInput] = useState('');
  const [isResultPopupOpen, setIsResultPopupOpen] = useState(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const calculateShio = (p1?: string) => {
    if (!p1 || p1 === '-') return { name: '-', emoji: '❓' };
    const clean = p1.replace(/\D/g, ''); if (clean.length < 2) return { name: '-', emoji: '❓' };
    const last2 = clean.slice(-2); if (last2 === '00') return { name: 'KELINCI', emoji: '🐇' };
    const mod = parseInt(last2) % 12;
    const shios:any = {1:'KUDA',2:'ULAR',3:'NAGA',4:'KELINCI',5:'HARIMAU',6:'KERBAU',7:'TIKUS',8:'BABI',9:'ANJING',10:'AYAM',11:'MONYET',0:'KAMBING'};
    const emojis:any = {1:'🐎',2:'🐍',3:'🐉',4:'🐇',5:'🐅',6:'🐂',7:'🐀',8:'🐖',9:'🐕',10:'🐓',11:'🐒',0:'🐐'};
    return { name: shios[mod], emoji: emojis[mod] };
  };

  const handleOpenResultPopup = (item: PasaranItem) => {
    setPopupPasaran(item);
    const shio = calculateShio(item.p1Prize);
    const now = new Date();
    const txt = `Hasil Pengeluaran ${item.name}\nHari Ini ${new Intl.DateTimeFormat('id-ID', {weekday:'long', day:'2-digit', month:'long', year:'numeric'}).format(now)}\nResult : ${item.p1Prize || '-'}\nSHIO : ${shio.name}\nSelamat Kepada Pemenang, Salam JP Hanya di TogelUP`;
    setPopupText(txt); setIsCopied(false); setIsResultPopupOpen(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PasaranItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formSession, setFormSession] = useState<'PAGI'|'SORE'|'MALAM'|'DINI HARI'>('SORE');
  const [formJamTutup, setFormJamTutup] = useState('15:00 WIB');
  const [formJamResult, setFormJamResult] = useState('16:15 WIB');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formP1Prize, setFormP1Prize] = useState('-');
  const [formP2Prize, setFormP2Prize] = useState('-');
  const [formP3Prize, setFormP3Prize] = useState('-');
  const [formStatus, setFormStatus] = useState<'BELUM'|'DONE'|'LIBUR'>('BELUM');

  const filtered = pasaranList.filter(i => selectedSession === 'ALL PASARAN' || i.session === selectedSession);
  const sorted = [...filtered].sort((a,b) => {
    const p = (s:string) => { const m=s.match(/(\d+):(\d+)/); return m ? parseInt(m[1])*60+parseInt(m[2]) : 0; };
    return p(a.jamTutup) - p(b.jamTutup);
  });

  const handleSave = (e:React.FormEvent) => {
    e.preventDefault();
    const d = { name: formName.toUpperCase(), session: formSession, jamTutup: formJamTutup, jamResult: formJamResult, linkUrl: formLinkUrl, p1Prize: formP1Prize, p2Prize: formP2Prize, p3Prize: formP3Prize, status: formStatus, isResultNow: false };
    if (editItem) { setPasaranList(prev => prev.map(p => p.id === editItem.id ? {...p, ...d} : p)); addToast(`${formName} Updated`,'success'); }
    else { setPasaranList(prev => [{id:`p-${Date.now()}`, ...d}, ...prev]); addToast(`${formName} Added`,'success'); }
    setIsModalOpen(false);
  };

  const findTarget = (input:string) => pasaranList.find(p => input.includes(p.name.toUpperCase())) || pasaranList[0];

  const handleP1Terminal = (e:React.FormEvent) => {
    e.preventDefault(); const m = findTarget(p1TerminalInput.toUpperCase());
    const nums = p1TerminalInput.replace(m.name,'').match(/\d+/);
    if (nums) { setPasaranList(prev => prev.map(p => p.id === m.id ? {...p, p1Prize: nums[0]} : p)); setP1TerminalInput(''); addToast(`P1 Updated`,'success'); }
  };

  const handleP123Terminal = (e:React.FormEvent) => {
    e.preventDefault(); const m = findTarget(p123TerminalInput.toUpperCase());
    const nums = p123TerminalInput.replace(m.name,'').match(/\d+/g);
    if (nums) { setPasaranList(prev => prev.map(p => p.id === m.id ? {...p, p1Prize: nums[0]||'-', p2Prize: nums[1]||'-', p3Prize: nums[2]||'-'} : p)); setP123TerminalInput(''); addToast(`P123 Updated`,'success'); }
  };

  const getResultLabel = (item: PasaranItem) => {
    if (item.status === 'DONE') return 'SUDAH RESULT';
    if (item.status === 'LIBUR') return 'PASARAN LIBUR';
    const match = item.jamTutup.match(/(\d+):(\d+)/);
    if (!match) return 'BELUM RESULT';
    const diff = (parseInt(match[1])*3600 + parseInt(match[2])*60) - (currentTime.getHours()*3600 + currentTime.getMinutes()*60 + currentTime.getSeconds());
    if (diff <= 0) return 'RESULT NOW!';
    return `TUTUP: ${Math.floor(diff/60)}:${String(diff%60).padStart(2,'0')}`;
  };

  return (
    <div className="space-y-5 font-sans text-slate-100">
      <style>{`
        /* TRUCK BUTTON CSS - PURE ANIMATION */
        .dl-button {
          --rotate: 0deg; --y: 0px; --scale: 1; --default-o: 1; --success-o: 0; --success-offset: 16px;
          --truck-y: 0px; --truck-base-x: -186px; --truck-wrapper-y: 70px; --light-opacity: 1;
          --box-x: 0px; --box-y: 0px; --box-r: 0deg;
          padding: 15px 0; width: 260px; border-radius: 27px; cursor: pointer; text-align: center;
          position: relative; border: none; outline: none; background: var(--c-background);
          color: #000; transform-style: preserve-3d;
          transform: translateY(var(--y)) rotateX(var(--rotate)) scale(var(--scale)) translateZ(0);
          transition: transform 0.2s, background 0.3s;
        }
        .dl-button:active { transform: translateY(var(--y)) rotateX(var(--rotate)) scale(0.97) translateZ(0); }
        .dl-button:before {
          content: ''; position: absolute; left: 0; width: 100%; background: var(--c-background);
          height: 4px; border-radius: 2px; top: 50%; margin-top: -2px; transform-origin: 0 100%; transform: rotateX(90deg);
        }
        .dl-button .default, .dl-button .success {
          display: block; font-weight: bold; font-size: 22px; line-height: 24px; opacity: var(--default-o);
        }
        .dl-button .success {
          position: absolute; top: 15px; left: 0; right: 0; opacity: var(--success-o);
        }
        .dl-button .success svg {
          width: 16px; height: 14px; display: inline-block; fill: none; margin: 5px 0 0 8px;
          stroke: #000; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 16px; stroke-dashoffset: var(--success-offset);
        }
        .dl-button .truck-wrapper {
          position: absolute; top: -140px; left: -20px; right: -40px; bottom: 0; overflow: hidden;
          transform: translateY(var(--truck-wrapper-y)) rotateX(90deg);
          mask-image: linear-gradient(to right, transparent 0%, black 60px, black);
        }
        .dl-button .truck {
          position: absolute; top: 24px; left: 70px; width: 72px; height: 60px;
          transform: translate3d(var(--truck-base-x), var(--truck-y), 0);
        }
        .dl-button .truck:before, .dl-button .truck:after {
          content: ''; position: absolute; bottom: -9px; left: var(--l, 25px); width: 16px; height: 16px;
          border-radius: 50%; box-shadow: inset 0 0 0 3px var(--c-base), inset 0 0 0 6px #004e71;
          background: #fff; transform: translateY(calc(var(--truck-y) * -1));
        }
        .dl-button .truck:after { --l: 85px; }
        .dl-button .wheel, .dl-button .wheel:before { position: absolute; bottom: -9px; left: 6px; width: 16px; height: 16px; border-radius: 50%; background: var(--c-base); }
        .dl-button .wheel:before { content: ''; left: 60px; bottom: 0; }
        .dl-button .back { left: 0; bottom: 0; position: absolute; width: 75px; height: 45px; background: #2790C3; border-radius: 3px 3px 0 0; }
        .dl-button .back:before { content: ''; position: absolute; left: 17px; top: 0; right: 0; bottom: 0; background: #F2F6FE; }
        .dl-button .back:after { content: ''; position: absolute; width: 116px; height: 4px; left: -2px; bottom: -4px; background: var(--c-base); }
        .dl-button .box { position: absolute; width: 17px; height: 17px; right: 54px; bottom: 0; background: #DCB97A; transform: translate(var(--box-x), var(--box-y)) rotate(var(--box-r)); }
        .dl-button .logo { position: absolute; left: 37px; top: 10px; width: 21px; height: 22px; background: #000; border-radius: 6px; }
        .dl-button .logo svg { position: absolute; scale: 0.5; left: -9px; top: 3px; }
        .dl-button .front { position: absolute; left: 75px; bottom: 0; height: 33px; width: 37px; background: #F2F6FE; clip-path: polygon(55% 0, 72% 44%, 100% 58%, 100% 100%, 0 100%, 0 0); }
        .dl-button .light { position: absolute; right: -41px; bottom: 3px; width: 4px; height: 3px; background: #FCBB33; }

        /* ANIMATION KEYFRAMES */
        .dl-button.animating { animation: tilt 0.3s forwards; }
        @keyframes tilt { 100% { --rotate: -90deg; --y: 25px; --default-o: 0; } }

        .dl-button.animating .truck { animation: drive 2.5s forwards 0.3s; }
        @keyframes drive {
          0% { --truck-base-x: -186px; }
          20% { --truck-base-x: -4px; }
          35% { --truck-base-x: 0px; }
          50% { --truck-base-x: 60px; --box-x: -60px; --box-y: 10px; --box-r: -8deg; }
          65% { --truck-base-x: 56px; --box-x: -56px; --box-y: 0px; --box-r: 0deg; }
          100% { --truck-base-x: 300px; --box-x: -300px; --light-opacity: 0; }
        }

        .dl-button.done { --rotate: 0deg; --y: 0px; --default-o: 0; --success-o: 1; --success-offset: 0px; }

        /* NEON GLOW FOR P1 P2 P3 */
        .neon-glow {
          font-family: monospace; font-weight: 900; font-style: italic; letter-spacing: 0.1em; font-size: 16px; color: #fff;
          text-shadow: 1.5px 1.5px 0 #9333ea, 3px 3px 0 #4c1d95, 0 0 18px #22d3ee;
        }

        .digital-clock-container {
          width: fit-content; background: #000; padding: 0 10px; font-size: 24px; font-family: 'Courier New', monospace;
          color: #fff; font-weight: bold; border-radius: 8px; border: 1px solid #333; line-height: 1.2;
        }
        .digital-clock-container::before { content: attr(data-time); animation: blink .5s infinite; }
        @keyframes blink { 50% { opacity: 0.5; } }
      `}</style>
      
      {/* HEADER */}
      <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 sticky top-[102px] z-30">
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedSession} onChange={(e)=>setSelectedSession(e.target.value)} className="bg-[#151128] border-2 border-[#ccff00]/60 rounded-xl px-3 py-1.5 text-[#ccff00] font-bold outline-none uppercase">
            <option value="SORE">SESI SORE</option><option value="PAGI">SESI PAGI</option><option value="MALAM">SESI MALAM</option><option value="ALL PASARAN">ALL PASARAN</option>
          </select>
          <button onClick={()=>setIsMuted(!isMuted)} className="p-2 bg-[#181a2c] border-2 border-[#ccff00]/50 text-[#ccff00] rounded-xl">{isMuted ? <VolumeX/> : <Volume2/>}</button>
          <button onClick={()=>setShowAlarmConfigModal(true)} className="bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase"><Bell size={16} className="inline mr-1"/> ALARM</button>
          <button onClick={handleOpenAddModal} className="bg-[#ccff00] text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase"><Plus size={16} className="inline mr-1"/> ADD</button>
          <button onClick={handleResetSession} className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs uppercase"><RotateCcw size={16} className="inline mr-1"/> RESET</button>
        </div>
        <div className="relative w-full lg:w-[450px] border-2 border-[#ccff00]/80 bg-[#070410] rounded-xl p-3 pt-4 space-y-2">
          <div className="absolute -top-3 left-4 bg-[#ccff00] text-slate-950 font-bold text-[10px] px-2 rounded uppercase">TERMINAL</div>
          <form onSubmit={handleP1Terminal} className="flex gap-2">
            <input placeholder="P1 TERMINAL" value={p1TerminalInput} onChange={(e)=>setP1TerminalInput(e.target.value)} className="bg-[#04020a] text-[#ccff00] text-xs flex-1 px-3 py-2 rounded-lg border border-[#ccff00]/40 outline-none"/>
            <button type="submit" className="bg-[#ccff00] text-slate-950 font-bold text-xs px-4 rounded-lg">P1</button>
          </form>
          <form onSubmit={handleP123Terminal} className="flex gap-2">
            <textarea placeholder="P123 TERMINAL" value={p123TerminalInput} onChange={(e)=>setP123TerminalInput(e.target.value)} className="bg-[#04020a] text-[#ccff00] text-xs flex-1 p-2 rounded-lg border border-[#ccff00]/40 h-12 resize-none outline-none"/>
            <button type="submit" className="bg-[#ccff00] text-slate-950 font-bold text-xs px-3 rounded-lg">P123</button>
          </form>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#080b14] border border-[#ccff00]/30 rounded-2xl p-4 overflow-x-auto max-h-[calc(100vh-320px)] custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 bg-[#0d1222] z-10">
            <tr className="border-b-2 border-[#ccff00]/40 text-[11px] uppercase text-[#ccff00] tracking-wider">
              <th className="py-3 px-3">SESH</th><th className="py-3 px-3">PASARAN</th><th className="py-3 px-3 text-center">TUTUP</th>
              <th className="py-3 px-3 text-center">RESULT</th><th className="py-3 px-3 text-center">LINK</th>
              <th className="py-3 px-3 text-center">RESULT STATUS</th><th className="py-3 px-3 text-center">P1</th>
              <th className="py-3 px-3 text-center">P2</th><th className="py-3 px-3 text-center">P3</th>
              <th className="py-3 px-3 text-center">STATUS</th><th className="py-3 px-3 text-right">OPSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ccff00]/10 text-xs">
            {sorted.map((item) => (
              <tr key={item.id} className={`hover:bg-[#ccff00]/5 transition-all ${item.status==='DONE'?'bg-[#ccff00]/10 border-l-4 border-l-[#ccff00]':''}`}>
                <td className="py-3 px-3 uppercase font-black italic text-purple-400">{item.session}</td>
                <td className="py-3 px-3 font-bold uppercase text-[#22d3ee]">{item.name}</td>
                <td className="py-3 px-3 text-center"><div className="digital-clock-container" data-time={item.jamTutup.replace(' WIB', '')}/></td>
                <td className="py-3 px-3 text-center"><div className="digital-clock-container" data-time={item.jamResult.replace(' WIB', '')}/></td>
                <td className="py-3 px-3 text-center"><button onClick={()=>window.open(item.linkUrl,'_blank')} className="p-1 hover:text-[#ccff00]"><ExternalLink size={16}/></button></td>
                
                {/* TRUCK RESULT STATUS */}
                <td className="py-3 px-3 text-center">
                  <TruckStatusButton label={getResultLabel(item)} isDone={item.status === 'DONE'} />
                </td>

                {/* P1 P2 P3 NEON GLOW */}
                <td className="py-3 px-3 text-center"><span className="neon-glow">{item.p1Prize || '-'}</span></td>
                <td className="py-3 px-3 text-center"><span className="neon-glow">{item.p2Prize || '-'}</span></td>
                <td className="py-3 px-3 text-center"><span className="neon-glow">{item.p3Prize || '-'}</span></td>

                {/* TRUCK STATUS */}
                <td className="py-3 px-3 text-center">
                  <TruckStatusButton label={item.status} isDone={item.status === 'DONE'} />
                </td>

                <td className="py-3 px-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={()=>handleOpenResultPopup(item)} className="p-1.5 border border-[#ccff00]/40 rounded text-[#ccff00]"><Percent size={14}/></button>
                    <button onClick={()=>handleOpenEditModal(item)} className="p-1.5 border border-[#ccff00]/40 rounded text-[#ccff00]"><Edit2 size={14}/></button>
                    <button onClick={()=>handleDeletePasaran(item.id, item.name)} className="p-1.5 border border-rose-500/40 rounded text-rose-400"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1222] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-lg p-5 space-y-4">
            <h3 className="text-lg font-bold text-[#ccff00] uppercase">{editItem ? 'EDIT' : 'ADD'} PASARAN</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <input placeholder="NAMA" value={formName} onChange={(e)=>setFormName(e.target.value)} className="w-full bg-[#141b2d] border border-slate-700 rounded-lg p-2 text-[#ccff00] outline-none"/>
              <div className="grid grid-cols-2 gap-2">
                <select value={formSession} onChange={(e)=>setFormSession(e.target.value as any)} className="bg-[#141b2d] border border-slate-700 p-2 rounded-lg"><option value="SORE">SORE</option><option value="PAGI">PAGI</option><option value="MALAM">MALAM</option></select>
                <select value={formStatus} onChange={(e)=>setFormStatus(e.target.value as any)} className="bg-[#141b2d] border border-slate-700 p-2 rounded-lg"><option value="BELUM">BELUM</option><option value="DONE">DONE</option><option value="LIBUR">LIBUR</option></select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="P1" value={formP1Prize} onChange={(e)=>setFormP1Prize(e.target.value)} className="bg-[#141b2d] border border-slate-700 p-2 text-center rounded-lg"/>
                <input placeholder="P2" value={formP2Prize} onChange={(e)=>setFormP2Prize(e.target.value)} className="bg-[#141b2d] border border-slate-700 p-2 text-center rounded-lg"/>
                <input placeholder="P3" value={formP3Prize} onChange={(e)=>setFormP3Prize(e.target.value)} className="bg-[#141b2d] border border-slate-700 p-2 text-center rounded-lg"/>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-[#ccff00] text-slate-950 font-bold rounded-lg uppercase">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeAlarm && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-[#141a0d] to-[#05060a] border-2 border-[#ccff00] rounded-3xl p-10 text-center space-y-6 shadow-2xl">
            <h2 className="text-4xl font-black text-white uppercase">{activeAlarm.title}</h2>
            <div className="text-2xl font-black text-[#ccff00]">JAM RESULT {activeAlarm.jamResult}</div>
            <button onClick={handleDismissAlarm} className="bg-[#ccff00] text-slate-950 text-xl font-bold px-12 py-3 rounded-2xl uppercase">TUTUP</button>
          </div>
        </div>
      )}

      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0b0e1b] border-2 border-[#ccff00]/70 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#ccff00] uppercase">{popupPasaran.name}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#12162a] p-3 rounded-xl"><div className="text-[10px] text-slate-400">RESULT</div><div className="text-2xl font-black text-[#ccff00]">{popupPasaran.p1Prize}</div></div>
              <div className="bg-[#12162a] p-3 rounded-xl"><div className="text-[10px] text-slate-400">SHIO</div><div className="text-xl font-bold">{calculateShio(popupPasaran.p1Prize).emoji} {calculateShio(popupPasaran.p1Prize).name}</div></div>
            </div>
            <textarea value={popupText} readOnly rows={6} className="w-full bg-black border border-slate-800 p-3 text-[#ccff00] text-xs font-mono outline-none rounded-xl"/>
            <button onClick={()=>{navigator.clipboard.writeText(popupText); setIsCopied(true); setTimeout(()=>setIsCopied(false),2000);}} className="w-full bg-[#ccff00] text-slate-950 font-bold py-3 rounded-xl uppercase">
              {isCopied ? 'Tersalin!' : 'Salin Rekapan'}
            </button>
            <button onClick={()=>setIsResultPopupOpen(false)} className="w-full text-slate-500 text-xs">Tutup</button>
          </div>
        </div>
      )}

    </div>
  );
};
