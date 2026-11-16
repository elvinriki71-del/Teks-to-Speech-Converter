import { FilePlus2 } from 'lucide-react';

interface HeaderProps {
  onNewScript: () => void;
  historyCount: number;
}

export function Header({ onNewScript, historyCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#studio-editor"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded"
        >
          SuaraStudio
        </a>

        {/* Zone 2: Concise single-line nav links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#studio-editor"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Studio Teks
          </a>
          <a
            href="#voice-settings"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Pilihan Suara
          </a>
          <a
            href="#audio-history"
            className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1"
          >
            Riwayat Audio{historyCount > 0 ? ` (${historyCount})` : ''}
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onNewScript}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <FilePlus2 className="h-4 w-4 text-slate-600" aria-hidden="true" />
            <span>Naskah Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
}
