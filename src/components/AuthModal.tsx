import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import {
  registerUser,
  loginUser,
  logoutUser,
  fetchAllRegisteredUsers,
  UserProfile,
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onSuccessToast: (msg: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccessToast,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'users_list'>(
    currentUser ? 'users_list' : 'login'
  );

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Member / Operator');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Registered users list from Firestore
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      loadUsersList();
    }
  }, [isOpen]);

  const loadUsersList = async () => {
    setLoadingUsers(true);
    const users = await fetchAllRegisteredUsers();
    setRegisteredUsers(users);
    setLoadingUsers(false);
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan kata sandi wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const profile = await loginUser(email.trim(), password.trim());
      onSuccessToast(`Selamat datang kembali, ${profile.displayName || profile.email}!`);
      setLoading(false);
      onClose();
    } catch (err: any) {
      setLoading(false);
      console.error('Login error:', err);
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found') {
        setErrorMsg('Email atau kata sandi tidak cocok. Silakan periksa kembali!');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMsg('Format email tidak valid!');
      } else {
        setErrorMsg(err?.message || 'Gagal masuk ke akun. Pastikan koneksi terhubung.');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!displayName.trim()) {
      setErrorMsg('Nama lengkap / Username wajib diisi!');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Alamat Email wajib diisi!');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter!');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    setLoading(true);
    try {
      const newProfile = await registerUser(email.trim(), password.trim(), displayName.trim(), role);
      onSuccessToast(`Akun ${newProfile.displayName} berhasil didaftarkan ke Firestore!`);
      setLoading(false);
      loadUsersList();
      onClose();
    } catch (err: any) {
      setLoading(false);
      console.error('Register error:', err);
      if (err?.code === 'auth/email-already-in-use') {
        setErrorMsg('Email ini sudah terdaftar. Silakan gunakan menu Masuk / Login!');
      } else if (err?.code === 'auth/invalid-email') {
        setErrorMsg('Format email tidak valid!');
      } else if (err?.code === 'auth/weak-password') {
        setErrorMsg('Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka!');
      } else {
        setErrorMsg(err?.message || 'Gagal mendaftar akun. Silakan coba lagi.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
      setErrorMsg('');
      setActiveTab('register');
      onSuccessToast('Anda telah keluar dari akun. Silakan daftar atau login dengan akun baru.');
    } catch (err: any) {
      console.error('Logout error:', err);
      setErrorMsg('Gagal keluar dari akun: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'Baru saja';
    return new Date(ts).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0f111d] border border-[#23273e] w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#090a12] px-6 py-4 border-b border-[#1c1f33] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ccff00] text-slate-950 flex items-center justify-center font-black shadow-[0_0_15px_rgba(204,255,0,0.4)]">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#ccff00] tracking-wider uppercase font-brand">
                SISTEM AKUN & LOGIN (FIREBASE)
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Pendaftaran & login langsung tersimpan di Firestore Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-[#181a2b] border border-[#2a2d48] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Status Bar if Logged In */}
        {currentUser && (
          <div className="bg-[#141728] px-6 py-3 border-b border-[#252842] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-lime-400/10 border border-lime-400/40 text-lime-400 flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.displayName ? currentUser.displayName.slice(0, 2) : 'US'}
              </div>
              <div className="text-xs">
                <div className="font-black text-lime-300 flex items-center gap-1.5">
                  <span>{currentUser.displayName}</span>
                  <span className="bg-lime-400/20 text-lime-400 border border-lime-400/40 text-[9px] px-2 py-0.2 rounded-full uppercase font-mono">
                    {currentUser.role || 'MEMBER'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{currentUser.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loading ? 'Mengeluarkan...' : 'Keluar (Logout)'}</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs - ALWAYS VISIBLE */}
        <div className="flex border-b border-[#1f2238] bg-[#0c0d17]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'text-[#ccff00] border-b-2 border-[#ccff00] bg-[#141628]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'text-[#ccff00] border-b-2 border-[#ccff00] bg-[#141628]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftar Akun</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('users_list');
              loadUsersList();
            }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'users_list'
                ? 'text-[#ccff00] border-b-2 border-[#ccff00] bg-[#141628]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Member ({registeredUsers.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Alamat Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full bg-[#090a12] border border-[#23273e] focus:border-[#ccff00] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Kata Sandi <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#090a12] border border-[#23273e] focus:border-[#ccff00] rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 stroke-[2.5]" />
                    <span>Masuk Ke Akun</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-400">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMsg('');
                    }}
                    className="text-[#ccff00] font-bold hover:underline cursor-pointer"
                  >
                    Daftar Baru Di Sini
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Nama Lengkap / Username <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Admin Rinjani"
                    required
                    className="w-full bg-[#090a12] border border-[#23273e] focus:border-[#ccff00] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Alamat Email <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    required
                    className="w-full bg-[#090a12] border border-[#23273e] focus:border-[#ccff00] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Kata Sandi <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 Karakter"
                      required
                      className="w-full bg-[#090a12] border border-[#23273e] focus:border-[#ccff00] rounded-xl pl-10 pr-8 py-2.5 text-xs text-slate-100 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Konfirmasi Sandi <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi Sandi"
                      required
                      className="w-full bg-[#090a12] border border-[#23273e] focus:border-[#ccff00] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Peran / Jabatan</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#090a12] border border-[#23273e] focus:border-[#ccff00] rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none"
                >
                  <option value="Admin Utama">Admin Utama</option>
                  <option value="Operator PK">Operator PK</option>
                  <option value="Member / Operator">Member / Operator</option>
                  <option value="Staff Management">Staff Management</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Daftar Akun Baru (Simpan ke Firestore)</span>
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-slate-400">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMsg('');
                    }}
                    className="text-[#ccff00] font-bold hover:underline cursor-pointer"
                  >
                    Masuk Di Sini
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* USERS LIST TAB */}
          {activeTab === 'users_list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#ccff00]" />
                  <span>DAFTAR PENGGUNA TERDAFTAR DI FIRESTORE</span>
                </h3>
                <button
                  type="button"
                  onClick={loadUsersList}
                  disabled={loadingUsers}
                  className="p-1.5 rounded-lg bg-[#181a2b] hover:bg-[#252840] text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#ccff00]" />
                  <span>Memuat data pengguna dari Firestore...</span>
                </div>
              ) : registeredUsers.length === 0 ? (
                <div className="text-center py-8 bg-[#090a12] border border-[#1f2238] rounded-xl p-4 text-slate-400 text-xs">
                  Belum ada pengguna terdaftar di Firestore. Silakan daftar akun baru!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {registeredUsers.map((u, i) => (
                    <div
                      key={u.uid || i}
                      className="p-3 bg-[#090a12] border border-[#1f2238] hover:border-[#ccff00]/40 rounded-xl flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] flex items-center justify-center font-black text-xs shrink-0">
                          {u.displayName ? u.displayName.slice(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-100 text-xs truncate flex items-center gap-1.5">
                            <span>{u.displayName || 'Tanpa Nama'}</span>
                            <span className="text-[9px] bg-slate-800 text-[#ccff00] border border-[#ccff00]/30 px-1.5 py-0.2 rounded font-mono">
                              {u.role || 'Member'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{u.email}</div>
                        </div>
                      </div>

                      <div className="text-right text-[10px] text-slate-500 shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(u.createdAt)}</span>
                        </div>
                        <div className="text-[9px] text-emerald-400 font-medium mt-0.5">
                          ✓ Terdaftar
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
