import {
  buildSpeechStylePrompt,
  splitTextIntoChunks,
  type PaceId,
  type SpeechLanguage,
  type StylePresetId,
  type VoiceId,
} from '../utils/ttsConfig';
import {
  concatenateWavBuffers,
  decodeBase64ToBytes,
  extractWaveformPeaks,
  parseWavMetadata,
} from '../utils/wav';
import type { StoredAudioClip } from '../utils/audioStorage';

export interface SynthesizeRequest {
  text: string;
  language: SpeechLanguage;
  voiceId: VoiceId;
  styleId: StylePresetId;
  pace: PaceId;
  customStyle?: string;
  onProgress?: (completed: number, total: number) => void;
  signal?: AbortSignal;
}

async function requestChunkTts(
  chunkText: string,
  voiceId: VoiceId,
  stylePrompt: string,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: chunkText,
      voiceName: voiceId,
      stylePrompt,
    }),
    signal,
  });

  const payload = (await res.json().catch(() => ({}))) as {
    audioBase64?: string;
    error?: string;
  };

  if (!res.ok || !payload.audioBase64) {
    throw new Error(payload.error || `Gagal menghasilkan suara (HTTP ${res.status}).`);
  }

  return decodeBase64ToBytes(payload.audioBase64);
}

export async function synthesizeSpeech(req: SynthesizeRequest): Promise<StoredAudioClip> {
  const chunks = splitTextIntoChunks(req.text);
  if (chunks.length === 0) {
    throw new Error('Teks tidak boleh kosong.');
  }

  const stylePrompt = buildSpeechStylePrompt({
    language: req.language,
    styleId: req.styleId,
    pace: req.pace,
    customStyle: req.customStyle,
  });

  const wavBuffers: Uint8Array[] = [];
  for (let i = 0; i < chunks.length; i++) {
    req.onProgress?.(i, chunks.length);
    const wavChunk = await requestChunkTts(chunks[i], req.voiceId, stylePrompt, req.signal);
    wavBuffers.push(wavChunk);
  }
  req.onProgress?.(chunks.length, chunks.length);

  const mergedWav = concatenateWavBuffers(wavBuffers);
  const metadata = parseWavMetadata(mergedWav);
  const peaks = extractWaveformPeaks(mergedWav, 64);

  const exactBuffer = new ArrayBuffer(mergedWav.byteLength);
  new Uint8Array(exactBuffer).set(mergedWav);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: req.text.trim(),
    language: req.language,
    voiceId: req.voiceId,
    styleId: req.styleId,
    pace: req.pace,
    customStyle: req.customStyle?.trim() || undefined,
    durationSeconds: metadata.durationSeconds,
    fileSizeBytes: mergedWav.byteLength,
    sampleRate: metadata.sampleRate,
    peaks,
    wavBytes: exactBuffer,
    createdAt: Date.now(),
  };
}

export function triggerWavDownload(clip: StoredAudioClip, filename: string): void {
  const blob = new Blob([clip.wavBytes], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
