import { Check, Loader2, Play, Square } from 'lucide-react';
import {
  PACE_OPTIONS,
  STYLE_PRESETS,
  VOICES,
  type PaceId,
  type StylePresetId,
  type VoiceId,
} from '../utils/ttsConfig';

interface VoiceControlsPanelProps {
  selectedVoice: VoiceId;
  selectedStyle: StylePresetId;
  selectedPace: PaceId;
  customStyle: string;
  previewingVoiceId: VoiceId | null;
  playingPreviewVoiceId: VoiceId | null;
  onVoiceChange: (voiceId: VoiceId) => void;
  onStyleChange: (styleId: StylePresetId) => void;
  onPaceChange: (pace: PaceId) => void;
  onCustomStyleChange: (value: string) => void;
  onPreviewVoice: (voiceId: VoiceId) => void;
}

export function VoiceControlsPanel({
  selectedVoice,
  selectedStyle,
  selectedPace,
  customStyle,
  previewingVoiceId,
  playingPreviewVoiceId,
  onVoiceChange,
  onStyleChange,
  onPaceChange,
  onCustomStyleChange,
  onPreviewVoice,
}: VoiceControlsPanelProps) {
  return (
    <aside
      id="voice-settings"
      aria-labelledby="voice-settings-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6"
    >
      <div>
        <h2
          id="voice-settings-heading"
          className="font-display text-base font-semibold text-slate-900"
        >
          Pengaturan Suara & Gaya
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Pilih karakter vokal dan intonasi bicara yang paling sesuai dengan naskah Anda.
        </p>
      </div>

      {/* Voice Radio Selection */}
      <div>
        <span className="block text-xs font-semibold tracking-wide text-slate-500 mb-2.5">
          Karakter Suara
        </span>
        <div role="radiogroup" aria-label="Pilihan karakter suara" className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isLoadingPreview = previewingVoiceId === voice.id;
            const isPlayingPreview = playingPreviewVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                className={`flex items-start justify-between gap-3 p-3.5 transition-colors ${
                  isSelected ? 'bg-blue-50/60' : 'bg-white hover:bg-slate-50/70'
                }`}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onVoiceChange(voice.id)}
                  className="flex flex-1 items-start gap-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 rounded"
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-slate-900">{voice.name}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs font-medium text-slate-600">{voice.register}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                      {voice.description}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onPreviewVoice(voice.id)}
                  disabled={isLoadingPreview}
                  aria-label={`Dengar contoh suara ${voice.name}`}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[34px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isPlayingPreview
                      ? 'border-blue-200 bg-blue-100 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {isLoadingPreview ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" aria-hidden="true" />
                  ) : isPlayingPreview ? (
                    <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                  ) : (
                    <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                  )}
                  <span>{isPlayingPreview ? 'Stop' : 'Contoh'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Style Preset Selection */}
      <div>
        <label htmlFor="style-preset-select" className="block text-xs font-semibold tracking-wide text-slate-500 mb-2">
          Gaya Penyampaian
        </label>
        <select
          id="style-preset-select"
          value={selectedStyle}
          onChange={(e) => onStyleChange(e.target.value as StylePresetId)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[42px]"
        >
          {STYLE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label} — {preset.description}
            </option>
          ))}
        </select>
      </div>

      {/* Pace Segmented Control */}
      <div>
        <span className="block text-xs font-semibold tracking-wide text-slate-500 mb-2">
          Kecepatan Bicara
        </span>
        <div
          role="group"
          aria-label="Kecepatan bicara"
          className="grid grid-cols-3 rounded-lg bg-slate-100 p-1"
        >
          {PACE_OPTIONS.map((opt) => {
            const active = selectedPace === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => onPaceChange(opt.id)}
                className={`rounded-md py-1.5 text-xs font-medium transition-colors whitespace-nowrap min-h-[34px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Custom Style Prompt */}
      <div>
        <label htmlFor="custom-style-input" className="block text-xs font-semibold tracking-wide text-slate-500 mb-2">
          Instruksi Nada Tambahan (Opsional)
        </label>
        <input
          id="custom-style-input"
          type="text"
          value={customStyle}
          maxLength={160}
          onChange={(e) => onCustomStyleChange(e.target.value)}
          placeholder="Contoh: ramah seperti pemandu wisata, jeda jelas"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 min-h-[40px]"
        />
      </div>
    </aside>
  );
}
