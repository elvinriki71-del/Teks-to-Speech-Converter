export type SpeechLanguage = 'id' | 'en' | 'bilingual';

export type VoiceId = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export type StylePresetId =
  | 'natural'
  | 'news'
  | 'narration'
  | 'energetic'
  | 'calm';

export type PaceId = 'slow' | 'normal' | 'fast';

export interface VoiceOption {
  id: VoiceId;
  name: string;
  register: string;
  description: string;
  bestFor: string;
  sampleText: Record<SpeechLanguage, string>;
}

export interface StylePreset {
  id: StylePresetId;
  label: string;
  description: string;
  promptCue: string;
}

export interface SampleScript {
  id: string;
  title: string;
  language: SpeechLanguage;
  voiceId: VoiceId;
  styleId: StylePresetId;
  text: string;
}

export const MAX_TEXT_LENGTH = 5000;
export const CHUNK_TEXT_LENGTH = 1200;

export const VOICES: readonly VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore',
    register: 'Hangat & Artikulasi Jelas',
    description: 'Suara wanita yang natural, seimbang, dan nyaman didengar untuk durasi panjang.',
    bestFor: 'Narasi, edukasi, asisten suara',
    sampleText: {
      id: 'Halo, saya Kore. Selamat datang di SuaraStudio, tempat mengubah tulisan Anda menjadi suara yang jernih dan alami.',
      en: 'Hello, I am Kore. Welcome to SuaraStudio, where your written script becomes clear and natural speech.',
      bilingual: 'Halo, saya Kore. Today we are testing natural bilingual Indonesian and English pronunciation.',
    },
  },
  {
    id: 'Puck',
    name: 'Puck',
    register: 'Cerah & Ekspresif',
    description: 'Suara penuh energi dengan intonasi dinamis dan ritme bicara yang hidup.',
    bestFor: 'Konten video, podcast, promosi',
    sampleText: {
      id: 'Hai semuanya! Saya Puck. Mari buat presentasi dan konten video Anda terdengar lebih hidup dan menarik.',
      en: 'Hey everyone! I am Puck. Let us make your videos and presentations sound lively and engaging.',
      bilingual: 'Hai semua! I am Puck, ready to bring bright energy to your bilingual content.',
    },
  },
  {
    id: 'Charon',
    name: 'Charon',
    register: 'Berat & Berwibawa',
    description: 'Suara pria bernada rendah dengan wibawa tenang dan penekanan kata yang mantap.',
    bestFor: 'Dokumenter, berita utama, profil perusahaan',
    sampleText: {
      id: 'Selamat malam. Saya Charon, siap membacakan laporan utama dan narasi dokumenter dengan artikulasi yang tegas.',
      en: 'Good evening. I am Charon, ready to deliver your news briefing and documentary narration with clarity.',
      bilingual: 'Selamat malam. I am Charon, bringing calm authority to Indonesian and English narration.',
    },
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    register: 'Tegas & Modern',
    description: 'Suara pria berkarakter modern dengan kejelasan konsonan yang tajam dan lugas.',
    bestFor: 'Tutorial produk, ringkasan bisnis, pengumuman',
    sampleText: {
      id: 'Halo, saya Fenrir. Setiap kata akan disampaikan secara lugas, modern, dan mudah dipahami oleh pendengar.',
      en: 'Hi there, I am Fenrir. Every sentence is delivered with crisp precision and a modern conversational flow.',
      bilingual: 'Halo, saya Fenrir. Let us walk through your product update clearly and concisely.',
    },
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    register: 'Lembut & Menenangkan',
    description: 'Suara ringan dengan alunan napas alami dan tempo bicara yang menenangkan.',
    bestFor: 'Cerita pendek, meditasi, bacaan santai',
    sampleText: {
      id: 'Tarik napas perlahan. Saya Zephyr, siap menemani cerita dan bacaan santai Anda dengan suara yang lembut.',
      en: 'Take a slow breath. I am Zephyr, here to bring a gentle, unhurried warmth to your storytelling.',
      bilingual: 'Tarik napas sejenak. I am Zephyr, bringing a calm and gentle tone to your words.',
    },
  },
];

export const STYLE_PRESETS: readonly StylePreset[] = [
  {
    id: 'natural',
    label: 'Percakapan Natural',
    description: 'Intonasi alami seperti berbicara langsung',
    promptCue: 'Natural, authentic everyday conversational tone with realistic breathing and smooth phrasing',
  },
  {
    id: 'news',
    label: 'Penyiar Berita',
    description: 'Lugas, formal, dan artikulasi presisi',
    promptCue: 'Clear, poised broadcast news anchor delivery with crisp diction and steady pacing',
  },
  {
    id: 'narration',
    label: 'Narator Cerita',
    description: 'Hangat dan mengalir untuk audiobook',
    promptCue: 'Warm, engaging audiobook storyteller with expressive pauses and smooth cadence',
  },
  {
    id: 'energetic',
    label: 'Presentasi & Promo',
    description: 'Antusias, meyakinkan, dan bersemangat',
    promptCue: 'Upbeat, confident, and enthusiastic presenter tone with bright vocal emphasis',
  },
  {
    id: 'calm',
    label: 'Tenang & Santai',
    description: 'Lembut, perlahan, dan menenangkan',
    promptCue: 'Soft, gentle, soothing and unhurried voice with relaxed warmth',
  },
];

export const PACE_OPTIONS: readonly { id: PaceId; label: string; cue: string }[] = [
  { id: 'slow', label: 'Santai', cue: 'measured, unhurried pace' },
  { id: 'normal', label: 'Normal', cue: 'natural balanced pace' },
  { id: 'fast', label: 'Cepat', cue: 'brisk, lively pace' },
];

export const LANGUAGE_OPTIONS: readonly { id: SpeechLanguage; label: string; shortLabel: string }[] = [
  { id: 'id', label: 'Bahasa Indonesia', shortLabel: 'Indonesia' },
  { id: 'en', label: 'English', shortLabel: 'English' },
  { id: 'bilingual', label: 'Campuran ID & EN', shortLabel: 'ID + EN' },
];

export const SAMPLE_SCRIPTS: readonly SampleScript[] = [
  {
    id: 'id-podcast',
    title: 'Pembuka Podcast (ID)',
    language: 'id',
    voiceId: 'Kore',
    styleId: 'natural',
    text: 'Selamat pagi teman-teman! Di episode kali ini, kita akan membahas bagaimana kebiasaan membaca lima belas menit setiap pagi bisa mengubah cara kita mengambil keputusan sepanjang hari. Yuk, siapkan kopi hangatmu dan kita mulai obrolannya.',
  },
  {
    id: 'id-news',
    title: 'Berita Teknologi (ID)',
    language: 'id',
    voiceId: 'Charon',
    styleId: 'news',
    text: 'Laporan teknologi hari ini menyoroti semakin luasnya pemanfaatan sintesis suara alami di sektor pendidikan dan aksesibilitas digital. Para pengembang kini dapat menghadirkan narasi berbahasa Indonesia yang fasih hanya dalam hitungan detik.',
  },
  {
    id: 'en-story',
    title: 'Storytelling (EN)',
    language: 'en',
    voiceId: 'Zephyr',
    styleId: 'narration',
    text: 'By the time the morning train pulled into the coastal station, the fog had already begun to lift over the harbor. Small fishing boats rocked gently against the wooden pier, while the distant lighthouse blinked one last farewell to the night.',
  },
  {
    id: 'en-product',
    title: 'Product Launch (EN)',
    language: 'en',
    voiceId: 'Puck',
    styleId: 'energetic',
    text: 'Introducing a smarter way to bring your ideas to life! Whether you are creating a tutorial, recording a voiceover, or sharing a daily briefing, crystal-clear natural audio is now just one click away.',
  },
  {
    id: 'bilingual-brief',
    title: 'Presentasi Bilingual (ID/EN)',
    language: 'bilingual',
    voiceId: 'Fenrir',
    styleId: 'natural',
    text: 'Selamat datang di sesi product review kuartal ini. Today we are focusing on two key milestones: peningkatan pengalaman pengguna di aplikasi mobile, and our roadmap for cross-regional expansion.',
  },
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  charCount: number;
  wordCount: number;
  estimatedSeconds: number;
}

export function validateTtsInput(rawText: string): ValidationResult {
  const trimmed = rawText.trim();
  const charCount = rawText.length;
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const estimatedSeconds = wordCount > 0 ? Math.max(1, Math.round((wordCount / 145) * 60)) : 0;

  if (!trimmed) {
    return {
      valid: false,
      error: 'Masukkan teks terlebih dahulu sebelum membuat audio.',
      charCount,
      wordCount,
      estimatedSeconds,
    };
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `Teks terlalu panjang (${trimmed.length} karakter). Maksimal ${MAX_TEXT_LENGTH} karakter per proses.`,
      charCount,
      wordCount,
      estimatedSeconds,
    };
  }

  return {
    valid: true,
    charCount,
    wordCount,
    estimatedSeconds,
  };
}

export function buildSpeechStylePrompt(params: {
  language: SpeechLanguage;
  styleId: StylePresetId;
  pace: PaceId;
  customStyle?: string;
}): string {
  const stylePreset = STYLE_PRESETS.find((s) => s.id === params.styleId) ?? STYLE_PRESETS[0];
  const paceOption = PACE_OPTIONS.find((p) => p.id === params.pace) ?? PACE_OPTIONS[1];

  let languageInstruction = '';
  if (params.language === 'id') {
    languageInstruction =
      'Native Indonesian speaker with authentic Indonesian pronunciation, natural syllable stress, and fluent intonation.';
  } else if (params.language === 'en') {
    languageInstruction =
      'Native English speaker with clear pronunciation, natural prosody, and fluent intonation.';
  } else {
    languageInstruction =
      'Fluent bilingual Indonesian and English speaker, switching seamlessly between natural Indonesian and English pronunciation.';
  }

  const customNote = params.customStyle?.trim();
  const segments = [languageInstruction, stylePreset.promptCue, paceOption.cue];
  if (customNote) {
    segments.push(customNote);
  }

  return segments.join(' ');
}

export function splitTextIntoChunks(text: string, maxChunkLength = CHUNK_TEXT_LENGTH): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  if (cleaned.length <= maxChunkLength) return [cleaned];

  const paragraphs = cleaned.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) {
      chunks.push(current.trim());
      current = '';
    }
  };

  for (const para of paragraphs) {
    if (para.length <= maxChunkLength) {
      if ((current ? current.length + 1 : 0) + para.length <= maxChunkLength) {
        current = current ? `${current}\n${para}` : para;
      } else {
        pushCurrent();
        current = para;
      }
      continue;
    }

    pushCurrent();
    // Split oversized paragraph by sentence boundaries
    const sentences = para.match(/[^.!?]+[.!?]*\s*/g) ?? [para];
    let sentenceAcc = '';

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;

      if (s.length > maxChunkLength) {
        if (sentenceAcc) {
          chunks.push(sentenceAcc.trim());
          sentenceAcc = '';
        }
        // Fallback word-level split
        const words = s.split(/\s+/);
        let wordAcc = '';
        for (const word of words) {
          if ((wordAcc ? wordAcc.length + 1 : 0) + word.length <= maxChunkLength) {
            wordAcc = wordAcc ? `${wordAcc} ${word}` : word;
          } else {
            if (wordAcc) chunks.push(wordAcc);
            wordAcc = word.length > maxChunkLength ? word.slice(0, maxChunkLength) : word;
          }
        }
        if (wordAcc) chunks.push(wordAcc);
      } else if ((sentenceAcc ? sentenceAcc.length + 1 : 0) + s.length <= maxChunkLength) {
        sentenceAcc = sentenceAcc ? `${sentenceAcc} ${s}` : s;
      } else {
        if (sentenceAcc) chunks.push(sentenceAcc.trim());
        sentenceAcc = s;
      }
    }

    if (sentenceAcc) {
      chunks.push(sentenceAcc.trim());
    }
  }

  pushCurrent();
  return chunks;
}

export function buildDownloadFilename(
  text: string,
  language: SpeechLanguage,
  voiceId: VoiceId,
): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32)
    .replace(/^-|-$/g, '');

  const prefix = `suarastudio-${language}-${voiceId.toLowerCase()}`;
  return `${slug ? `${prefix}-${slug}` : prefix}.wav`;
}
