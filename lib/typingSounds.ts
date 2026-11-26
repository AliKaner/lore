"use client";

import type { TypingSound } from "@/lib/writingModes";

// Typing sounds made on the spot with Web Audio: short bursts of filtered
// noise for the strike and a falling tone for the body of each key, varied a
// little every time so it doesn't sound like a loop.

export type KeyKind = "char" | "space" | "enter" | "backspace";

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function noiseBuffer(ac: AudioContext) {
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

const vary = (value: number, amount = 0.08) => value * (1 + (Math.random() * 2 - 1) * amount);

// A burst of noise through a filter, shaped by a quick attack and decay.
function burst(
  ac: AudioContext,
  out: AudioNode,
  at: number,
  { type, freq, q = 1, duration, gain }: { type: BiquadFilterType; freq: number; q?: number; duration: number; gain: number },
) {
  const source = ac.createBufferSource();
  source.buffer = noiseBuffer(ac);
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(filter).connect(env).connect(out);
  source.start(at, Math.random() * 0.4);
  source.stop(at + duration + 0.02);
}

// A short tone that falls in pitch: the wood and metal of the key.
function thump(
  ac: AudioContext,
  out: AudioNode,
  at: number,
  { from, to, duration, gain, type = "sine" }: { from: number; to: number; duration: number; gain: number; type?: OscillatorType },
) {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + duration);
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(env).connect(out);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

function bell(ac: AudioContext, out: AudioNode, at: number, gain: number) {
  for (const [freq, level, decay] of [
    [2093, 1, 1.4],
    [4186, 0.35, 0.8],
    [6280, 0.12, 0.5],
  ] as const) {
    thump(ac, out, at, { from: freq, to: freq * 0.995, duration: decay, gain: gain * level });
  }
}

export function playKey(sound: TypingSound, key: KeyKind, volume: number) {
  if (sound === "none" || volume <= 0) return;
  const ac = audio();
  if (!ac) return;
  const out = ac.createGain();
  out.gain.value = volume;
  out.connect(ac.destination);
  const t = ac.currentTime + 0.001;
  const heavy = key === "space" || key === "enter";

  switch (sound) {
    case "daktilo": {
      burst(ac, out, t, { type: "bandpass", freq: vary(2600, 0.15), q: 1.4, duration: 0.03, gain: 0.9 });
      thump(ac, out, t, { from: vary(heavy ? 150 : 210), to: 70, duration: heavy ? 0.09 : 0.06, gain: 0.55 });
      if (key === "enter") {
        // The carriage running back, then the bell.
        for (let i = 0; i < 9; i++) {
          burst(ac, out, t + 0.05 + i * 0.022, { type: "highpass", freq: 3000, duration: 0.012, gain: 0.25 });
        }
        bell(ac, out, t + 0.28, 0.22);
      }
      break;
    }
    case "mekanik": {
      burst(ac, out, t, { type: "highpass", freq: vary(3800, 0.1), duration: 0.012, gain: 0.7 });
      thump(ac, out, t + 0.004, {
        from: vary(heavy ? 180 : 320),
        to: heavy ? 90 : 150,
        duration: heavy ? 0.08 : 0.045,
        gain: heavy ? 0.6 : 0.4,
        type: "triangle",
      });
      burst(ac, out, t + vary(0.07, 0.2), { type: "bandpass", freq: 1800, q: 2, duration: 0.02, gain: 0.18 });
      break;
    }
    case "yumusak": {
      burst(ac, out, t, { type: "lowpass", freq: vary(1300, 0.15), duration: heavy ? 0.05 : 0.032, gain: 0.35 });
      thump(ac, out, t, { from: vary(heavy ? 200 : 280), to: 120, duration: 0.035, gain: 0.18 });
      break;
    }
    case "kalem": {
      if (key === "space") break;
      const strokes = key === "enter" ? 1 : 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < strokes; i++) {
        burst(ac, out, t + i * vary(0.045, 0.3), {
          type: "bandpass",
          freq: vary(4200, 0.25),
          q: 0.8,
          duration: vary(key === "enter" ? 0.16 : 0.06, 0.3),
          gain: vary(0.22, 0.3),
        });
      }
      break;
    }
  }
  window.setTimeout(() => out.disconnect(), 2000);
}

export function keyKind(event: KeyboardEvent): KeyKind | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.key === "Enter") return "enter";
  if (event.key === " ") return "space";
  if (event.key === "Backspace" || event.key === "Delete") return "backspace";
  if (event.key.length === 1) return "char";
  return null;
}
