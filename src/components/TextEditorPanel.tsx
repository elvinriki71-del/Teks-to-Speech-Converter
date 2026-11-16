import { AlertCircle, Eraser, Loader2, Volume2 } from 'lucide-react';
import {
  LANGUAGE_OPTIONS,
  MAX_TEXT_LENGTH,
  SAMPLE_SCRIPTS,
  type SampleScript,
  type SpeechLanguage,
  type ValidationResult,
} from '../utils/ttsConfig';
import { formatDuration } from '../utils/wav';

interface TextEditorPanelProps {
  text: string;
  language: SpeechLanguage;
  validation: ValidationResult;
  showValidationError: boolean;
  isGenerating: boolean;
  progressText: string | null;
  apiError: string | null;
  onTextChange: (next: string) => void;
  onLanguageChange: (lang: SpeechLanguage) => void;
  onSelectSample: (sample: SampleScript) => void;
  onClearText: () => void;
  onGenerate: () => void;
}

export function TextEditorPanel({
  text,
  language,
  validation,
  showValidationError,
  isGenerating,
  progressText,
  apiError,
  onTextChange,
  onLanguageChange,
  onSelectSample,
  onClearText,
  onGenerate,
}: TextEditorPanelProps) {
  const activeError = showValidationError && !validation.valid ? validation.error : apiError;

  return (
    <section
      id="studio-editor"
      aria-labelledby="editor-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h1
            id="editor-heading"
            className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 text-balance"
          >
            Konverter Teks ke Suara Natural
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Tulis atau tempel naskah Bahasa Indonesia maupun English, lalu unduh hasilnya dalam format WAV.
          </p>
        </div>

        {/* Language Segmented Control */}
        <div
          role="group"
          aria-label="Bahasa pengucapan"
          className="inline-flex items-center rounded-lg bg-slate-100 p-1 self-start sm:self-auto shrink-0"
        >
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = language === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => onLanguageChange(opt.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[34px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Sample Scripts */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Contoh Naskah:</span>
          {SAMPLE_SCRIPTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample)}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors whitespace-nowrap shrink-0 min-h-[32px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Script Textarea */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="tts-script-input" className="text-sm font-medium text-slate-800">
            Naskah Teks
          </label>
          {text.length > 0 && (
            <button
              type="button"
              onClick={onClearText}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1 px-2 rounded focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Bersihkan</span>
            </button>
          )}
        </div>

        <textarea
          id="tts-script-input"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          rows={7}
          placeholder={
            language === 'en'
              ? 'Type or paste your English script here. Use punctuation like commas and periods for natural pauses...'
              : 'Tulis atau tempel naskah Anda di sini. Gunakan tanda baca koma dan titik agar jeda napas terdengar alami...'
          }
          aria-invalid={Boolean(showValidationError && !validation.valid)}
          aria-describedby={activeError ? 'tts-editor-error' : 'tts-editor-stats'}
          className={`w-full resize-y rounded-lg border bg-white px-4 py-3 text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
            showValidationError && !validation.valid
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-200 focus:border-blue-600 focus:ring-blue-100'
          }`}
        />

        {/* Stats & Inline Error Row */}
        <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            id="tts-editor-stats"
            className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums"
          >
            <span>
              {validation.charCount.toLocaleString('id-ID')} / {MAX_TEXT_LENGTH.toLocaleString('id-ID')} karakter
            </span>
            <span aria-hidden="true">·</span>
            <span>{validation.wordCount.toLocaleString('id-ID')} kata</span>
            <span aria-hidden="true">·</span>
            <span>Estimasi ~{formatDuration(validation.estimatedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 min-h-[44px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>{progressText || 'Menghasilkan Suara...'}</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                <span>Buat Suara Natural</span>
              </>
            )}
          </button>
        </div>

        {activeError && (
          <div
            id="tts-editor-error"
            role="alert"
            className="mt-3 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
          >
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{activeError}</span>
          </div>
        )}
      </div>
    </section>
  );
}
