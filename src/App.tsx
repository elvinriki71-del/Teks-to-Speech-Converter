import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioHistoryList } from './components/AudioHistoryList';
import { AudioPlayerCard } from './components/AudioPlayerCard';
import { Header } from './components/Header';
import { TextEditorPanel } from './components/TextEditorPanel';
import { VoiceControlsPanel } from './components/VoiceControlsPanel';
import { synthesizeSpeech, triggerWavDownload } from './services/ttsClient';
import {
  deleteStoredClip,
  loadStoredClips,
  saveStoredClip,
  type StoredAudioClip,
} from './utils/audioStorage';
import {
  buildDownloadFilename,
  SAMPLE_SCRIPTS,
  validateTtsInput,
  VOICES,
  type PaceId,
  type SampleScript,
  type SpeechLanguage,
  type StylePresetId,
  type VoiceId,
} from './utils/ttsConfig';

export default function App() {
  const [text, setText] = useState<string>(SAMPLE_SCRIPTS[0].text);
  const [language, setLanguage] = useState<SpeechLanguage>(SAMPLE_SCRIPTS[0].language);
  const [voiceId, setVoiceId] = useState<VoiceId>(SAMPLE_SCRIPTS[0].voiceId);
  const [styleId, setStyleId] = useState<StylePresetId>(SAMPLE_SCRIPTS[0].styleId);
  const [pace, setPace] = useState<PaceId>('normal');
  const [customStyle, setCustomStyle] = useState<string>('');

  const [showValidationError, setShowValidationError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [history, setHistory] = useState<StoredAudioClip[]>([]);
  const [activeClip, setActiveClip] = useState<StoredAudioClip | null>(null);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);

  // Voice preview state & in-memory cache
  const [previewingVoiceId, setPreviewingVoiceId] = useState<VoiceId | null>(null);
  const [playingPreviewVoiceId, setPlayingPreviewVoiceId] = useState<VoiceId | null>(null);
  const previewCacheRef = useRef<Map<string, ArrayBuffer>>(new Map());
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const validation = useMemo(() => validateTtsInput(text), [text]);

  useEffect(() => {
    let mounted = true;
    loadStoredClips().then((items) => {
      if (!mounted) return;
      setHistory(items);
      if (items.length > 0) {
        setActiveClip((prev) => prev ?? items[0]);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const stopPreviewAudio = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPlayingPreviewVoiceId(null);
  }, []);

  useEffect(() => {
    return () => {
      stopPreviewAudio();
    };
  }, [stopPreviewAudio]);

  const handleTextChange = (next: string) => {
    setText(next);
    if (showValidationError && validateTtsInput(next).valid) {
      setShowValidationError(false);
    }
    if (apiError) setApiError(null);
  };

  const handleSelectSample = (sample: SampleScript) => {
    setText(sample.text);
    setLanguage(sample.language);
    setVoiceId(sample.voiceId);
    setStyleId(sample.styleId);
    setShowValidationError(false);
    setApiError(null);
  };

  const handleNewScript = () => {
    setText('');
    setCustomStyle('');
    setShowValidationError(false);
    setApiError(null);
    const textarea = document.getElementById('tts-script-input');
    if (textarea) textarea.focus();
  };

  const handleGenerate = async () => {
    if (!validation.valid) {
      setShowValidationError(true);
      return;
    }

    stopPreviewAudio();
    setShowValidationError(false);
    setApiError(null);
    setIsGenerating(true);
    setProgressText('Menghasilkan suara...');

    try {
      const clip = await synthesizeSpeech({
        text,
        language,
        voiceId,
        styleId,
        pace,
        customStyle,
        onProgress: (completed, total) => {
          if (total > 1) {
            setProgressText(`Memproses bagian ${Math.min(completed + 1, total)} dari ${total}...`);
          } else {
            setProgressText('Menghasilkan suara...');
          }
        },
      });

      await saveStoredClip(clip);
      setHistory((prev) => [clip, ...prev.filter((item) => item.id !== clip.id)]);
      setActiveClip(clip);
      setAutoPlaySignal((n) => n + 1);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal menghasilkan audio. Silakan coba lagi.';
      setApiError(message);
    } finally {
      setIsGenerating(false);
      setProgressText(null);
    }
  };

  const handlePreviewVoice = async (targetVoiceId: VoiceId) => {
    if (playingPreviewVoiceId === targetVoiceId) {
      stopPreviewAudio();
      return;
    }

    stopPreviewAudio();
    setApiError(null);

    const cacheKey = `${targetVoiceId}-${language}`;
    const playBuffer = (buffer: ArrayBuffer) => {
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      const audio = new Audio(url);
      previewAudioRef.current = audio;
      setPlayingPreviewVoiceId(targetVoiceId);
      audio.onended = () => stopPreviewAudio();
      audio.onerror = () => stopPreviewAudio();
      audio.play().catch(() => stopPreviewAudio());
    };

    const cached = previewCacheRef.current.get(cacheKey);
    if (cached) {
      playBuffer(cached);
      return;
    }

    const voiceObj = VOICES.find((v) => v.id === targetVoiceId) ?? VOICES[0];
    setPreviewingVoiceId(targetVoiceId);

    try {
      const clip = await synthesizeSpeech({
        text: voiceObj.sampleText[language],
        language,
        voiceId: targetVoiceId,
        styleId: 'natural',
        pace: 'normal',
      });
      previewCacheRef.current.set(cacheKey, clip.wavBytes);
      playBuffer(clip.wavBytes);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Gagal memutar contoh suara.';
      setApiError(message);
    } finally {
      setPreviewingVoiceId(null);
    }
  };

  const handleDownloadClip = (clip: StoredAudioClip) => {
    const filename = buildDownloadFilename(clip.text, clip.language, clip.voiceId);
    triggerWavDownload(clip, filename);
  };

  const handleSelectClip = (clip: StoredAudioClip) => {
    stopPreviewAudio();
    setActiveClip(clip);
    setAutoPlaySignal((n) => n + 1);
  };

  const handleLoadIntoEditor = (clip: StoredAudioClip) => {
    setText(clip.text);
    setLanguage(clip.language);
    setVoiceId(clip.voiceId);
    setStyleId(clip.styleId);
    setPace(clip.pace);
    setCustomStyle(clip.customStyle ?? '');
    setShowValidationError(false);
    setApiError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClip = async (id: string) => {
    await deleteStoredClip(id);
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (activeClip?.id === id) {
        setActiveClip(next[0] ?? null);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header onNewScript={handleNewScript} historyCount={history.length} />

      <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Primary Studio Column */}
          <div className="lg:col-span-8 space-y-6">
            <TextEditorPanel
              text={text}
              language={language}
              validation={validation}
              showValidationError={showValidationError}
              isGenerating={isGenerating}
              progressText={progressText}
              apiError={apiError}
              onTextChange={handleTextChange}
              onLanguageChange={setLanguage}
              onSelectSample={handleSelectSample}
              onClearText={handleNewScript}
              onGenerate={handleGenerate}
            />

            <AudioPlayerCard
              clip={activeClip}
              isGenerating={isGenerating}
              autoPlaySignal={autoPlaySignal}
              onDownload={handleDownloadClip}
            />

            <AudioHistoryList
              clips={history}
              activeClipId={activeClip?.id ?? null}
              onSelectClip={handleSelectClip}
              onDownloadClip={handleDownloadClip}
              onLoadIntoEditor={handleLoadIntoEditor}
              onDeleteClip={handleDeleteClip}
            />
          </div>

          {/* Voice & Style Configuration Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-20">
            <VoiceControlsPanel
              selectedVoice={voiceId}
              selectedStyle={styleId}
              selectedPace={pace}
              customStyle={customStyle}
              previewingVoiceId={previewingVoiceId}
              playingPreviewVoiceId={playingPreviewVoiceId}
              onVoiceChange={setVoiceId}
              onStyleChange={setStyleId}
              onPaceChange={setPace}
              onCustomStyleChange={setCustomStyle}
              onPreviewVoice={handlePreviewVoice}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>SuaraStudio · Konversi Teks ke Suara Bahasa Indonesia & English</span>
          <span>Format Output: WAV 24 kHz 16-bit PCM</span>
        </div>
      </footer>
    </div>
  );
}
