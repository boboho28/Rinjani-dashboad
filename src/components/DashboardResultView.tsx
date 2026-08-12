import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
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

// --- SUB-COMPONENT UNTUK TOMBOL TRUCK ---
const TruckStatusButton: React.FC<{ label: string; isDone: boolean; type: 'RESULT' | 'STATUS' }> = ({ label, isDone, type }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    if (isDone && !button.classList.contains('done')) {
      const { to } = gsap;
      button.classList.add('animating');

      to(button, {
        '--rotate': '-90deg',
        '--y': '25px',
        '--default-o': 0,
        duration: 0.2
      });

      to(button, {
        keyframes: [{
          '--truck-base-x': '-4px',
          duration: 0.5
        }, {
          '--truck-base-x': '0px',
          duration: 0.2
        }, {
          '--truck-base-x': '60px',
          '--box-x': '-60px',
          duration: 0.5,
          onStart() {
            setTimeout(() => {
              to(button, {
                keyframes: [{
                  '--box-y': '10px',
                  '--box-r': '-8deg',
                  duration: 0.2
                }, {
                  '--box-r': '0deg',
                  duration: 0.2
                }]
              });
            }, 200);
          }
        }, {
          '--truck-base-x': '56px',
          '--box-x': '-56px',
          duration: 0.4
        }, {
          '--light-opacity': 0,
          duration: 0.3,
          delay: 0.2
        }],
        onComplete() {
          setTimeout(() => {
            button.classList.add('done');
            button.classList.remove('animating');
            to(button, {
              keyframes: [{
                '--rotate': '0deg',
                '--y': '0px',
                duration: 0.2
              }, {
                '--success-offset': '0px',
                '--success-o': 1,
                duration: 0.2
              }]
            });
          }, 500);
        }
      });
    } else if (!isDone) {
      button.classList.remove('done', 'animating');
      gsap.set(button, {
        '--rotate': '0deg',
        '--y': '0px',
        '--default-o': 1,
        '--success-o': 0,
        '--truck-base-x': '-186px',
        '--success-offset': '16px',
        '--light-opacity': 1
      });
    }
  }, [isDone]);

  // Warna dinamis berdasarkan tipe dan status
  const getThemeColors = () => {
    if (label.includes('LIBUR')) return { bg: '#d97706', base: '#92400e' };
    if (isDone) return { bg: '#ccff00', base: '#84cc16' };
    if (label.includes('TUTUP')) return { bg: '#06b6d4', base: '#0e7490' };
    return { bg: '#20D8F9', base: '#0D6E9D' };
  };

  const theme = getThemeColors();

  return (
    <button 
      ref={buttonRef} 
      className={`dl-button ${isDone ? 'done' : ''}`}
      style={{ 
        '--c-background': theme.bg, 
        '--c-base': theme.base,
        transform: 'scale(0.55)', // Mengecilkan agar pas di tabel
        margin: '-15px 0' // Kompensasi scale
      } as any}
    >
      <span className="default">{label}</span>
      <span className="success">
        {type === 'RESULT' ? 'CONFIRMED' : 'DONE'}
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
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
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

  const [resultStatusInput, setResultStatusInput] = useState<string>('');
  const [p1TerminalInput, setP1TerminalInput] = useState<string>('');
  const [p123TerminalInput, setP123TerminalInput] = useState<string>('');
  const [isResultPopupOpen, setIsResultPopupOpen] = useState<boolean>(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const calculateShio = (p1Prize?: string) => {
    if (!p1Prize || p1Prize === '-') return { name: '-', emoji: '❓' };
    const clean = p1Prize.replace(/\D/g, '');
    if (clean.length < 2) return { name: '-', emoji: '❓' };
    const last2 = clean.slice(-2);
    if (last2 === '00') return { name: 'KELINCI', emoji: '🐇' };
    const mod = parseInt(last2, 10) % 12;
    const shioMap: any = { 1:'KUDA', 2:'ULAR', 3:'NAGA', 4:'KELINCI', 5:'HARIMAU', 6:'KERBAU', 7:'TIKUS', 8:'BABI', 9:'ANJING', 10:'AYAM', 11:'MONYET', 0:'KAMBING' };
    const emojiMap: any = { 1:'🐎', 2:'🐍', 3:'🐉', 4:'🐇', 5:'🐅', 6:'🐂', 7:'🐀', 8:'🐖', 9:'🐕', 10:'🐓', 11:'🐒', 0:'🐐' };
    return { name: shioMap[mod] || '-', emoji: emojiMap[mod] || '❓' };
  };

  const handleOpenResultPopup = (item: PasaranItem) => {
    setPopupPasaran(item);
    const hasResult = item.p1Prize && item.p1Prize !== '-';
    const resultStr = hasResult ? item.p1Prize! : '-';
    const shioObj = calculateShio(resultStr);
    const now = new Date();
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const text = `Hasil Pengeluaran ${item.name}\nHari Ini ${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')} ${months[now.getMonth()]} ${now.getFullYear()}\nResult : ${resultStr}\nSHIO : ${hasResult ? shioObj.name : '-'}\nSelamat Kepada Pemenang, Salam JP Hanya di TogelUP`;
    setPopupText(text);
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

  const filteredList = pasaranList.filter(item => selectedSession === 'ALL PASARAN' || selectedSession === 'SEMUA' ? true : item.session === selectedSession);
  const sortedFilteredList = [...filteredList].sort((a, b) => {
    const parse = (s: string) => { const m = s.match(/(\d+):(\d+)/); return m ? parseInt(m[1])*60 + parseInt(m[2]) : 0; };
    return parse(a.jamTutup) - parse(b.jamTutup);
  });

  const handleOpenAddModal = () => {
    setEditItem(null); setFormName(''); setFormSession('SORE'); setFormJamTutup('18:00 WIB'); setFormJamResult('18:30 WIB');
    setFormLinkUrl(''); setFormP1Prize('-'); setFormP2Prize('-'); setFormP3Prize('-'); setFormStatus('BELUM'); setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PasaranItem) => {
    setEditItem(item); setFormName(item.name); setFormSession(item.session); setFormJamTutup(item.jamTutup); setFormJamResult(item.jamResult);
    setFormLinkUrl(item.linkUrl || ''); setFormP1Prize(item.p1Prize || '-'); setFormP2Prize(item.p2Prize || '-'); setFormP3Prize(item.p3Prize || '-');
    setFormStatus(item.status); setIsModalOpen(true);
  };

  const handleSavePasaran = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: formName.toUpperCase(), session: formSession, jamTutup: formJamTutup, jamResult: formJamResult, linkUrl: formLinkUrl, p1Prize: formP1Prize, p2Prize: formP2Prize, p3Prize: formP3Prize, status: formStatus, isResultNow: false };
    if (editItem) {
      setPasaranList(prev => prev.map(p => p.id === editItem.id ? { ...p, ...data } : p));
      addToast(`Pasaran ${formName} diperbarui.`, 'success');
    } else {
      setPasaranList(prev => [{ id: `p-${Date.now()}`, ...data }, ...prev]);
      addToast(`Pasaran ${formName} ditambahkan.`, 'success');
    }
    setIsModalOpen(false);
  };

  const handleDeletePasaran = (id: string, name: string) => { setPasaranList(prev => prev.filter(p => p.id !== id)); addToast(`Pasaran ${name} dihapus.`, 'info'); };

  const handleResetSession = () => {
    setPasaranList(prev => prev.map(item => (selectedSession === 'ALL PASARAN' || item.session === selectedSession) ? { ...item, p1Prize: '-', p2Prize: '-', p3Prize: '-', status: 'BELUM' as any } : item));
    addToast(`🔄 Sesi ${selectedSession} di-reset!`, 'success');
  };

  const findTargetPasaran = (inputStr: string) => {
    const sorted = [...pasaranList].sort((a, b) => b.name.length - a.name.length);
    return sorted.find(p => inputStr.includes(p.name.toUpperCase())) || pasaranList[0];
  };

  const handleProcessP1Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = findTargetPasaran(p1TerminalInput.toUpperCase());
    if (!matched) return;
    const num = p1TerminalInput.replace(matched.name, '').match(/\d+/);
    if (num) {
      setPasaranList(prev => prev.map(p => p.id === matched.id ? { ...p, p1Prize: num[0] } : p));
      addToast(`✅ P1 ${matched.name}: ${num[0]}`, 'success');
      setP1TerminalInput('');
    }
  };

  const handleProcessP123Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = findTargetPasaran(p123TerminalInput.toUpperCase());
    if (!matched) return;
    const nums = p123TerminalInput.replace(matched.name, '').match(/\d+/g);
    if (nums) {
      setPasaranList(prev => prev.map(p => p.id === matched.id ? { ...p, p1Prize: nums[0]||'-', p2Prize: nums[1]||'-', p3Prize: nums[2]||'-' } : p));
      addToast(`✅ P123 ${matched.name} Updated`, 'success');
      setP123TerminalInput('');
    }
  };

  // --- LOGIKA HELPER UNTUK LABEL ---
  const getResultStatusLabel = (item: PasaranItem) => {
    if (item.status === 'DONE') return 'SUDAH RESULT';
    if (item.status === 'LIBUR') return 'PASARAN LIBUR';
    const match = item.jamTutup.match(/(\d+):(\d+)/);
    if (!match) return 'BELUM RESULT';
    const tutupSecs = parseInt(match[1])*3600 + parseInt(match[2])*60;
    const nowSecs = currentTime.getHours()*3600 + currentTime.getMinutes()*60 + currentTime.getSeconds();
    const diff = tutupSecs - nowSecs;
    if (diff <= 0) return 'RESULT NOW!';
    const h = Math.floor(diff/3600), m = Math.floor((diff%3600)/60), s = diff%60;
    return `TUTUP: ${h > 0 ? h+':' : ''}${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  return (
    <div className="space-y-5 font-sans text-slate-100">
      
      <style>{`
        /* TRUCK BUTTON CSS */
        .dl-button {
            --c-color: #000;
            --c-background: #20D8F9;
            --c-light: #FCBB33;
            --c-light-shine: linear-gradient(90deg, rgba(252, 187, 51, 0.9), rgba(252, 187, 51, 0));
            --c-base: #0D6E9D;
            --c-wheel: #0D6E9D;
            --c-wheel-inner: #004e71;
            --c-wheel-dot: #fff;
            --c-back: #F2F6FE;
            --c-back-logo-background: #000;
            --c-back-inner: #2790C3;
            --c-front: #F2F6FE;
            --c-front-shadow: #CDD1D9;
            --c-window: #000;
            --c-box: #DCB97A;
            --rotate: 0deg; --y: 0px; --scale: 1; --default-o: 1; --success-o: 0; --success-offset: 16px;
            --truck-y: 0px; --truck-base-x: -186px; --truck-wrapper-y: 70px; --light-opacity: 1;
            --box-x: 0px; --box-y: 0px; --box-r: 0deg;
            padding: 15px 0; width: 260px; border-radius: 27px; cursor: pointer; text-align: center;
            position: relative; border: none; outline: none; background: var(--c-background);
            color: var(--c-color); transform-style: preserve-3d;
            transform: translateY(var(--y)) rotateX(var(--rotate)) scale(var(--scale)) translateZ(0);
            transition: background 0.3s;
        }
        .dl-button:before {
            content: ''; position: absolute; left: 0; width: 100%; background: var(--c-background);
            height: 4px; border-radius: 2px; top: 50%; margin-top: -2px; transform-origin: 0 100%; transform: rotateX(90deg);
        }
        .dl-button .default, .dl-button .success {
            display: block; font-weight: bold; font-size: 22px; line-height: 24px; opacity: var(--o, var(--default-o));
            font-family: 'Poppins', sans-serif;
        }
        .dl-button .success {
            --o: var(--success-o); position: absolute; top: 15px; left: 0; right: 0;
        }
        .dl-button .success svg {
            width: 16px; height: 14px; display: inline-block; vertical-align: top; fill: none;
            margin: 5px 0 0 8px; stroke: var(--c-color); stroke-width: 2; stroke-linecap: round;
            stroke-linejoin: round; stroke-dasharray: 16px; stroke-dashoffset: var(--success-offset);
        }
        .dl-button .truck-wrapper {
            position: absolute; pointer-events: none; top: -140px; left: -20px; right: -40px; bottom: 0px;
            overflow: hidden; transform: translateY(var(--truck-wrapper-y)) rotateX(90deg);
            mask-image: linear-gradient(to right, transparent 0%, black 60px, black);
        }
        .dl-button .truck {
            position: absolute; top: 24px; left: 70px; width: 72px; height: 60px;
            transform: translate3d(var(--truck-base-x), calc(var(--truck-y)), 0);
        }
        .dl-button .truck:before, .dl-button .truck:after {
            content: ''; position: absolute; bottom: -9px; left: var(--l, 25px); width: 16px; height: 16px;
            border-radius: 50%; z-index: 2; box-shadow: inset 0 0 0 3px var(--c-wheel), inset 0 0 0 6px var(--c-wheel-inner);
            background: var(--c-wheel-dot); transform: translateY(calc(var(--truck-y) * -1)) translateZ(0);
        }
        .dl-button .truck:after { --l: 85px; }
        .dl-button .wheel, .dl-button .wheel:before {
            position: absolute; bottom: var(--b, -9px); left: var(--l, 6px); width: 16px; height: 16px;
            border-radius: 50%; background: var(--c-wheel); transform: translateZ(0);
        }
        .dl-button .wheel { transform: translateY(calc(var(--truck-y) * -1)) translateZ(0); }
        .dl-button .wheel:before { --l: 60px; --b: 0; content: ''; }
        .dl-button .light {
            position: absolute; right: -41px; bottom: 3px; width: 4px; height: 3px; border-radius: 1px 0 0 1px; background: var(--c-light);
        }
        .dl-button .light:before, .dl-button .light:after {
            content: ''; position: absolute; left: 4px; top: -6px; width: 40px; height: 19px;
            background: var(--c-light-shine); opacity: var(--light-opacity); clip-path: polygon(0 6px, 100% 0, 100% 80%, 0 9px);
        }
        .dl-button .light:after { left: -8px; clip-path: polygon(11px 4px, 100% 0, 100% 80%, 11px 11px); }
        .dl-button .back {
            left: 0; bottom: 0; z-index: 1; width: 75px; height: 45px; border-radius: 3px 3px 0 0; background: var(--c-back-inner); position: absolute;
        }
        .dl-button .back:before { content: ''; position: absolute; left: 17px; top: 0; right: 0; bottom: 0; z-index: 4; border-radius: 0 2px 0 0; background: var(--c-back); }
        .dl-button .back:after { content: ''; position: absolute; border-radius: 2px; width: 116px; height: 4px; left: -2px; bottom: -4px; background: var(--c-base); }
        .dl-button .shadow { height: 44px; width: 14px; position: absolute; top: 0; left: 3px; z-index: 3; clip-path: polygon(0 0, 100% 0, 100% 100%); background: rgba(0, 0, 0, .15); }
        .dl-button .box {
            position: absolute; width: 17px; height: 17px; right: 54px; bottom: 0; z-index: 2; border-radius: 1px; background: var(--c-box);
            transform-origin: 0 100%; transform: translate(var(--box-x), var(--box-y)) rotate(var(--box-r));
        }
        .dl-button .logo {
            position: absolute; z-index: 5; left: 37px; top: 10px; width: 21px; height: 22px; border-radius: 6px; background: var(--c-back-logo-background);
        }
        .dl-button .logo svg { position: absolute; left: -9px; top: 3px; transform: scale(0.5); }
        .dl-button .front {
            position: absolute; left: 75px; bottom: 0; height: 33px; width: 37px;
            clip-path: polygon(55% 0, 72% 44%, 100% 58%, 100% 100%, 0 100%, 0 0);
            background: linear-gradient(84deg, var(--c-front-shadow) 0%, var(--c-front-shadow) 10%, var(--c-front) 12%, var(--c-front) 100%);
        }
        .dl-button .front:before { content: ''; position: absolute; width: 11px; height: 12px; left: 11px; top: 3px; clip-path: polygon(0 0, 60% 0%, 100% 100%, 0% 100%); background: var(--c-window); }

        /* JAM DIGITAL STYLING */
        .digital-clock-container {
          width: fit-content; background: #000; padding: 0 10px; font-size: 26px; font-family: 'Courier New', monospace;
          color: #fff; font-weight: bold; border-radius: 8px; position: relative; display: inline-block; line-height: 1.2;
          border: 1px solid #333; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }
        .digital-clock-container::before { content: attr(data-time); white-space: pre; animation: l8 .5s infinite steps(1); }
        @keyframes l8 { 50% { opacity: 0.5; } }
      `}</style>
      
      {/* HEADER NAVIGATION */}
      <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl p-3 sm:p-4 shadow-[0_0_25px_rgba(204,255,0,0.15)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sticky top-[98px] sm:top-[102px] z-30">
        <div className="flex flex-col justify-between items-start self-stretch gap-3 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="flex items-center bg-[#151128] border-2 border-[#ccff00]/60 rounded-2xl px-3 py-1.5 text-[#ccff00] font-bold">
              <select value={selectedSession} onChange={(e)=>setSelectedSession(e.target.value)} className="bg-transparent outline-none cursor-pointer uppercase">
                <option value="SORE">SESI SORE</option><option value="PAGI">SESI PAGI</option><option value="MALAM">SESI MALAM</option><option value="ALL PASARAN">ALL PASARAN</option>
              </select>
            </div>
            <button onClick={()=>setIsMuted(!isMuted)} className="p-2 bg-[#181a2c] border-2 border-[#ccff00]/50 text-[#ccff00] rounded-2xl">
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={()=>setShowAlarmConfigModal(true)} className="bg-rose-600 text-white font-black px-3.5 py-2 rounded-2xl text-xs uppercase"><Bell className="w-4 h-4 inline mr-1"/> ALARM CFG</button>
            <button onClick={handleOpenAddModal} className="bg-[#ccff00] text-slate-950 font-black px-3.5 py-2 rounded-2xl text-xs uppercase"><Plus className="w-4 h-4 inline mr-1"/> ADD PASARAN</button>
            <button onClick={handleResetSession} className="bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black px-3.5 py-2 rounded-2xl text-xs uppercase"><RotateCcw className="w-4 h-4 inline mr-1"/> RESET SESI</button>
          </div>
          <div className="flex items-center gap-2.5 pt-1">
            <div className="p-2 bg-[#ccff00]/10 border border-[#ccff00] rounded-xl"><Zap className="w-5 h-5 text-[#ccff00] animate-pulse" /></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#ccff00] uppercase tracking-widest">SHORTCUT RESULT</h1>
              <p className="text-[10px] text-[#ccff00]/80">PANEL OTOMATISASI RESULT PASARAN TOGEL</p>
            </div>
          </div>
        </div>

        {/* TERMINAL PANEL */}
        <div className="relative w-full lg:w-[480px] border-2 border-[#ccff00]/80 bg-[#070410] rounded-2xl p-2.5 pt-4 shadow-xl space-y-2">
          <div className="absolute -top-3 left-4 bg-[#ccff00] text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded uppercase">TERMINAL PRIZE</div>
          <div className="flex flex-col gap-2">
            <form onSubmit={handleProcessP1Terminal} className="flex gap-2">
              <input type="text" placeholder="P1 (e.g. BANGKOK 0130 5202)" value={p1TerminalInput} onChange={(e)=>setP1TerminalInput(e.target.value)} className="bg-[#04020a] text-[#ccff00] text-xs outline-none flex-1 px-3 py-2 rounded-xl border border-[#ccff00]/40"/>
              <button type="submit" className="bg-[#ccff00] text-slate-950 font-black text-xs px-4 h-9 rounded-xl uppercase">P1</button>
            </form>
            <form onSubmit={handleProcessP123Terminal} className="flex gap-2">
              <textarea placeholder={`P123 (e.g. HUAHIN1630\nPRIZE 1 : 0574\nPRIZE 2 : 5597\nPRIZE 3 : 6047)`} value={p123TerminalInput} onChange={(e)=>setP123TerminalInput(e.target.value)} className="bg-[#04020a] text-[#ccff00] text-xs outline-none flex-1 p-2 rounded-xl border border-[#ccff00]/40 resize-none h-14"/>
              <button type="submit" className="bg-[#ccff00] text-slate-950 font-black text-xs px-3.5 h-14 rounded-xl uppercase">P123</button>
            </form>
          </div>
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="bg-[#080b14] border border-[#ccff00]/30 rounded-2xl p-2 sm:p-4 shadow-2xl overflow-x-auto max-h-[calc(100vh-320px)] min-h-[350px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px] relative">
          <thead className="sticky top-0 z-20 bg-[#0d1222]">
            <tr className="border-b-2 border-[#ccff00]/40 text-[11px] uppercase text-[#ccff00] tracking-wider">
              <th className="py-3 px-3">SESH</th><th className="py-3 px-3">NAMA PASARAN</th><th className="py-3 px-3 text-center">JAM TUTUP</th>
              <th className="py-3 px-3 text-center">JAM RESULT</th><th className="py-3 px-3 text-center">LINK</th>
              <th className="py-3 px-3 text-center">RESULT STATUS</th><th className="py-3 px-3 text-center">P1</th>
              <th className="py-3 px-3 text-center">P2</th><th className="py-3 px-3 text-center">P3</th>
              <th className="py-3 px-3 text-center">STATUS</th><th className="py-3 px-3 text-right">OPSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ccff00]/10 text-xs font-mono-code">
            {sortedFilteredList.map((item) => (
              <tr key={item.id} className={`hover:bg-[#ccff00]/5 transition-all ${item.status==='DONE'?'bg-[#ccff00]/10 border-l-4 border-l-[#ccff00]':''}`}>
                <td className="py-2.5 px-3">
                  <div className="flex items-center h-7 w-fit bg-[#0a0518] rounded-md border border-[#8b5cf6]/50 overflow-hidden shadow-lg">
                    <div className="h-full aspect-square bg-gradient-to-b from-[#8b5cf6] to-[#4c1d95] flex items-center justify-center"><Zap className="w-3 h-3 text-white"/></div>
                    <div className="px-3 text-[10px] font-black uppercase italic">{item.session}</div>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <span className="font-brand font-black italic uppercase text-[14px] text-[#22d3ee] [text-shadow:1px_1px_0_#9333ea,3px_3px_0_#4c1d95]">{item.name}</span>
                </td>
                <td className="py-2.5 px-3 text-center"><div className="digital-clock-container" data-time={item.jamTutup.replace(' WIB', '')} /></td>
                <td className="py-2.5 px-3 text-center"><div className="digital-clock-container" data-time={item.jamResult.replace(' WIB', '')} /></td>
                <td className="py-2.5 px-3 text-center">
                    <button onClick={() => window.open(item.linkUrl, '_blank')} className="link-loader" title="Buka Link Official" />
                </td>

                {/* UPDATE: RESULT STATUS DENGAN TRUCK BUTTON */}
                <td className="py-2.5 px-3 text-center">
                  <TruckStatusButton label={getResultStatusLabel(item)} isDone={item.status === 'DONE'} type="RESULT" />
                </td>

                <td className="py-2.5 px-3 text-center">
                  <span className="font-black italic tracking-widest text-[16px] text-white [text-shadow:1.5px_1.5px_0_#9333ea,3px_3px_0_#4c1d95,0_0_18px_#22d3ee]">{item.p1Prize || '-'}</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="font-black italic tracking-widest text-[16px] text-white [text-shadow:1.5px_1.5px_0_#9333ea,3px_3px_0_#4c1d95,0_0_18px_#22d3ee]">{item.p2Prize || '-'}</span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className="font-black italic tracking-widest text-[16px] text-white [text-shadow:1.5px_1.5px_0_#9333ea,3px_3px_0_#4c1d95,0_0_18px_#22d3ee]">{item.p3Prize || '-'}</span>
                </td>

                {/* UPDATE: STATUS DENGAN TRUCK BUTTON */}
                <td className="py-2.5 px-3 text-center">
                  <TruckStatusButton label={item.status} isDone={item.status === 'DONE'} type="STATUS" />
                </td>

                <td className="py-2.5 px-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button onClick={()=>handleOpenResultPopup(item)} className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] rounded-lg"><Percent className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>handleOpenEditModal(item)} className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] rounded-lg"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>handleDeletePasaran(item.id, item.name)} className="p-1.5 bg-rose-950/80 border border-rose-500/40 text-rose-400 rounded-lg"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EDIT/ADD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1222] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex justify-between border-b border-[#ccff00]/30 pb-3">
              <h3 className="text-base font-black text-[#ccff00] uppercase">{editItem ? `EDIT - ${editItem.name}` : 'ADD NEW PASARAN'}</h3>
              <button onClick={()=>setIsModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>
            <form onSubmit={handleSavePasaran} className="space-y-3 text-xs">
              <input required placeholder="NAMA PASARAN" value={formName} onChange={(e)=>setFormName(e.target.value)} className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none"/>
              <div className="grid grid-cols-2 gap-3">
                <select value={formSession} onChange={(e)=>setFormSession(e.target.value as any)} className="bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00]"><option value="SORE">SORE</option><option value="PAGI">PAGI</option><option value="MALAM">MALAM</option></select>
                <select value={formStatus} onChange={(e)=>setFormStatus(e.target.value as any)} className="bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00]"><option value="BELUM">BELUM</option><option value="DONE">DONE</option><option value="LIBUR">LIBUR</option></select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="P1" value={formP1Prize} onChange={(e)=>setFormP1Prize(e.target.value)} className="bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-2 py-2 text-center text-[#ccff00] font-bold"/>
                <input placeholder="P2" value={formP2Prize} onChange={(e)=>setFormP2Prize(e.target.value)} className="bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-2 py-2 text-center text-[#ccff00] font-bold"/>
                <input placeholder="P3" value={formP3Prize} onChange={(e)=>setFormP3Prize(e.target.value)} className="bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-2 py-2 text-center text-[#ccff00] font-bold"/>
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-[#ccff00]/30">
                <button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl uppercase">Batal</button>
                <button type="submit" className="px-5 py-2 bg-[#ccff00] text-slate-950 rounded-xl font-black uppercase">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALARM POPUP */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#141a0d] to-[#05060a] border-2 border-[#ccff00] rounded-3xl p-10 shadow-2xl text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-wider">{activeAlarm.title}</h2>
            <div className="text-lg sm:text-2xl font-black text-[#ccff00] uppercase">JAM RESULT {activeAlarm.jamResult}</div>
            <button onClick={handleDismissAlarm} className="bg-[#ccff00] text-slate-950 text-xl font-black px-12 py-3.5 rounded-2xl uppercase">OK / TUTUP</button>
          </div>
        </div>
      )}

      {/* SHIO POPUP */}
      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e1b] border-2 border-[#ccff00]/70 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between border-b border-[#1c223a] pb-3.5">
              <h3 className="text-base font-black text-[#ccff00] uppercase">{popupPasaran.name} RESULT</h3>
              <button onClick={()=>setIsResultPopupOpen(false)} className="text-slate-400">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#12162a] rounded-xl p-3.5"><div className="text-[10px] text-slate-400 uppercase">RESULT</div><div className="text-2xl font-black text-[#ccff00]">{popupPasaran.p1Prize}</div></div>
              <div className="bg-[#12162a] rounded-xl p-3.5"><div className="text-[10px] text-slate-400 uppercase">SHIO</div><div className="text-lg font-black text-white">{calculateShio(popupPasaran.p1Prize).emoji} {calculateShio(popupPasaran.p1Prize).name}</div></div>
            </div>
            <textarea value={popupText} rows={6} className="w-full bg-[#070913] border-2 border-[#1f2848] rounded-xl p-3 text-[#ccff00] font-mono-code text-xs outline-none"/>
            <div className="flex justify-end pt-2 border-t border-[#1c223a]">
                <button onClick={()=>{navigator.clipboard.writeText(popupText); addToast('Copied!','success'); setIsCopied(true);}} className="bg-[#ccff00] text-slate-950 font-black px-5 py-2.5 rounded-xl uppercase">{isCopied ? 'Tersalin!' : 'Salin Teks'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
