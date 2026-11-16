import type { PaceId, SpeechLanguage, StylePresetId, VoiceId } from './ttsConfig';

export interface StoredAudioClip {
  id: string;
  text: string;
  language: SpeechLanguage;
  voiceId: VoiceId;
  styleId: StylePresetId;
  pace: PaceId;
  customStyle?: string;
  durationSeconds: number;
  fileSizeBytes: number;
  sampleRate: number;
  peaks: number[];
  wavBytes: ArrayBuffer;
  createdAt: number;
}

const DB_NAME = 'suarastudio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_clips';
const MAX_STORED_CLIPS = 30;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function loadStoredClips(): Promise<StoredAudioClip[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as StoredAudioClip[]) ?? [];
        items.sort((a, b) => b.createdAt - a.createdAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error ?? new Error('Failed to read clips'));
    });
  } catch {
    return [];
  }
}

export async function saveStoredClip(clip: StoredAudioClip): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(clip);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to save clip'));
    });

    // Keep storage tidy at MAX_STORED_CLIPS
    const all = await loadStoredClips();
    if (all.length > MAX_STORED_CLIPS) {
      const toRemove = all.slice(MAX_STORED_CLIPS);
      await Promise.all(toRemove.map((item) => deleteStoredClip(item.id)));
    }
  } catch {
    // Graceful no-op when storage is unavailable
  }
}

export async function deleteStoredClip(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to delete clip'));
    });
  } catch {
    // Graceful no-op
  }
}
