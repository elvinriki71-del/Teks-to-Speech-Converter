import { ArrowUpRight, Download, Play, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { StoredAudioClip } from '../utils/audioStorage';
import { LANGUAGE_OPTIONS, type SpeechLanguage } from '../utils/ttsConfig';
import { formatDuration, formatFileSize } from '../utils/wav';

interface AudioHistoryListProps {
  clips: StoredAudioClip[];
  activeClipId: string | null;
  onSelectClip: (clip: StoredAudioClip) => void;
  onDownloadClip: (clip: StoredAudioClip) => void;
  onLoadIntoEditor: (clip: StoredAudioClip) => void;
  onDeleteClip: (id: string) => void;
}

type FilterLang = 'all' | SpeechLanguage;

export function AudioHistoryList({
  clips,
  activeClipId,
  onSelectClip,
  onDownloadClip,
  onLoadIntoEditor,
  onDeleteClip,
}: AudioHistoryListProps) {
  const [filterLang, setFilterLang] = useState<FilterLang>('all');
  const [query, setQuery] = useState('');

  const filteredClips = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clips.filter((clip) => {
      if (filterLang !== 'all' && clip.language !== filterLang) return false;
      if (q && !clip.text.toLowerCase().includes(q) && !clip.voiceId.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [clips, filterLang, query]);

  return (
    <section
      id="audio-history"
      aria-labelledby="history-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 id="history-heading" className="font-display text-base font-semibold text-slate-900">
            Riwayat Audio Tersimpan
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Rekaman disimpan di browser Anda agar bisa diputar ulang atau diunduh kapan saja.
          </p>
        </div>

        {clips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari naskah..."
                aria-label="Cari riwayat audio"
                className="w-44 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none min-h-[34px]"
              />
            </div>

            <div
              role="group"
              aria-label="Filter bahasa riwayat"
              className="inline-flex items-center rounded-lg bg-slate-100 p-0.5"
            >
              <button
                type="button"
                aria-pressed={filterLang === 'all'}
                onClick={() => setFilterLang('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  filterLang === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  aria-pressed={filterLang === lang.id}
                  onClick={() => setFilterLang(lang.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    filterLang === lang.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang.shortLabel}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {clips.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-slate-700">Belum ada riwayat audio</p>
          <p className="mt-1 text-xs text-slate-500">
            Setiap audio yang Anda hasilkan akan otomatis tersimpan di daftar ini.
          </p>
        </div>
      ) : filteredClips.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-600">Tidak ada audio yang cocok dengan filter pencarian.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {filteredClips.map((clip) => {
            const isActive = clip.id === activeClipId;
            const langLabel =
              LANGUAGE_OPTIONS.find((l) => l.id === clip.language)?.shortLabel ?? clip.language;
            const snippet = clip.text.length > 110 ? `${clip.text.slice(0, 110)}...` : clip.text;
            const shortName = clip.text.slice(0, 28).trim() || clip.voiceId;

            return (
              <li
                key={clip.id}
                className={`flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                  isActive ? 'bg-blue-50/40 -mx-2 px-2 rounded-lg' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">{snippet}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                    <span>{langLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{clip.voiceId}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatDuration(clip.durationSeconds)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatFileSize(clip.fileSizeBytes)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectClip(clip)}
                    aria-label={`Putar rekaman "${shortName}"`}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap min-h-[34px] cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
                      isActive
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                    <span>Putar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDownloadClip(clip)}
                    aria-label={`Unduh WAV untuk "${shortName}"`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap min-h-[34px] cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>WAV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onLoadIntoEditor(clip)}
                    aria-label={`Muat teks "${shortName}" ke editor`}
                    title="Muat teks ke editor"
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors min-h-[34px] min-w-[34px] cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteClip(clip.id)}
                    aria-label={`Hapus rekaman "${shortName}"`}
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors min-h-[34px] min-w-[34px] cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
