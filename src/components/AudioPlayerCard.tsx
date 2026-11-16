import { Download, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { StoredAudioClip } from '../utils/audioStorage';
import {
  buildDownloadFilename,
  LANGUAGE_OPTIONS,
  STYLE_PRESETS,
} from '../utils/ttsConfig';
import { formatDuration, formatFileSize } from '../utils/wav';

interface AudioPlayerCardProps {
  clip: StoredAudioClip | null;
  isGenerating: boolean;
  autoPlaySignal: number;
  onDownload: (clip: StoredAudioClip) => void;
}

const SPEED_OPTIONS = [0.85, 1, 1.15, 1.25] as const;

export function AudioPlayerCard({
  clip,
  isGenerating,
  autoPlaySignal,
  onDownload,
}: AudioPlayerCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  const objectUrl = useMemo(() => {
    if (!clip) return null;
    const blob = new Blob([clip.wavBytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }, [clip]);

  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(clip?.durationSeconds ?? 0);
  }, [clip]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !objectUrl || autoPlaySignal === 0) return;

    audio.playbackRate = playbackRate;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Ignore browser autoplay policy rejection on programmatic start
      });
    }
  }, [autoPlaySignal, objectUrl, playbackRate]);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.playbackRate = playbackRate;
      void audio.play();
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.playbackRate = playbackRate;
    void audio.play();
  };

  const handleSeek = (nextTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  if (isGenerating && !clip) {
    return (
      <section
        aria-label="Pemutar audio hasil"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="h-4 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-16 w-full rounded-lg bg-slate-100" />
          <div className="flex items-center justify-between">
            <div className="h-10 w-36 rounded-lg bg-slate-200" />
            <div className="h-10 w-36 rounded-lg bg-slate-200" />
          </div>
        </div>
      </section>
    );
  }

  if (!clip || !objectUrl) {
    return (
      <section
        aria-label="Pemutar audio hasil"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center"
      >
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-3 font-display text-base font-semibold text-slate-900">
          Audio Siap Diputar & Diunduh di Sini
        </h2>
        <p className="mt-1 mx-auto max-w-md text-sm text-slate-500">
          Masukkan teks Bahasa Indonesia atau English di atas, pilih suara yang Anda suka, lalu klik{' '}
          <span className="font-medium text-slate-700">Buat Suara Natural</span>.
        </p>
      </section>
    );
  }

  const totalDuration = duration > 0 ? duration : clip.durationSeconds;
  const progressRatio = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;
  const languageLabel =
    LANGUAGE_OPTIONS.find((l) => l.id === clip.language)?.label ?? clip.language;
  const styleLabel =
    STYLE_PRESETS.find((s) => s.id === clip.styleId)?.label ?? clip.styleId;
  const downloadFilename = buildDownloadFilename(clip.text, clip.language, clip.voiceId);

  return (
    <section
      aria-label="Pemutar audio hasil"
      data-testid="active-audio-player"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <audio
        ref={audioRef}
        src={objectUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(totalDuration);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
            setDuration(e.currentTarget.duration);
          }
        }}
      />

      {/* Header Metadata (Unboxed with middot separators) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Hasil Audio Siap Unduh
          </h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span>{languageLabel}</span>
            <span aria-hidden="true">·</span>
            <span>Suara {clip.voiceId}</span>
            <span aria-hidden="true">·</span>
            <span>{styleLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {Math.round(clip.sampleRate / 1000)} kHz WAV
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{formatFileSize(clip.fileSizeBytes)}</span>
          </div>
        </div>

        <div className="font-mono text-xs font-medium text-slate-700 tabular-nums shrink-0">
          {formatDuration(currentTime)} / {formatDuration(totalDuration)}
        </div>
      </div>

      {/* Interactive Waveform Scrubber */}
      <div className="relative mt-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3">
        <div
          className="flex h-14 items-center gap-[3px]"
          aria-hidden="true"
        >
          {clip.peaks.map((peak, index) => {
            const barProgress = (index + 0.5) / clip.peaks.length;
            const isPlayed = barProgress <= progressRatio;
            const heightPercent = Math.max(14, Math.round(peak * 100));
            return (
              <div
                key={index}
                className={`flex-1 rounded-full transition-colors ${
                  isPlayed ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                style={{ height: `${heightPercent}%` }}
              />
            );
          })}
        </div>

        <input
          type="range"
          min={0}
          max={totalDuration || 1}
          step={0.05}
          value={Math.min(currentTime, totalDuration || 1)}
          onChange={(e) => handleSeek(Number(e.target.value))}
          aria-label="Posisi pemutaran audio"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      {/* Controls Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 active:bg-slate-950 transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Jeda</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Putar Audio</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            aria-label="Ulangi pemutaran dari awal"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors min-h-[40px] min-w-[40px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          </button>

          <div
            role="group"
            aria-label="Kecepatan pemutaran"
            className="hidden sm:inline-flex items-center rounded-lg bg-slate-100 p-1 ml-1"
          >
            {SPEED_OPTIONS.map((spd) => {
              const active = playbackRate === spd;
              return (
                <button
                  key={spd}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleSpeedChange(spd)}
                  className={`rounded-md px-2 py-1 font-mono text-xs font-medium tabular-nums transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {spd}x
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDownload(clip)}
          aria-label={`Unduh file audio ${downloadFilename}`}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 active:bg-blue-200 transition-colors whitespace-nowrap shrink-0 min-h-[40px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>Unduh WAV</span>
        </button>
      </div>
    </section>
  );
}
