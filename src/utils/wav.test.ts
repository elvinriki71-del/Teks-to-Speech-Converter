import test from 'node:test';
import assert from 'node:assert/strict';
import {
  concatenateWavBuffers,
  extractWaveformPeaks,
  formatDuration,
  formatFileSize,
  parseWavMetadata,
} from './wav';

function makeTestWav(samples: number[], sampleRate = 24000): Uint8Array {
  const dataSize = samples.length * 2;
  const buf = new Uint8Array(44 + dataSize);
  const view = new DataView(buf.buffer);

  buf.set([0x52, 0x49, 0x46, 0x46], 0); // RIFF
  view.setUint32(4, 36 + dataSize, true);
  buf.set([0x57, 0x41, 0x56, 0x45], 8); // WAVE
  buf.set([0x66, 0x6d, 0x74, 0x20], 12); // fmt
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  buf.set([0x64, 0x61, 0x74, 0x61], 36); // data
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }
  return buf;
}

test('parseWavMetadata accurately reads sample rate, channels, dataSize, and duration', () => {
  // 24000 samples at 24kHz = exactly 1.0 second
  const wav = makeTestWav(new Array(24000).fill(5000), 24000);
  const meta = parseWavMetadata(wav);

  assert.equal(meta.sampleRate, 24000);
  assert.equal(meta.numChannels, 1);
  assert.equal(meta.bitsPerSample, 16);
  assert.equal(meta.dataOffset, 44);
  assert.equal(meta.dataSize, 48000);
  assert.equal(meta.durationSeconds, 1);
});

test('concatenateWavBuffers strips headers after first clip and updates RIFF/data sizes', () => {
  const clip1 = makeTestWav([1000, 2000, 3000], 24000);
  const clip2 = makeTestWav([4000, 5000], 24000);
  const merged = concatenateWavBuffers([clip1, clip2]);

  const meta = parseWavMetadata(merged);
  assert.equal(meta.dataSize, 10); // 5 samples * 2 bytes
  assert.equal(merged.length, 44 + 10);

  const view = new DataView(merged.buffer);
  assert.equal(view.getInt16(44, true), 1000);
  assert.equal(view.getInt16(50, true), 4000);
  assert.equal(view.getInt16(52, true), 5000);
});

test('extractWaveformPeaks returns requested bar count bounded between 0.1 and 1.0', () => {
  const samples = Array.from({ length: 1200 }, (_, i) => (i < 600 ? 30000 : 3000));
  const wav = makeTestWav(samples, 24000);
  const peaks = extractWaveformPeaks(wav, 12);

  assert.equal(peaks.length, 12);
  assert.ok(peaks.every((p) => p >= 0.1 && p <= 1));
  assert.ok(peaks[0] > peaks[10]);
});

test('formatDuration and formatFileSize format cleanly', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(15360), '15 KB');
  assert.equal(formatFileSize(2 * 1024 * 1024), '2.00 MB');
});
