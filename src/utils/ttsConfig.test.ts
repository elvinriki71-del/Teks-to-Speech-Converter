import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDownloadFilename,
  buildSpeechStylePrompt,
  MAX_TEXT_LENGTH,
  splitTextIntoChunks,
  validateTtsInput,
} from './ttsConfig';

test('validateTtsInput rejects empty or whitespace-only text', () => {
  const empty = validateTtsInput('   \n  ');
  assert.equal(empty.valid, false);
  assert.ok(empty.error);
  assert.equal(empty.wordCount, 0);
});

test('validateTtsInput accepts valid Indonesian text and computes word/duration estimates', () => {
  const res = validateTtsInput('Selamat pagi semuanya, hari ini kita belajar hal baru.');
  assert.equal(res.valid, true);
  assert.equal(res.error, undefined);
  assert.equal(res.wordCount, 9);
  assert.ok(res.estimatedSeconds >= 1);
});

test('validateTtsInput rejects text exceeding MAX_TEXT_LENGTH', () => {
  const tooLong = 'a'.repeat(MAX_TEXT_LENGTH + 1);
  const res = validateTtsInput(tooLong);
  assert.equal(res.valid, false);
  assert.ok(res.error?.includes(String(MAX_TEXT_LENGTH)));
});

test('buildSpeechStylePrompt includes language cue, preset cue, pace cue, and custom style', () => {
  const prompt = buildSpeechStylePrompt({
    language: 'id',
    styleId: 'news',
    pace: 'slow',
    customStyle: 'Tambahkan jeda tegas di akhir kalimat',
  });
  assert.ok(prompt.includes('Native Indonesian speaker'));
  assert.ok(prompt.includes('news anchor'));
  assert.ok(prompt.includes('measured, unhurried pace'));
  assert.ok(prompt.includes('Tambahkan jeda tegas di akhir kalimat'));
});

test('splitTextIntoChunks preserves sentence boundaries for long scripts', () => {
  const s1 = 'Kalimat pertama cukup panjang untuk menguji pemecahan paragraf secara rapi.';
  const s2 = 'Kalimat kedua juga harus tetap utuh tanpa terpotong di tengah kata.';
  const s3 = 'Kalimat ketiga menutup bagian ini dengan jelas.';
  const text = `${s1} ${s2} ${s3}`;

  const chunks = splitTextIntoChunks(text, 90);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0], s1);
  assert.equal(chunks[1], s2);
  assert.equal(chunks[2], s3);
});

test('buildDownloadFilename generates clean lowercase .wav filename', () => {
  const name = buildDownloadFilename('Halo Dunia! Apa kabar hari ini?', 'id', 'Kore');
  assert.equal(name, 'suarastudio-id-kore-halo-dunia-apa-kabar-hari-ini.wav');
});
