export interface WavMetadata {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
  dataOffset: number;
  dataSize: number;
  durationSeconds: number;
}

export function decodeBase64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/^data:audio\/[a-z0-9.+-]+;base64,/i, '').trim();
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(clean, 'base64'));
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function parseWavMetadata(wavBytes: Uint8Array): WavMetadata {
  if (wavBytes.length < 44) {
    throw new Error('File audio WAV tidak valid (ukuran kurang dari 44 byte).');
  }

  const view = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength);
  const riff = String.fromCharCode(wavBytes[0], wavBytes[1], wavBytes[2], wavBytes[3]);
  const wave = String.fromCharCode(wavBytes[8], wavBytes[9], wavBytes[10], wavBytes[11]);

  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new Error('Header RIFF/WAVE tidak ditemukan pada data audio.');
  }

  let offset = 12;
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;
  let dataOffset = 44;
  let dataSize = Math.max(0, wavBytes.length - 44);

  while (offset + 8 <= wavBytes.length) {
    const chunkId = String.fromCharCode(
      wavBytes[offset],
      wavBytes[offset + 1],
      wavBytes[offset + 2],
      wavBytes[offset + 3],
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ' && offset + 24 <= wavBytes.length) {
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (chunkId === 'data') {
      dataOffset = offset + 8;
      dataSize = Math.min(chunkSize, wavBytes.length - dataOffset);
      break;
    }

    offset += 8 + chunkSize + (chunkSize % 2);
  }

  const bytesPerSecond = sampleRate * numChannels * (bitsPerSample / 8);
  const durationSeconds = bytesPerSecond > 0 ? dataSize / bytesPerSecond : 0;

  return {
    sampleRate,
    numChannels,
    bitsPerSample,
    dataOffset,
    dataSize,
    durationSeconds,
  };
}

export function concatenateWavBuffers(buffers: Uint8Array[]): Uint8Array {
  if (buffers.length === 0) {
    throw new Error('Tidak ada data audio untuk digabungkan.');
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  const firstMeta = parseWavMetadata(buffers[0]);
  const pcmParts: Uint8Array[] = [];
  let totalDataSize = 0;

  for (const buf of buffers) {
    const meta = parseWavMetadata(buf);
    const pcm = buf.subarray(meta.dataOffset, meta.dataOffset + meta.dataSize);
    pcmParts.push(pcm);
    totalDataSize += pcm.length;
  }

  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);
  const byteRate =
    firstMeta.sampleRate * firstMeta.numChannels * (firstMeta.bitsPerSample / 8);
  const blockAlign = firstMeta.numChannels * (firstMeta.bitsPerSample / 8);

  // RIFF chunk descriptor
  header.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, 36 + totalDataSize, true);
  header.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // fmt sub-chunk
  header.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true); // PCM subchunk size
  view.setUint16(20, 1, true); // AudioFormat = PCM
  view.setUint16(22, firstMeta.numChannels, true);
  view.setUint32(24, firstMeta.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, firstMeta.bitsPerSample, true);

  // data sub-chunk
  header.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, totalDataSize, true);

  const combined = new Uint8Array(44 + totalDataSize);
  combined.set(header, 0);
  let writeOffset = 44;
  for (const part of pcmParts) {
    combined.set(part, writeOffset);
    writeOffset += part.length;
  }

  return combined;
}

export function extractWaveformPeaks(wavBytes: Uint8Array, barCount = 64): number[] {
  if (barCount <= 0) return [];
  const meta = parseWavMetadata(wavBytes);
  const sampleCount = Math.floor(meta.dataSize / 2);

  if (sampleCount === 0) {
    return Array.from({ length: barCount }, () => 0.12);
  }

  const view = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength);
  const samplesPerBar = Math.max(1, Math.floor(sampleCount / barCount));
  const rawPeaks: number[] = [];
  let maxPeak = 0;

  for (let bar = 0; bar < barCount; bar++) {
    const startSample = bar * samplesPerBar;
    const endSample =
      bar === barCount - 1
        ? sampleCount
        : Math.min(sampleCount, startSample + samplesPerBar);

    let peak = 0;
    const step = Math.max(1, Math.floor((endSample - startSample) / 60));
    for (let i = startSample; i < endSample; i += step) {
      const bytePos = meta.dataOffset + i * 2;
      if (bytePos + 2 <= wavBytes.length) {
        const sample = Math.abs(view.getInt16(bytePos, true)) / 32768;
        if (sample > peak) peak = sample;
      }
    }

    rawPeaks.push(peak);
    if (peak > maxPeak) maxPeak = peak;
  }

  const normalizer = maxPeak > 0.05 ? maxPeak : 1;
  return rawPeaks.map((p) => {
    const normalized = p / normalizer;
    return Number(Math.max(0.1, Math.min(1, normalized)).toFixed(3));
  });
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const rounded = Math.round(seconds);
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
