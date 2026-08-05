import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;

  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Rinjani App:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0e18] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md bg-[#131422] border border-[#2b2e47] p-8 rounded-2xl shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 text-3xl font-black">
              ⚠️
            </div>
            <h1 className="text-xl font-black text-amber-300">Rinjani System Restart Required</h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Terjadi kendala saat memuat data dari browser atau database. Silakan klik tombol di bawah untuk menyegarkan tampilan.
            </p>
            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-lg text-left text-[11px] font-mono text-rose-300 border border-rose-500/20 overflow-x-auto">
                {this.state.error.toString()}
              </div>
            )}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                🔄 Muat Ulang Halaman
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                🧹 Bersihkan Cache LocalStorage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
