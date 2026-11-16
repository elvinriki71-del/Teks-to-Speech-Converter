import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_VOICES = new Set(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr']);
const MAX_CHUNK_CHARS = 2500;

function getGeminiClient(apiVersion: 'v1beta' | 'v1alpha' = 'v1beta'): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi pada server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('DEADLINE_EXCEEDED');
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}

function mapGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return {
      status: 403,
      message: 'API key Gemini tidak valid atau belum memiliki akses. Periksa konfigurasi di Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429')) {
    return {
      status: 429,
      message: 'Batas permintaan sementara tercapai. Tunggu beberapa saat lalu coba lagi.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 404,
      message: 'Model TTS tidak ditemukan atau tidak tersedia saat ini.',
    };
  }
  return {
    status: 500,
    message: raw || 'Terjadi kesalahan saat menghasilkan audio.',
  };
}

async function callTtsModel(text: string, voiceName: string, stylePrompt: string) {
  const makeRequest = async (apiVersion: 'v1beta' | 'v1alpha', includeSpeechMetadata: boolean) => {
    const ai = getGeminiClient(apiVersion);
    return ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            includeSpeechMetadata
              ? {
                  text,
                  speechMetadata: {
                    style: stylePrompt,
                  },
                }
              : {
                  text: `Style: ${stylePrompt}\n\n${text}`,
                },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });
  };

  try {
    return await generateWithRetry(() => makeRequest('v1beta', true));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Unknown name "speechMetadata"') || msg.includes('Cannot find field')) {
      try {
        return await generateWithRetry(() => makeRequest('v1alpha', true));
      } catch (alphaErr) {
        const alphaMsg = alphaErr instanceof Error ? alphaErr.message : String(alphaErr);
        if (alphaMsg.includes('Unknown name "speechMetadata"')) {
          return await generateWithRetry(() => makeRequest('v1beta', false));
        }
        throw alphaErr;
      }
    }
    throw err;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/tts', async (req, res) => {
    try {
      const body = req.body as {
        text?: unknown;
        voiceName?: unknown;
        stylePrompt?: unknown;
      };

      const text = typeof body.text === 'string' ? body.text.trim() : '';
      const voiceName = typeof body.voiceName === 'string' ? body.voiceName.trim() : 'Kore';
      const stylePrompt =
        typeof body.stylePrompt === 'string' && body.stylePrompt.trim()
          ? body.stylePrompt.trim()
          : 'Natural, clear speech with authentic pronunciation and smooth phrasing.';

      if (!text) {
        res.status(400).json({ error: 'Teks tidak boleh kosong.' });
        return;
      }

      if (text.length > MAX_CHUNK_CHARS) {
        res.status(400).json({
          error: `Potongan teks melebihi batas ${MAX_CHUNK_CHARS} karakter.`,
        });
        return;
      }

      if (!ALLOWED_VOICES.has(voiceName)) {
        res.status(400).json({ error: `Pilihan suara "${voiceName}" tidak valid.` });
        return;
      }

      const response = await callTtsModel(text, voiceName, stylePrompt);

      const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      const base64Audio = inlineData?.data;

      if (!base64Audio) {
        res.status(502).json({
          error: 'Server suara tidak mengembalikan data audio. Silakan coba ubah teks atau ulangi.',
        });
        return;
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: inlineData?.mimeType || 'audio/wav',
        voiceName,
      });
    } catch (err) {
      const mapped = mapGeminiError(err);
      res.status(mapped.status).json({ error: mapped.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`SuaraStudio server running at http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
