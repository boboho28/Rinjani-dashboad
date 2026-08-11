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
  // --- SESSION PERSISTENCE (PENGINGAT SESI SAAT REFRESH) ---
  const [selectedSession, setSelectedSession] = useState<string>(() => {
    return localStorage.getItem('rinjani_last_result_session') || 'SORE';
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Simpan pilihan sesi ke localStorage setiap kali berubah
  useEffect(() => {
    localStorage.setItem('rinjani_last_result_session', selectedSession);
  }, [selectedSession]);

  // Live 1-second clock ticker for countdown
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

  // Audio Ref
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

  // Keyboard shortcut listener for SPACE or ESC to close alarm
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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeAlarm]);

  // Check pasaran countdown for alarm trigger when countdown expires (diffSecs <= 0)
  useEffect(() => {
    if (!isAlarmEnabled) return;

    const now = currentTime;
    const nowHours = now.getHours();
    const nowMins = now.getMinutes();
    const nowSecs = now.getSeconds();
    const nowTotalSecs = nowHours * 3600 + nowMins * 60 + nowSecs;
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

  // Direct Terminal Prize & Status Inputs State
  const [resultStatusInput, setResultStatusInput] = useState<string>('');
  const [p1TerminalInput, setP1TerminalInput] = useState<string>('');
  const [p123TerminalInput, setP123TerminalInput] = useState<string>('');

  // Result & Shio Popup State
  const [isResultPopupOpen, setIsResultPopupOpen] = useState<boolean>(false);
  const [popupPasaran, setPopupPasaran] = useState<PasaranItem | null>(null);
  const [popupText, setPopupText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const calculateShio = (p1Prize?: string): { name: string; emoji: string; formula: string; last2: string } => {
    if (!p1Prize || p1Prize === '-') {
      return { name: '-', emoji: '❓', formula: 'Result P1 belum diinput', last2: '-' };
    }
    const clean = p1Prize.replace(/\D/g, '');
    if (clean.length < 2) {
      return { name: '-', emoji: '❓', formula: 'Result < 2 digit', last2: '-' };
    }
    
    const last2 = clean.slice(-2);
    if (last2 === '00') {
      return { name: 'KELINCI', emoji: '🐇', formula: '2D = 00 → KELINCI', last2 };
    }
    
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
    
    const dayName = days[now.getDay()];
    const dateNum = String(now.getDate()).padStart(2, '0');
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    
    const pasaranTitle = item.name;
    
    return `Hasil Pengeluaran ${pasaranTitle}\nHari Ini ${dayName}, ${dateNum} ${monthName} ${year}\nResult : ${resultStr}\nSHIO : ${hasResult ? shioObj.name : '-'}\nSelamat Kepada Pemenang, Salam JP Hanya di TogelUP`;
  };

  const handleOpenResultPopup = (item: PasaranItem) => {
    setPopupPasaran(item);
    const text = generateResultAnnouncement(item);
    setPopupText(text);
    setIsCopied(false);
    setIsResultPopupOpen(true);
  };

  // Modal State for Add / Edit Pasaran
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<PasaranItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState<string>('');
  const [formSession, setFormSession] = useState<'PAGI' | 'SORE' | 'MALAM' | 'DINI HARI'>('SORE');
  const [formJamTutup, setFormJamTutup] = useState<string>('15:00 WIB');
  const [formJamResult, setFormJamResult] = useState<string>('16:15 WIB');
  const [formLinkUrl, setFormLinkUrl] = useState<string>('https://pasarantogel.com');
  const [formP1Prize, setFormP1Prize] = useState<string>('-');
  const [formP2Prize, setFormP2Prize] = useState<string>('-');
  const [formP3Prize, setFormP3Prize] = useState<string>('-');
  const [formStatus, setFormStatus] = useState<'BELUM' | 'DONE' | 'LIBUR'>('BELUM');
  const [formIsResultNow, setFormIsResultNow] = useState<boolean>(true);

  // Filter List by Session
  const filteredList = pasaranList.filter((item) => {
    if (selectedSession === 'SEMUA' || selectedSession === 'ALL PASARAN') return true;
    return item.session === selectedSession;
  });

  // --- LOGIKA SORTING BERDASARKAN JAM TUTUP (00:00 TERATAS) ---
  const sortedFilteredList = [...filteredList].sort((a, b) => {
    const getTimeValue = (jamStr: string) => {
      const match = jamStr.match(/(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return hours * 60 + minutes;
    };
    return getTimeValue(a.jamTutup) - getTimeValue(b.jamTutup);
  });

  const handleOpenAddModal = () => {
    setEditItem(null);
    setFormName('');
    setFormSession('SORE');
    setFormJamTutup('18:00 WIB');
    setFormJamResult('18:30 WIB');
    setFormLinkUrl('https://pasarantogel.com');
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
      setPasaranList((prev) =>
        prev.map((p) =>
          p.id === editItem.id
            ? {
                ...p,
                name: formName.trim().toUpperCase(),
                session: formSession,
                jamTutup: formJamTutup,
                jamResult: formJamResult,
                linkUrl: formLinkUrl,
                p1Prize: formP1Prize || '-',
                p2Prize: formP2Prize || '-',
                p3Prize: formP3Prize || '-',
                status: formStatus,
                isResultNow: formIsResultNow,
              }
            : p
        )
      );
      addToast(`Pasaran ${formName.toUpperCase()} berhasil diperbarui.`, 'success');
    } else {
      const newItem: PasaranItem = {
        id: `p-${Date.now()}`,
        name: formName.trim().toUpperCase(),
        session: formSession,
        jamTutup: formJamTutup,
        jamResult: formJamResult,
        linkUrl: formLinkUrl,
        p1Prize: formP1Prize || '-',
        p2Prize: formP2Prize || '-',
        p3Prize: formP3Prize || '-',
        status: formStatus,
        isResultNow: formIsResultNow,
      };
      setPasaranList((prev) => [newItem, ...prev]);
      addToast(`Pasaran ${formName.toUpperCase()} berhasil ditambahkan.`, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDeletePasaran = (id: string, name: string) => {
    setPasaranList((prev) => prev.filter((p) => p.id !== id));
    addToast(`Pasaran ${name} telah dihapus.`, 'info');
  };

  const isJamPassed = (jamTutupStr: string): boolean => {
    const match = jamTutupStr.match(/(\d{1,2}):(\d{2})/);
    if (!match) return false;
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const now = new Date();
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const tutupSecs = h * 3600 + m * 60;
    return nowSecs >= tutupSecs;
  };

  const findTargetPasaran = (inputStr: string): PasaranItem | undefined => {
    if (!pasaranList || pasaranList.length === 0) return undefined;
    const sortedPasaran = [...pasaranList].sort((a, b) => b.name.length - a.name.length);
    
    // 1. Search if pasaran name is mentioned in input
    let matched = sortedPasaran.find((p) => inputStr.includes(p.name.toUpperCase()));
    if (!matched) {
      matched = sortedPasaran.find((p) => {
        const parts = p.name.toUpperCase().split(' ');
        return parts.every((part) => inputStr.includes(part));
      });
    }
    if (matched) return matched;

    // 2. Fallback: Pasaran currently in RESULT NOW! state
    const resultNowItem = pasaranList.find((p) => p.isResultNow || (p.status === 'BELUM' && isJamPassed(p.jamTutup)));
    if (resultNowItem) return resultNowItem;

    // 3. Fallback: First pasaran with status BELUM in active session
    const activeSessionPasaran = pasaranList.find((p) => {
      if (selectedSession !== 'ALL PASARAN' && selectedSession !== 'SEMUA' && p.session !== selectedSession) {
        return false;
      }
      return p.status === 'BELUM';
    });
    if (activeSessionPasaran) return activeSessionPasaran;

    // 4. Default: First pasaran in overall list
    return pasaranList[0];
  };

  // --- RESET SESI FUNCTION ---
  const handleResetSession = () => {
    const sessionLabel =
      selectedSession === 'ALL PASARAN' || selectedSession === 'SEMUA'
        ? 'ALL PASARAN'
        : `SESI ${selectedSession}`;

    setPasaranList((prev) =>
      prev.map((item) => {
        if (
          selectedSession === 'ALL PASARAN' ||
          selectedSession === 'SEMUA' ||
          item.session === selectedSession
        ) {
          return {
            ...item,
            p1Prize: '-',
            p2Prize: '-',
            p3Prize: '-',
            status: 'BELUM',
            isResultNow: false,
          };
        }
        return item;
      })
    );
    addToast(`🔄 Status & Result P1 P2 P3 untuk ${sessionLabel} berhasil di-reset ke awal!`, 'success');
  };

  // --- HELPER TO EXTRACT MULTIPLE LINKS ---
  const getUrlsFromItem = (item: PasaranItem): string[] => {
    if (!item.linkUrl) return [];
    return item.linkUrl
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleOpenAllLinks = (item: PasaranItem) => {
    const urls = getUrlsFromItem(item);
    if (urls.length === 0) return;

    urls.forEach((url) => {
      let formattedUrl = url;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = 'https://' + formattedUrl;
      }
      window.open(formattedUrl, '_blank');
    });
  };

  // --- RENDER LIVE RESULT STATUS WITH COUNTDOWN TO JAM TUTUP ---
  const renderResultStatusBadge = (item: PasaranItem) => {
    if (item.status === 'DONE') {
      return (
        <div
          className="inline-block font-black text-[10px] px-3 py-1 rounded-full tracking-wider uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)] cursor-default select-none"
          title="Status Result: SUDAH RESULT"
        >
          SUDAH RESULT
        </div>
      );
    }

    if (item.status === 'LIBUR') {
      return (
        <div
          className="inline-block font-black text-[10px] px-3 py-1 rounded-full tracking-wider uppercase bg-amber-950/40 text-amber-300/80 border border-amber-500/30 cursor-default select-none"
          title="Status Result: PASARAN LIBUR"
        >
          PASARAN LIBUR
        </div>
      );
    }

    // Parse jamTutup e.g. "15:00 WIB" or "15:00"
    const matchTutup = item.jamTutup.match(/(\d{1,2}):(\d{2})/);
    if (!matchTutup) {
      return (
        <div
          className="inline-block font-black text-[10px] px-3 py-1 rounded-full tracking-wider uppercase bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 cursor-default select-none"
          title="Status Result: BELUM RESULT"
        >
          BELUM RESULT
        </div>
      );
    }

    const hoursTutup = parseInt(matchTutup[1], 10);
    const minsTutup = parseInt(matchTutup[2], 10);

    const nowHours = currentTime.getHours();
    const nowMins = currentTime.getMinutes();
    const nowSecs = currentTime.getSeconds();

    const nowTotalSecs = nowHours * 3600 + nowMins * 60 + nowSecs;
    const tutupTotalSecs = hoursTutup * 3600 + minsTutup * 60;

    let diffSecs = tutupTotalSecs - nowTotalSecs;

    if (diffSecs > 0) {
      const h = Math.floor(diffSecs / 3600);
      const m = Math.floor((diffSecs % 3600) / 60);
      const s = diffSecs % 60;

      const pad = (n: number) => n.toString().padStart(2, '0');
      const countdownStr = h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

      return (
        <div
          className="inline-block font-mono-code font-black text-[10px] px-2.5 py-1 rounded-full tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.3)] cursor-default select-none"
          title="Hitung Mundur ke Jam Tutup"
        >
          ⏳ TUTUP: {countdownStr}
        </div>
      );
    } else {
      return (
        <div
          className="inline-block font-black text-[10px] px-3 py-1 rounded-full tracking-wider uppercase bg-fuchsia-950/80 text-fuchsia-400 border border-fuchsia-500/60 shadow-[0_0_12px_rgba(217,70,239,0.7)] animate-pulse cursor-default select-none"
          title="Jam Tutup telah lewat, Menunggu Result"
        >
          RESULT NOW!
        </div>
      );
    }
  };

  // --- RESULT STATUS / CROSSCHECK TERMINAL PARSER (UPDATE: VALIDASI PERIODE & NAMA PASARAN) ---
  const handleProcessResultStatusInput = (e: React.FormEvent) => {
    e.preventDefault();
    const rawStr = resultStatusInput.trim().toUpperCase();

    if (!rawStr) {
      addToast('Input tidak boleh kosong.', 'error');
      return;
    }

    // VALIDASI KHUSUS: Harus ada kata "PERIODE"
    if (!rawStr.includes("PERIODE")) {
      addToast('Input Gagal! Harus mengandung kata "PERIODE" (contoh: periode : 686 ;pasar : TOTO MACAU PAGI)', 'error');
      return;
    }

    const matchedItem = findTargetPasaran(rawStr);

    if (!matchedItem) {
      addToast(`Nama pasaran dalam log tidak ditemukan di database dashboard.`, 'error');
      return;
    }

    // Update status menjadi DONE
    setPasaranList((prev) =>
      prev.map((item) =>
        item.id === matchedItem.id
          ? {
              ...item,
              status: 'DONE',
              isResultNow: false,
            }
          : item
      )
    );

    addToast(
      `✅ Validasi Berhasil! ${matchedItem.name} diubah menjadi SUDAH RESULT (DONE).`,
      'success'
    );
    setResultStatusInput('');
  };

  // --- TERMINAL PRIZE DIRECT INPUT PARSING LOGIC ---
  const handleProcessP1Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p1TerminalInput.trim()) {
      addToast('Masukkan nomor atau nama pasaran + nomor (contoh: TOTOMACAU SORE 5045 atau 5045)', 'error');
      return;
    }

    const rawStr = p1TerminalInput.trim().toUpperCase();
    const matchedItem = findTargetPasaran(rawStr);

    if (!matchedItem) {
      addToast(`Pasaran tidak ditemukan. Pastikan ada pasaran aktif.`, 'error');
      return;
    }

    // Extract numbers
    const numbers = rawStr.match(/\d+/g) || [];
    if (numbers.length === 0) {
      addToast(`Angka result tidak ditemukan dalam input. Contoh: ${matchedItem.name} 5045 atau 5045`, 'error');
      return;
    }

    const p1Value = numbers[0];

    setPasaranList((prev) =>
      prev.map((item) =>
        item.id === matchedItem.id
          ? {
              ...item,
              p1Prize: p1Value,
            }
          : item
      )
    );

    addToast(`✅ Result P1 ${matchedItem.name} (${p1Value}) berhasil di-input!`, 'success');
    setP1TerminalInput('');
  };

  const handleProcessP123Terminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p123TerminalInput.trim()) {
      addToast('Masukkan angka 3 prize (contoh: HUAHIN 1630 \\nPRIZE 1: 0574 \\nPRIZE 2: 5597 \\nPRIZE 3: 6047 atau 0574 5597 6047)', 'error');
      return;
    }

    let cleanStr = p123TerminalInput.trim().toUpperCase();
    cleanStr = cleanStr.replace(/PRIZE\s*[123]:?/gi, ' ');
    cleanStr = cleanStr.replace(/P[123]:?/gi, ' ');

    const matchedItem = findTargetPasaran(cleanStr);

    if (!matchedItem) {
      addToast(`Pasaran tidak ditemukan.`, 'error');
      return;
    }

    const numbers = cleanStr.match(/\d+/g) || [];
    if (numbers.length === 0) {
      addToast(`Angka result tidak ditemukan.`, 'error');
      return;
    }

    const p1Value = numbers[0] || '-';
    const p2Value = numbers[1] || '-';
    const p3Value = numbers[2] || '-';

    setPasaranList((prev) =>
      prev.map((item) =>
        item.id === matchedItem.id
          ? {
              ...item,
              p1Prize: p1Value,
              p2Prize: p2Value,
              p3Prize: p3Value,
            }
          : item
      )
    );

    addToast(
      `✅ Result P123 ${matchedItem.name} (P1:${p1Value}, P2:${p2Value}, P3:${p3Value}) berhasil di-input!`,
      'success'
    );
    setP123TerminalInput('');
  };

  return (
    <div className="space-y-5 font-sans text-slate-100">
      
      {/* STYLE UNTUK LOADER TOMBOL LINK SESUAI CSS PERMINTAAN */}
      <style>{`
        .link-loader {
          display: inline-flex;
          gap: 10px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 8px;
          transition: transform 0.2s;
        }
        .link-loader:active { transform: scale(0.9); }
        .link-loader:before,
        .link-loader:after {
          content: "";
          height: 18px;
          aspect-ratio: 1;
          border-radius: 50%;
          background:
            linear-gradient(#222 0 0) top/100% 40% no-repeat,
            radial-gradient(farthest-side,#000 95%,#0000) 50%/8px 8px no-repeat
            #fff;
          animation: l7 1.5s infinite alternate ease-in;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }
        @keyframes l7 {
          0%,
          70% {background-size:100% 40%,8px 8px}
          85% {background-size:100% 120%,8px 8px}
          100% {background-size:100% 40%,8px 8px}
        }
      `}</style>
      
      {/* 1. TOP HEADER TOOLBAR SECTION */}
      <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl p-3 sm:p-4 shadow-[0_0_25px_rgba(204,255,0,0.15)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sticky top-[98px] sm:top-[102px] z-30 bg-[#0b0f1a]">
        
        <div className="flex flex-col justify-between items-start self-stretch gap-3 flex-1">
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Shift Session Selector */}
            <div className="flex items-center bg-[#151128] border-2 border-[#ccff00]/60 rounded-2xl px-3 py-1.5 text-xs sm:text-sm text-[#ccff00] font-bold shadow-[0_0_12px_rgba(204,255,0,0.2)]">
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="bg-transparent outline-none cursor-pointer font-mono-code font-extrabold text-[#ccff00] uppercase"
              >
                <option value="SORE" className="bg-[#121325]">SESI SORE</option>
                <option value="PAGI" className="bg-[#121325]">SESI PAGI</option>
                <option value="MALAM" className="bg-[#121325]">SESI MALAM</option>
                <option value="ALL PASARAN" className="bg-[#121325]">ALL PASARAN</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMuted(!isMuted);
                addToast(isMuted ? 'Suara notifikasi diaktifkan.' : 'Suara notifikasi dibisukan.', 'info');
              }}
              className="p-2 bg-[#181a2c] border-2 border-[#ccff00]/50 text-[#ccff00] hover:text-white rounded-2xl transition-all cursor-pointer hover:border-[#ccff00]"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-[#ccff00]" />}
            </button>

            <button
              type="button"
              onClick={() => setShowAlarmConfigModal(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black px-3.5 py-2 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(225,29,72,0.6)] cursor-pointer transition-all active:scale-95 uppercase tracking-wider font-heading"
            >
              <Bell className="w-4 h-4" />
              <span>ALARM CFG</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 font-black px-3.5 py-2 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_20px_rgba(204,255,0,0.5)] cursor-pointer transition-all active:scale-95 uppercase tracking-wider font-heading"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>ADD PASARAN</span>
            </button>

            <button
              type="button"
              onClick={handleResetSession}
              className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black px-3.5 py-2 rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_18px_rgba(245,158,11,0.6)] cursor-pointer transition-all active:scale-95 uppercase tracking-wider border border-amber-300/80 font-heading"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>RESET SESI</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <div className="p-2 bg-[#ccff00]/10 border border-[#ccff00] rounded-xl shadow-[0_0_12px_rgba(204,255,0,0.4)]">
              <Zap className="w-5 h-5 text-[#ccff00] animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#ccff00] font-brand tracking-widest uppercase drop-shadow-[0_0_12px_rgba(204,255,0,0.5)]">
                SHORTCUT RESULT
              </h1>
              <p className="text-[10px] font-mono-code text-[#ccff00]/80 font-semibold tracking-wide">
                PANEL OTOMATISASI RESULT PASARAN TOGEL
              </p>
            </div>
          </div>

        </div>

        <div className="relative w-full lg:w-[480px] xl:w-[520px] shrink-0 border-2 border-[#ccff00]/80 bg-[#070410] rounded-2xl p-2.5 pt-4 shadow-[0_0_25px_rgba(204,255,0,0.25)] space-y-2">
          <div className="absolute -top-3 left-4 bg-[#ccff00] text-slate-950 font-brand font-black text-[10px] px-2.5 py-0.5 rounded-lg uppercase tracking-wider shadow-[0_0_15px_rgba(204,255,0,0.6)] border border-[#e5ff80]">
            TERMINAL PRIZE
          </div>

          <div className="flex flex-col gap-2">
            <form onSubmit={handleProcessResultStatusInput} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="CROSSCHECK CATATAN LOG / RESULT STATUS"
                value={resultStatusInput}
                onChange={(e) => setResultStatusInput(e.target.value)}
                className="bg-[#04020a] text-[#ccff00] font-mono-code text-xs outline-none flex-1 font-bold placeholder-slate-600 px-3 py-2 rounded-xl border border-[#ccff00]/50 focus:border-[#ccff00]"
              />
              <button
                type="submit"
                className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 font-black text-xs px-4 h-9 rounded-xl flex items-center justify-center cursor-pointer shadow-[0_0_12px_rgba(204,255,0,0.5)] transition-all active:scale-95 uppercase tracking-wider shrink-0 font-heading"
              >
                <span>DONE</span>
              </button>
            </form>

            <form onSubmit={handleProcessP1Terminal} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="P1 (e.g. TOTOMACAU SORE 5244)"
                value={p1TerminalInput}
                onChange={(e) => setP1TerminalInput(e.target.value)}
                className="bg-[#04020a] text-[#ccff00] font-mono-code text-xs outline-none flex-1 font-bold placeholder-slate-600 px-3 py-2 rounded-xl border border-[#ccff00]/40 focus:border-[#ccff00]"
              />
              <button
                type="submit"
                className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 font-black text-xs px-4 h-9 rounded-xl flex items-center justify-center cursor-pointer shadow-[0_0_14px_rgba(204,255,0,0.5)] transition-all active:scale-95 uppercase tracking-wider shrink-0 font-heading"
              >
                <span>P1</span>
              </button>
            </form>

            <form onSubmit={handleProcessP123Terminal} className="flex items-center gap-2">
              <textarea
                rows={2}
                placeholder={`P123 (e.g. HUAHIN1630\nPRIZE 1 : 0574\nPRIZE 2 : 5597\nPRIZE 3 : 6047)`}
                value={p123TerminalInput}
                onChange={(e) => setP123TerminalInput(e.target.value)}
                className="bg-[#04020a] text-[#ccff00] font-mono-code text-xs outline-none flex-1 font-bold placeholder-slate-600 p-2 rounded-xl border border-[#ccff00]/40 focus:border-[#ccff00] resize-none h-14 leading-tight"
              />
              <button
                type="submit"
                className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 font-black text-xs px-3.5 h-14 rounded-xl flex items-center justify-center cursor-pointer shadow-[0_0_14px_rgba(204,255,0,0.5)] transition-all active:scale-95 uppercase tracking-wider shrink-0 font-heading"
              >
                <span>P123</span>
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* 2. MAIN PASARAN RESULT LIST TABLE CONTAINER */}
      <div className="bg-[#080b14] border border-[#ccff00]/30 rounded-2xl p-2 sm:p-4 shadow-2xl overflow-x-auto max-h-[calc(100vh-320px)] min-h-[350px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px] relative">
          <thead className="sticky top-0 z-20 bg-[#0d1222] shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <tr className="border-b-2 border-[#ccff00]/40 text-[11px] font-mono-code uppercase text-[#ccff00] tracking-wider">
              <th className="py-3 px-3 sticky top-0 bg-[#0d1222] z-20">SESH</th>
              <th className="py-3 px-3 font-heading sticky top-0 bg-[#0d1222] z-20">NAMA PASARAN</th>
              <th className="py-3 px-3 text-center sticky top-0 bg-[#0d1222] z-20">JAM TUTUP</th>
              <th className="py-3 px-3 text-center sticky top-0 bg-[#0d1222] z-20">JAM RESULT</th>
              <th className="py-3 px-3 text-center sticky top-0 bg-[#0d1222] z-20">LINK</th>
              <th className="py-3 px-3 text-center sticky top-0 bg-[#0d1222] z-20">RESULT STATUS</th>
              <th className="py-3 px-3 text-center sticky top-0 bg-[#0d1222] z-20">P1</th>
              <th className="py-3 px-3 text-center sticky top-0 bg-[#0d1222] z-20">P2</th>
              <th className="py-3 px-3 text-center sticky top-0 bg-[#0d1222] z-20">P3</th>
              <th className="py-3 px-3 text-center sticky top-0 bg-[#0d1222] z-20">STATUS</th>
              <th className="py-3 px-3 text-right sticky top-0 bg-[#0d1222] z-20">OPSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ccff00]/10 text-xs font-mono-code">
            {sortedFilteredList.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-500 font-body">
                  Tidak ada pasaran untuk sesi {selectedSession}.
                </td>
              </tr>
            ) : (
              sortedFilteredList.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-[#ccff00]/5 transition-all group ${
                    item.status === 'DONE'
                      ? 'bg-[#ccff00]/10 border-l-4 border-l-[#ccff00] font-bold text-slate-100 shadow-[inset_0_0_12px_rgba(204,255,0,0.15)]'
                      : item.status === 'LIBUR'
                      ? 'bg-amber-950/40 border-l-4 border-l-amber-400/80 font-bold text-amber-200/90 shadow-[inset_0_0_12px_rgba(245,158,11,0.15)]'
                      : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="relative flex items-center h-7 w-fit bg-[#0a0518] rounded-md border border-[#8b5cf6]/50 overflow-hidden shadow-[0_0_8px_rgba(139,92,246,0.3)] hover:shadow-[0_0_15px_rgba(139,92,246,0.6)] transition-all">
                      <div className="flex items-center justify-center h-full aspect-square bg-gradient-to-b from-[#8b5cf6] to-[#4c1d95] shadow-[inset_0_0_4px_rgba(255,255,255,0.4)]">
                        <Zap className="w-3 h-3 text-white fill-white/20 animate-pulse" />
                      </div>
                      <div className="px-3 h-full flex items-center bg-gradient-to-r from-[#1e0a3d] to-[#0a0518]">
                        <span className="text-[10px] font-black text-purple-100 italic tracking-tighter uppercase drop-shadow-[0_0_4px_rgba(167,139,250,0.8)] font-heading">
                          {item.session}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#a78bfa] to-transparent shadow-[0_0_8px_#a78bfa]" />
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className="font-brand font-black italic uppercase text-[14px] tracking-tighter text-[#22d3ee] [text-shadow:1px_1px_0_#9333ea,3px_3px_0_#4c1d95,0_0_15px_rgba(34,211,238,0.7)] group-hover:scale-110 transition-transform inline-block">
                      {item.name}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono-code font-black italic text-[12px] tracking-tight text-[#e879f9] [text-shadow:1.5px_1.5px_0_#1e1b4b,0_0_10px_rgba(232,121,249,0.5)]">
                      {item.jamTutup}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono-code font-black italic text-[12px] tracking-tight text-[#e879f9] [text-shadow:1.5px_1.5px_0_#1e1b4b,0_0_10px_rgba(232,121,249,0.5)]">
                      {item.jamResult}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {/* UPDATE: LOADER ANIMASI SEBAGAI TOMBOL LINK */}
                    {(() => {
                      const urls = getUrlsFromItem(item);
                      if (urls.length === 0) {
                        return <span className="text-slate-600">-</span>;
                      }
                      return (
                        <div className="flex items-center justify-center gap-2">
                           <button
                            type="button"
                            onClick={() => handleOpenAllLinks(item)}
                            className="link-loader"
                            title={`Buka ${urls.length} Link Sekaligus`}
                          />
                          {urls.length > 1 && (
                            <span className="font-bold text-[9px] bg-[#ccff00]/20 px-1.5 py-0.5 rounded-full text-[#ccff00] border border-[#ccff00]/30 font-mono-code">
                              {urls.length}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {renderResultStatusBadge(item)}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono-code font-black italic tracking-widest text-[16px] text-white [text-shadow:1.5px_1.5px_0_#9333ea,3px_3px_0_#4c1d95,0_0_18px_#22d3ee]">
                      {item.p1Prize || '-'}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono-code font-black italic tracking-widest text-[14px] text-[#22d3ee]/95 [text-shadow:1.5px_1.5px_0_#4c1d95,0_0_8px_rgba(34,211,238,0.5)]">
                      {item.p2Prize || '-'}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono-code font-black italic tracking-widest text-[14px] text-[#22d3ee]/95 [text-shadow:1.5px_1.5px_0_#4c1d95,0_0_8px_rgba(34,211,238,0.5)]">
                      {item.p3Prize || '-'}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <div
                      className={`inline-block font-black text-[10px] px-3 py-1 rounded-xl tracking-wider uppercase shadow-sm font-heading cursor-default select-none ${
                        item.status === 'BELUM'
                          ? 'bg-rose-600 text-white border border-rose-400 shadow-[0_0_8px_rgba(225,29,72,0.5)]'
                          : item.status === 'DONE'
                          ? 'bg-[#ccff00] text-slate-950 border border-[#e5ff80] shadow-[0_0_12px_rgba(204,255,0,0.6)] font-black'
                          : 'bg-amber-500/30 text-amber-300 border-2 border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                      }`}
                    >
                      {item.status}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenResultPopup(item)}
                        className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] hover:text-white rounded-lg hover:bg-[#ccff00]/20 transition-all cursor-pointer"
                      >
                        <Percent className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 bg-[#0d0f1a] border border-[#ccff00]/40 text-[#ccff00] hover:text-white rounded-lg hover:bg-[#ccff00]/20 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePasaran(item.id, item.name)}
                        className="p-1.5 bg-rose-950/80 border border-rose-500/40 text-rose-400 hover:text-rose-200 rounded-lg hover:bg-rose-900 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL ADD/EDIT PASARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1222] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-lg p-5 shadow-[0_0_40px_rgba(204,255,0,0.3)] space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#ccff00]/30 pb-3">
              <h3 className="text-base font-black text-[#ccff00] font-brand uppercase tracking-wider">
                {editItem ? `EDIT PASARAN - ${editItem.name}` : 'TAMBAH PASARAN BARU'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePasaran} className="space-y-3 text-xs font-mono-code">
              <div>
                <label className="block text-slate-300 font-bold mb-1">NAMA PASARAN</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TOTOMACAU SORE"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none focus:border-[#ccff00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">SESI SHIFT</label>
                  <select
                    value={formSession}
                    onChange={(e) => setFormSession(e.target.value as any)}
                    className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none"
                  >
                    <option value="SORE">SORE</option>
                    <option value="PAGI">PAGI</option>
                    <option value="MALAM">MALAM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">STATUS AKSI</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none"
                  >
                    <option value="BELUM">BELUM</option>
                    <option value="DONE">DONE</option>
                    <option value="LIBUR">LIBUR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">JAM TUTUP</label>
                  <input
                    type="text"
                    value={formJamTutup}
                    onChange={(e) => setFormJamTutup(e.target.value)}
                    className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">JAM RESULT</label>
                  <input
                    type="text"
                    value={formJamResult}
                    onChange={(e) => setFormJamResult(e.target.value)}
                    className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold">LINK LIVE DRAW (Bisa Multi-Link)</label>
                </div>
                <textarea
                  rows={3}
                  placeholder={"https://totomacau.com\nhttps://livedrawmacau.com"}
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  className="w-full bg-[#141b2d] border border-[#ccff00]/40 rounded-xl px-3 py-2 text-[#ccff00] outline-none text-xs font-mono resize-none focus:border-[#ccff00]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">PRIZE P1</label>
                  <input
                    type="text"
                    value={formP1Prize}
                    onChange={(e) => setFormP1Prize(e.target.value)}
                    className="w-full bg-[#141b2d] border border-[#ccff00]/50 rounded-xl px-2 py-2 text-[#ccff00] font-bold text-center outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">PRIZE P2</label>
                  <input
                    type="text"
                    value={formP2Prize}
                    onChange={(e) => setFormP2Prize(e.target.value)}
                    className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-2 py-2 text-slate-200 font-bold text-center outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">PRIZE P3</label>
                  <input
                    type="text"
                    value={formP3Prize}
                    onChange={(e) => setFormP3Prize(e.target.value)}
                    className="w-full bg-[#141b2d] border border-slate-700 rounded-xl px-2 py-2 text-slate-200 font-bold text-center outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ccff00]/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold font-heading"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 rounded-xl font-black uppercase cursor-pointer transition-all shadow-[0_0_15px_rgba(204,255,0,0.5)] font-heading"
                >
                  Simpan Pasaran
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ACTIVE ALARM POPUP MODAL */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#141a0d] via-[#0a0d14] to-[#05060a] border-2 border-[#ccff00] rounded-3xl p-6 sm:p-10 shadow-[0_0_60px_rgba(204,255,0,0.45)] text-center space-y-6 animate-scale-up">
            <div className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-brand font-black uppercase tracking-widest text-[#ccff00] drop-shadow-[0_0_12px_rgba(204,255,0,0.8)]">
              <span className="text-xl sm:text-2xl animate-bounce">⏰</span>
              <span>RINJANI ALARM RESULT</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-5xl font-brand font-black text-white tracking-wider uppercase leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.7)]">
                {activeAlarm.title || `RESULT ${activeAlarm.pasaranName}`.trim()}
              </h2>
              <div className="text-lg sm:text-2xl font-brand font-black text-[#ccff00] tracking-widest uppercase drop-shadow-[0_0_12px_rgba(204,255,0,0.6)]">
                JAM RESULT {activeAlarm.jamResult}
              </div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDismissAlarm}
                className="bg-[#ccff00] hover:bg-[#e5ff80] text-slate-950 text-base sm:text-xl font-heading font-black px-12 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(204,255,0,0.75)] transition-all transform active:scale-95 cursor-pointer uppercase tracking-wider border-2 border-[#e5ff80]"
              >
                OK / TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALARM CONFIGURATION MODAL */}
      {showAlarmConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f1a] border-2 border-[#ccff00]/60 rounded-2xl w-full max-w-md p-5 shadow-[0_0_40px_rgba(204,255,0,0.3)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#ccff00]/30 pb-3">
              <div className="flex items-center gap-2">
                <AlarmClock className="w-5 h-5 text-[#ccff00]" />
                <h3 className="text-base font-black text-[#ccff00] font-brand uppercase tracking-wider">
                  KONFIGURASI ALARM
                </h3>
              </div>
              <button onClick={() => setShowAlarmConfigModal(false)} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4 text-xs font-mono-code">
              <div className="flex items-center justify-between bg-[#121624] p-3 rounded-xl border border-[#ccff00]/30">
                <div>
                  <div className="text-white font-bold font-heading uppercase text-xs">Otomatis Popup Alarm</div>
                </div>
                <input type="checkbox" checked={isAlarmEnabled} onChange={(e) => setIsAlarmEnabled(e.target.checked)} className="w-5 h-5 accent-[#ccff00] cursor-pointer" />
              </div>
              <div className="flex items-center justify-between bg-[#121624] p-3 rounded-xl border border-[#ccff00]/30">
                <div><div className="text-white font-bold font-heading uppercase text-xs">Suara Sirine</div></div>
                <button onClick={() => setIsMuted(!isMuted)} className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 ${isMuted ? 'bg-rose-950 text-rose-400 border border-rose-500/50' : 'bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/50'}`}>
                   {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}<span>{isMuted ? 'MUTE' : 'UNMUTE'}</span>
                </button>
              </div>
              <button onClick={() => { setShowAlarmConfigModal(false); triggerAlarm({ pasaranName: 'TEST', jamTutup: '00:00', jamResult: '00:00', session: 'SORE', title: 'TEST OK' }); }} className="w-full bg-[#ccff00] text-slate-950 font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider font-heading">
                <Play className="w-4 h-4 fill-slate-950" /><span>TEST ALARM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HASIL RESULT & SHIO */}
      {isResultPopupOpen && popupPasaran && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0e1b] border-2 border-[#ccff00]/70 rounded-2xl w-full max-w-md sm:max-w-lg p-5 sm:p-6 shadow-[0_0_40px_rgba(204,255,0,0.25)] space-y-5">
            <div className="flex items-center justify-between border-b border-[#1c223a] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#ccff00]/15 border border-[#ccff00]/40 text-[#ccff00]"><Sparkles className="w-5 h-5 animate-pulse" /></div>
                <div><h3 className="text-base font-black text-[#ccff00] font-brand uppercase">HASIL RESULT &amp; SHIO</h3><p className="text-xs text-slate-400 font-medium">{popupPasaran.name}</p></div>
              </div>
              <button onClick={() => setIsResultPopupOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#12162a] border border-[#232a48] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono-code">RESULT P1</span>
                <div className="text-xl sm:text-2xl font-black text-[#ccff00] tracking-widest font-mono-code mt-1">{popupPasaran.p1Prize && popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '-'}</div>
              </div>
              {(() => {
                const res = popupPasaran.p1Prize && popupPasaran.p1Prize !== '-' ? popupPasaran.p1Prize : '-';
                const shio = calculateShio(res);
                return (
                  <div className="bg-[#12162a] border border-[#232a48] rounded-xl p-3.5 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono-code">SHIO</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">{res !== '-' ? shio.emoji : '❓'}</span>
                      <span className="text-lg sm:text-xl font-black text-white font-heading">{res !== '-' ? shio.name : '-'}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            <textarea value={popupText} onChange={(e) => setPopupText(e.target.value)} rows={7} className="w-full bg-[#070913] border-2 border-[#1f2848] rounded-xl p-3.5 text-xs sm:text-sm text-[#ccff00] font-mono-code outline-none focus:border-[#ccff00]" />
            <div className="flex items-center justify-between pt-2 gap-3">
              <button onClick={() => setIsResultPopupOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-300 bg-[#131728] border border-[#262f50] rounded-xl">Tutup</button>
              <button onClick={() => { navigator.clipboard.writeText(popupText); addToast('✅ Berhasil disalin!', 'success'); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }} className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-xl shadow-md transition-all font-heading ${isCopied ? 'bg-emerald-400 text-slate-950' : 'bg-[#ccff00] text-slate-950'}`}>
                {isCopied ? <><Check className="w-4 h-4" /> Tersalin!</> : <><Copy className="w-4 h-4" /> Salin Teks</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
